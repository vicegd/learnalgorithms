"""
learnalgorithms.dev API.

A small HTTP API written only with the Python standard library, so that it has
no third-party dependencies to keep up to date or to audit.

Endpoints
---------
GET  /health                    Liveness check.
POST /feedback                  "Was this page helpful?" vote, with an optional comment.
GET  /feedback/summary?page=... Aggregated votes of one page.
GET  /popular                   Most read lessons of the last 7 days (from Matomo).
POST /events                    Anonymous student/usage telemetry events.
POST /webhooks/github           GitHub "issues" events, verified with HMAC-SHA256.
GET  /admin/feedback            Latest votes and comments (Bearer token).
GET  /admin/stats               Aggregated telemetry for teaching innovation (Bearer token).
GET  /admin/events              Raw anonymized telemetry events in JSON or CSV (Bearer token).

Security
--------
* Strict input validation; SQL only with bound parameters.
* CORS limited to ALLOWED_ORIGIN; JSON only; small request bodies.
* Rate limiting per IP, keyed by a salted hash that rotates every day.
  IP addresses are never stored or logged.
* Bot protection without captchas: a honeypot field and a minimum time on page.
* Secrets (Matomo token, webhook secret, admin token) only in environment
  variables; tokens compared in constant time.
* Restrictive security headers on every response.
"""
import csv
import datetime as dt
import hashlib
import hmac
import io
import json
import logging
import os
import re
import secrets
import sqlite3
import threading
import time
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# --------------------------------------------------------------------------- config

ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "https://learnalgorithms.dev")
DB_PATH = os.environ.get("DB_PATH", "/data/api.sqlite3")
MATOMO_URL = os.environ.get("MATOMO_URL", "https://stats.garcia.at/")
MATOMO_SITE_ID = os.environ.get("MATOMO_SITE_ID", "7")
MATOMO_TOKEN = os.environ.get("MATOMO_TOKEN", "")
GITHUB_WEBHOOK_SECRET = os.environ.get("GITHUB_WEBHOOK_SECRET", "")
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")
TRUST_PROXY = os.environ.get("TRUST_PROXY", "1") == "1"
PORT = int(os.environ.get("PORT", "8080"))

MAX_BODY = 4 * 1024             # bytes, public endpoints
MAX_WEBHOOK_BODY = 512 * 1024   # bytes, GitHub webhooks
MAX_COMMENT = 500               # characters
MAX_META = 512                  # bytes, serialized event metadata
MAX_EVENT_BATCH = 20            # events per POST /events request
MAX_DURATION_MS = 3_600_000     # 1 hour cap per page_leave event
MIN_TIME_ON_PAGE_MS = 3000      # faster submissions are treated as bots
RATE_LIMIT = 60                 # votes per window and IP (a campus may share one IP)
EVENT_RATE_LIMIT = 1200         # telemetry events per window and IP
READ_RATE_LIMIT = 600           # read requests per window and IP
RATE_WINDOW = 3600              # seconds
POPULAR_TTL = 900               # seconds the Matomo answer is cached

PAGE_RE = re.compile(r"^/concepts(/[a-z0-9][a-z0-9-]{0,80}){1,3}/?$")
TELEMETRY_PAGE_RE = re.compile(
    r"^/(?:(?:concepts|algorithms)(?:/[a-z0-9][a-z0-9-]{0,80}){0,3}|cheat-sheet|knowledge-graph|stats)?/?$"
)
ALLOWED_EVENT_TYPES = frozenset({
    "page_view",
    "page_leave",
    "lesson_complete",
    "lesson_uncomplete",
    "cheat_sheet_filter",
    "cheat_sheet_compare",
    "visualizer_interact",
    "search",
    "details_open",
    "resource_click",
    "web_vitals",
})
CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
CLIENT_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")

SECURITY_HEADERS = {
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cross-Origin-Resource-Policy": "cross-origin",
}

log = logging.getLogger("api")

# --------------------------------------------------------------------------- storage

SCHEMA = """
CREATE TABLE IF NOT EXISTS feedback (
    id       INTEGER PRIMARY KEY,
    page     TEXT    NOT NULL,
    helpful  INTEGER NOT NULL CHECK (helpful IN (0, 1)),
    comment  TEXT,
    day      TEXT    NOT NULL,
    voter    TEXT    NOT NULL,
    UNIQUE (page, day, voter)
);
CREATE INDEX IF NOT EXISTS feedback_page ON feedback (page);
CREATE TABLE IF NOT EXISTS github_issues (
    delivery TEXT PRIMARY KEY,
    action   TEXT NOT NULL,
    number   INTEGER,
    title    TEXT,
    url      TEXT,
    received TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS telemetry_events (
    id          INTEGER PRIMARY KEY,
    ts          TEXT    NOT NULL,
    day         TEXT    NOT NULL,
    session_id  TEXT    NOT NULL,
    event_type  TEXT    NOT NULL,
    page        TEXT    NOT NULL,
    duration_ms INTEGER,
    scroll_pct  INTEGER,
    meta        TEXT
);
CREATE INDEX IF NOT EXISTS telemetry_day ON telemetry_events (day);
CREATE INDEX IF NOT EXISTS telemetry_type ON telemetry_events (event_type);
CREATE INDEX IF NOT EXISTS telemetry_page ON telemetry_events (page);
"""


class Store:
    def __init__(self, path):
        self.lock = threading.Lock()
        self.db = sqlite3.connect(path, check_same_thread=False)
        self.db.executescript(SCHEMA)
        self.db.commit()

    def add_vote(self, page, helpful, comment, day, voter):
        """Returns False if this client already voted for this page today."""
        with self.lock:
            try:
                self.db.execute(
                    "INSERT INTO feedback (page, helpful, comment, day, voter) VALUES (?, ?, ?, ?, ?)",
                    (page, 1 if helpful else 0, comment, day, voter),
                )
                self.db.commit()
                return True
            except sqlite3.IntegrityError:
                return False

    def summary(self, page):
        with self.lock:
            row = self.db.execute(
                "SELECT COALESCE(SUM(helpful), 0), COUNT(*) FROM feedback WHERE page = ?", (page,)
            ).fetchone()
        return {"page": page, "helpful": row[0], "notHelpful": row[1] - row[0]}

    def latest(self, limit=200):
        with self.lock:
            rows = self.db.execute(
                "SELECT page, helpful, comment, day FROM feedback ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()
        return [{"page": p, "helpful": bool(h), "comment": c, "day": d} for p, h, c, d in rows]

    def add_issue_event(self, delivery, action, number, title, url):
        with self.lock:
            self.db.execute(
                "INSERT OR IGNORE INTO github_issues VALUES (?, ?, ?, ?, ?, ?)",
                (delivery, action, number, title, url, dt.datetime.now(dt.timezone.utc).isoformat()),
            )
            self.db.commit()

    def latest_issues(self, limit=200):
        with self.lock:
            rows = self.db.execute(
                "SELECT delivery, action, number, title, url, received FROM github_issues ORDER BY received DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [
            {
                "delivery": d,
                "action": a,
                "number": n,
                "title": t,
                "url": u,
                "received": r,
            }
            for d, a, n, t, u, r in rows
        ]

    def add_events(self, events):
        now_dt = dt.datetime.now(dt.timezone.utc)
        ts = now_dt.isoformat()
        day = now_dt.date().isoformat()
        rows = [
            (
                ts,
                day,
                e["session_id"],
                e["event_type"],
                e["page"],
                e["duration_ms"],
                e["scroll_pct"],
                e["meta"],
            )
            for e in events
        ]
        with self.lock:
            self.db.executemany(
                """INSERT INTO telemetry_events
                   (ts, day, session_id, event_type, page, duration_ms, scroll_pct, meta)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                rows,
            )
            self.db.commit()
        return len(rows)

    def stats_summary(self, days=30):
        all_time = days == 0
        cutoff = None if all_time else (dt.date.today() - dt.timedelta(days=max(1, days) - 1)).isoformat()
        where = "" if all_time else "WHERE day >= ?"
        and_where = "" if all_time else "AND day >= ?"
        params = () if all_time else (cutoff,)
        with self.lock:
            totals = self.db.execute(
                f"""SELECT COUNT(*), COUNT(DISTINCT session_id), COUNT(DISTINCT day)
                    FROM telemetry_events {where}""",
                params,
            ).fetchone()
            by_type = self.db.execute(
                f"""SELECT event_type, COUNT(*)
                    FROM telemetry_events {where}
                    GROUP BY event_type ORDER BY COUNT(*) DESC""",
                params,
            ).fetchall()
            top_pages = self.db.execute(
                f"""SELECT page,
                           SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS views,
                           COUNT(DISTINCT session_id) AS sessions,
                           ROUND(AVG(CASE WHEN event_type = 'page_leave' AND duration_ms IS NOT NULL THEN duration_ms END)) AS avg_ms,
                           ROUND(AVG(CASE WHEN event_type = 'page_leave' AND scroll_pct IS NOT NULL THEN scroll_pct END)) AS avg_scroll
                    FROM telemetry_events
                    WHERE event_type IN ('page_view', 'page_leave') {and_where}
                    GROUP BY page
                    ORDER BY views DESC, sessions DESC
                    LIMIT 200""",
                params,
            ).fetchall()
            completions = self.db.execute(
                f"""SELECT page,
                           SUM(CASE WHEN event_type = 'lesson_complete' THEN 1 ELSE 0 END) AS completed,
                           SUM(CASE WHEN event_type = 'lesson_uncomplete' THEN 1 ELSE 0 END) AS uncompleted
                    FROM telemetry_events
                    WHERE event_type IN ('lesson_complete', 'lesson_uncomplete') {and_where}
                    GROUP BY page
                    ORDER BY completed DESC
                    LIMIT 200""",
                params,
            ).fetchall()
            daily = self.db.execute(
                f"""SELECT day,
                           COUNT(DISTINCT session_id) AS sessions,
                           SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS page_views,
                           SUM(CASE WHEN event_type = 'lesson_complete' THEN 1 ELSE 0 END) AS completions
                    FROM telemetry_events
                    {where}
                    GROUP BY day
                    ORDER BY day DESC""",
                params,
            ).fetchall()
        return {
            "days": days,
            "since": cutoff,
            "totals": {
                "events": totals[0],
                "sessions": totals[1],
                "activeDays": totals[2],
            },
            "eventsByType": {t: c for t, c in by_type},
            "topPages": [
                {
                    "page": p,
                    "views": v or 0,
                    "sessions": s or 0,
                    "avgDurationMs": int(ms) if ms is not None else None,
                    "avgScrollPct": int(sc) if sc is not None else None,
                }
                for p, v, s, ms, sc in top_pages
            ],
            "lessonCompletions": [
                {"page": p, "completed": c or 0, "uncompleted": u or 0}
                for p, c, u in completions
            ],
            "daily": [
                {
                    "day": d,
                    "sessions": s or 0,
                    "pageViews": pv or 0,
                    "completions": comp or 0,
                }
                for d, s, pv, comp in daily
            ],
        }

    def latest_events(self, days=30, limit=500, offset=0):
        all_time = days == 0
        cutoff = None if all_time else (dt.date.today() - dt.timedelta(days=max(1, days) - 1)).isoformat()
        where = "" if all_time else "WHERE day >= ?"
        params = () if all_time else (cutoff,)
        with self.lock:
            total = self.db.execute(
                f"SELECT COUNT(*) FROM telemetry_events {where}",
                params,
            ).fetchone()[0]
            rows = self.db.execute(
                f"""SELECT ts, day, session_id, event_type, page, duration_ms, scroll_pct, meta
                    FROM telemetry_events
                    {where}
                    ORDER BY id DESC
                    LIMIT ? OFFSET ?""",
                (*params, limit, offset),
            ).fetchall()
        events = [
            {
                "ts": ts,
                "day": day,
                "sessionId": sid,
                "eventType": et,
                "page": pg,
                "durationMs": dur,
                "scrollPct": sc,
                "meta": json.loads(m) if m else None,
            }
            for ts, day, sid, et, pg, dur, sc, m in rows
        ]
        return events, total


# --------------------------------------------------------------------------- helpers


class DailyHasher:
    """Pseudonymous client key: HMAC of the IP with a random salt that changes
    every day and is never written to disk, so keys cannot be linked across days
    or reversed to an IP address."""

    def __init__(self):
        self.lock = threading.Lock()
        self.day = None
        self.salt = None

    def key(self, ip):
        today = dt.date.today().isoformat()
        with self.lock:
            if today != self.day:
                self.day, self.salt = today, secrets.token_bytes(32)
            return hmac.new(self.salt, ip.encode(), hashlib.sha256).hexdigest()[:32]


class RateLimiter:
    def __init__(self, limit, window):
        self.limit, self.window = limit, window
        self.lock = threading.Lock()
        self.hits = {}

    def allow(self, key, now=None):
        now = now or time.monotonic()
        with self.lock:
            recent = [t for t in self.hits.get(key, []) if now - t < self.window]
            if len(recent) >= self.limit:
                self.hits[key] = recent
                return False
            recent.append(now)
            self.hits[key] = recent
            if len(self.hits) > 50_000:  # bound memory under abuse
                self.hits = {k: v for k, v in self.hits.items() if v and now - v[-1] < self.window}
            return True


def clean_comment(value):
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError("comment must be a string")
    value = CONTROL_RE.sub("", value).strip()
    if len(value) > MAX_COMMENT:
        raise ValueError("comment too long")
    return value or None


def valid_page(value):
    return isinstance(value, str) and len(value) <= 200 and bool(PAGE_RE.match(value))


def valid_telemetry_page(value):
    return isinstance(value, str) and len(value) <= 200 and bool(TELEMETRY_PAGE_RE.match(value))


def clean_meta(value):
    if value is None:
        return None
    if not isinstance(value, dict):
        raise ValueError("meta must be an object")
    cleaned = {}
    for k, v in value.items():
        if not isinstance(k, str) or len(k) > 32:
            raise ValueError("invalid meta key")
        key = CONTROL_RE.sub("", k).strip()
        if not key:
            continue
        if isinstance(v, str):
            cleaned[key] = CONTROL_RE.sub("", v).strip()[:120]
        elif isinstance(v, (int, float, bool)) or v is None:
            cleaned[key] = v
        else:
            raise ValueError("invalid meta value")
    if not cleaned:
        return None
    encoded = json.dumps(cleaned, separators=(",", ":"))
    if len(encoded.encode("utf-8")) > MAX_META:
        raise ValueError("meta too large")
    return encoded


def parse_event(raw):
    if not isinstance(raw, dict):
        raise ValueError("event must be an object")
    event_type = raw.get("eventType")
    if not isinstance(event_type, str) or event_type not in ALLOWED_EVENT_TYPES:
        raise ValueError("invalid eventType")
    page = raw.get("page")
    if not valid_telemetry_page(page):
        raise ValueError("invalid page")
    normalized_page = "/" if page in ("", "/") else page.rstrip("/")
    session_id = raw.get("sessionId")
    if not isinstance(session_id, str) or not CLIENT_RE.match(session_id):
        raise ValueError("invalid sessionId")
    duration_ms = raw.get("durationMs")
    if duration_ms is not None:
        if isinstance(duration_ms, bool) or not isinstance(duration_ms, int):
            raise ValueError("invalid durationMs")
        duration_ms = max(0, min(duration_ms, MAX_DURATION_MS))
    scroll_pct = raw.get("scrollPct")
    if scroll_pct is not None:
        if isinstance(scroll_pct, bool) or not isinstance(scroll_pct, int):
            raise ValueError("invalid scrollPct")
        scroll_pct = max(0, min(scroll_pct, 100))
    meta = clean_meta(raw.get("meta"))
    return {
        "session_id": session_id,
        "event_type": event_type,
        "page": normalized_page,
        "duration_ms": duration_ms,
        "scroll_pct": scroll_pct,
        "meta": meta,
    }


def csv_safe(value):
    """Neutralize spreadsheet formula injection (CWE-1236) on text cells."""
    if value is None:
        return ""
    s = str(value)
    if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + s
    return s


def events_to_csv(events):
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["ts", "day", "sessionId", "eventType", "page", "durationMs", "scrollPct", "meta"])
    for e in events:
        meta_str = "" if e["meta"] is None else json.dumps(e["meta"], separators=(",", ":"))
        writer.writerow([
            csv_safe(e["ts"]),
            csv_safe(e["day"]),
            csv_safe(e["sessionId"]),
            csv_safe(e["eventType"]),
            csv_safe(e["page"]),
            "" if e["durationMs"] is None else e["durationMs"],
            "" if e["scrollPct"] is None else e["scrollPct"],
            csv_safe(meta_str),
        ])
    return buf.getvalue().encode("utf-8")


def verify_github_signature(secret, body, header):
    if not secret or not header or not header.startswith("sha256="):
        return False
    expected = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header)


class PopularCache:
    def __init__(self, ttl):
        self.ttl = ttl
        self.lock = threading.Lock()
        self.value, self.when = None, 0.0

    def get(self, fetch):
        with self.lock:
            if self.value is not None and time.monotonic() - self.when < self.ttl:
                return self.value
        value = fetch()
        with self.lock:
            self.value, self.when = value, time.monotonic()
        return value


def fetch_popular_from_matomo(limit=5):
    """Most visited /concepts pages of the last 7 days. The token is sent in the
    POST body, never in the URL, so it does not appear in any access log."""
    if not MATOMO_TOKEN:
        return []
    query = urllib.parse.urlencode({
        "module": "API", "method": "Actions.getPageUrls", "idSite": MATOMO_SITE_ID,
        "period": "range", "date": "last7", "flat": 1, "format": "JSON", "filter_limit": 200,
    })
    req = urllib.request.Request(
        MATOMO_URL.rstrip("/") + "/index.php?" + query,
        data=urllib.parse.urlencode({"token_auth": MATOMO_TOKEN}).encode(),
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        rows = json.loads(resp.read(2_000_000))
    pages = {}
    for row in rows if isinstance(rows, list) else []:
        url = row.get("url") or ""
        path = urllib.parse.urlparse(url).path.rstrip("/")
        if valid_page(path) and "/tags" not in path:
            pages[path] = pages.get(path, 0) + int(row.get("nb_visits", 0))
    top = sorted(pages.items(), key=lambda kv: kv[1], reverse=True)[:limit]
    return [{"page": p, "visits": v} for p, v in top]


# --------------------------------------------------------------------------- HTTP


class App:
    def __init__(self, store, popular_fetch=fetch_popular_from_matomo):
        self.store = store
        self.hasher = DailyHasher()
        self.limiter = RateLimiter(RATE_LIMIT, RATE_WINDOW)
        self.event_limiter = RateLimiter(EVENT_RATE_LIMIT, RATE_WINDOW)
        self.read_limiter = RateLimiter(READ_RATE_LIMIT, RATE_WINDOW)
        self.popular = PopularCache(POPULAR_TTL)
        self.popular_fetch = popular_fetch


def make_handler(app):
    class Handler(BaseHTTPRequestHandler):
        server_version = "api"
        sys_version = ""

        # -- plumbing ---------------------------------------------------------

        def log_message(self, fmt, *args):  # no IP addresses in the logs
            log.info("%s %s", self.command, self.path.split("?")[0])

        def client_ip(self):
            if TRUST_PROXY and self.headers.get("X-Real-IP"):
                return self.headers["X-Real-IP"].strip()
            return self.client_address[0]

        def send_json(self, status, payload=None, extra=None):
            body = b"" if payload is None else json.dumps(payload).encode()
            self.send_response(status)
            for k, v in SECURITY_HEADERS.items():
                self.send_header(k, v)
            if self.headers.get("Origin") == ALLOWED_ORIGIN:
                self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
                self.send_header("Vary", "Origin")
            for k, v in (extra or {}).items():
                self.send_header(k, v)
            if payload is not None:
                self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if body and self.command != "HEAD":
                self.wfile.write(body)

        def read_body(self, limit):
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                return None
            if length <= 0 or length > limit:
                return None
            return self.rfile.read(length)

        def read_json(self, limit=MAX_BODY):
            ctype = (self.headers.get("Content-Type") or "").split(";")[0].strip().lower()
            if ctype != "application/json":
                return None
            body = self.read_body(limit)
            if body is None:
                return None
            try:
                data = json.loads(body)
            except (ValueError, UnicodeDecodeError):
                return None
            return data if isinstance(data, dict) else None

        def rate_limited(self, limiter=None):
            if (limiter or app.limiter).allow(app.hasher.key(self.client_ip())):
                return False
            self.send_json(429, {"error": "too many requests"}, {"Retry-After": str(RATE_WINDOW)})
            return True

        # -- routes ---------------------------------------------------------------

        def do_OPTIONS(self):
            if self.headers.get("Origin") != ALLOWED_ORIGIN:
                return self.send_json(403, {"error": "origin not allowed"})
            self.send_json(204, None, {
                "Access-Control-Allow-Methods": "GET, POST",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Max-Age": "86400",
            })

        def do_GET(self):
            url = urllib.parse.urlparse(self.path)
            if url.path == "/health":
                return self.send_json(200, {"status": "ok"})
            if url.path == "/feedback/summary":
                if self.rate_limited(app.read_limiter):
                    return
                page = urllib.parse.parse_qs(url.query).get("page", [""])[0]
                if not valid_page(page):
                    return self.send_json(400, {"error": "invalid page"})
                return self.send_json(200, app.store.summary(page.rstrip("/")))
            if url.path == "/popular":
                try:
                    data = app.popular.get(app.popular_fetch)
                except Exception:  # Matomo down: degrade gracefully
                    log.exception("popular: Matomo request failed")
                    data = []
                return self.send_json(200, {"pages": data}, {"Cache-Control": "public, max-age=300"})
            if url.path == "/admin/feedback":
                auth = self.headers.get("Authorization", "")
                if not ADMIN_TOKEN or not hmac.compare_digest(auth, "Bearer " + ADMIN_TOKEN):
                    return self.send_json(401, {"error": "unauthorized"}, {"WWW-Authenticate": "Bearer"})
                return self.send_json(200, {"feedback": app.store.latest()}, {"Cache-Control": "no-store"})
            if url.path == "/admin/issues":
                auth = self.headers.get("Authorization", "")
                if not ADMIN_TOKEN or not hmac.compare_digest(auth, "Bearer " + ADMIN_TOKEN):
                    return self.send_json(401, {"error": "unauthorized"}, {"WWW-Authenticate": "Bearer"})
                return self.send_json(200, {"issues": app.store.latest_issues()}, {"Cache-Control": "no-store"})
            if url.path == "/admin/stats":
                auth = self.headers.get("Authorization", "")
                if not ADMIN_TOKEN or not hmac.compare_digest(auth, "Bearer " + ADMIN_TOKEN):
                    return self.send_json(401, {"error": "unauthorized"}, {"WWW-Authenticate": "Bearer"})
                qs = urllib.parse.parse_qs(url.query)
                raw_days = qs.get("days", ["30"])[0]
                try:
                    days = 0 if raw_days == "all" else max(0, min(3650, int(raw_days)))
                except ValueError:
                    return self.send_json(400, {"error": "invalid days"})
                return self.send_json(200, app.store.stats_summary(days), {"Cache-Control": "no-store"})
            if url.path == "/admin/events":
                auth = self.headers.get("Authorization", "")
                if not ADMIN_TOKEN or not hmac.compare_digest(auth, "Bearer " + ADMIN_TOKEN):
                    return self.send_json(401, {"error": "unauthorized"}, {"WWW-Authenticate": "Bearer"})
                qs = urllib.parse.parse_qs(url.query)
                fmt = qs.get("format", ["json"])[0]
                raw_days = qs.get("days", ["30"])[0]
                max_limit = 50000 if fmt == "csv" else 5000
                try:
                    days = 0 if raw_days == "all" else max(0, min(3650, int(raw_days)))
                    limit = max(1, min(max_limit, int(qs.get("limit", ["500"])[0])))
                    offset = max(0, int(qs.get("offset", ["0"])[0]))
                except ValueError:
                    return self.send_json(400, {"error": "invalid query"})
                events, total = app.store.latest_events(days=days, limit=limit, offset=offset)
                if fmt == "csv":
                    body = events_to_csv(events)
                    self.send_response(200)
                    for k, v in SECURITY_HEADERS.items():
                        self.send_header(k, v)
                    if self.headers.get("Origin") == ALLOWED_ORIGIN:
                        self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
                        self.send_header("Vary", "Origin")
                    self.send_header("Cache-Control", "no-store")
                    self.send_header("Content-Type", "text/csv; charset=utf-8")
                    self.send_header("Content-Disposition", 'attachment; filename="learnalgorithms-events.csv"')
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()
                    if self.command != "HEAD":
                        self.wfile.write(body)
                    return
                return self.send_json(
                    200,
                    {"events": events, "total": total, "limit": limit, "offset": offset},
                    {"Cache-Control": "no-store"},
                )
            self.send_json(404, {"error": "not found"})

        def do_POST(self):
            path = urllib.parse.urlparse(self.path).path
            if path == "/feedback":
                return self.post_feedback()
            if path == "/events":
                return self.post_events()
            if path == "/webhooks/github":
                return self.post_github()
            self.send_json(404, {"error": "not found"})

        def post_events(self):
            if self.headers.get("Origin") != ALLOWED_ORIGIN:
                return self.send_json(403, {"error": "origin not allowed"})
            if self.rate_limited(app.event_limiter):
                return
            data = self.read_json()
            if data is None:
                return self.send_json(400, {"error": "invalid request"})
            raw_events = data.get("events") if "events" in data else [data]
            if not isinstance(raw_events, list) or not (1 <= len(raw_events) <= MAX_EVENT_BATCH):
                return self.send_json(400, {"error": "invalid events batch"})
            try:
                parsed = [parse_event(item) for item in raw_events]
            except ValueError as e:
                return self.send_json(400, {"error": str(e)})
            stored = app.store.add_events(parsed)
            self.send_json(201, {"status": "stored", "count": stored}, {"Cache-Control": "no-store"})

        def post_feedback(self):
            if self.headers.get("Origin") != ALLOWED_ORIGIN:
                return self.send_json(403, {"error": "origin not allowed"})
            if self.rate_limited():
                return
            data = self.read_json()
            if data is None:
                return self.send_json(400, {"error": "invalid request"})
            # Bots: the honeypot field must stay empty, and nobody votes in < 3 s.
            if data.get("website") or not isinstance(data.get("elapsed"), int) \
                    or data["elapsed"] < MIN_TIME_ON_PAGE_MS:
                return self.send_json(202, {"status": "accepted"})  # do not reveal the check
            page, helpful = data.get("page"), data.get("helpful")
            if not valid_page(page) or not isinstance(helpful, bool):
                return self.send_json(400, {"error": "invalid request"})
            try:
                comment = clean_comment(data.get("comment"))
            except ValueError as e:
                return self.send_json(400, {"error": str(e)})
            # One vote per page and day. Students behind the same campus IP are
            # told apart by a random identifier that the browser creates when it
            # first votes; it is hashed together with the IP and never stored.
            client = data.get("client")
            if client is not None and not (isinstance(client, str) and CLIENT_RE.match(client)):
                return self.send_json(400, {"error": "invalid request"})
            voter = app.hasher.key(self.client_ip() + "|" + (client or ""))
            stored = app.store.add_vote(page.rstrip("/"), helpful, comment,
                                        dt.date.today().isoformat(), voter)
            self.send_json(201 if stored else 200, {"status": "stored" if stored else "already voted"},
                           {"Cache-Control": "no-store"})

        def post_github(self):
            body = self.read_body(MAX_WEBHOOK_BODY)
            if body is None:
                return self.send_json(400, {"error": "invalid request"})
            if not verify_github_signature(GITHUB_WEBHOOK_SECRET, body,
                                           self.headers.get("X-Hub-Signature-256")):
                return self.send_json(401, {"error": "invalid signature"})
            event = self.headers.get("X-GitHub-Event", "")
            if event == "ping":
                return self.send_json(200, {"status": "pong"})
            if event != "issues":
                return self.send_json(202, {"status": "ignored"})
            try:
                data = json.loads(body)
                issue = data["issue"]
                app.store.add_issue_event(
                    str(self.headers.get("X-GitHub-Delivery", ""))[:64], str(data.get("action", ""))[:32],
                    int(issue.get("number", 0)), str(issue.get("title", ""))[:300],
                    str(issue.get("html_url", ""))[:300],
                )
            except (ValueError, KeyError, TypeError, AttributeError):
                return self.send_json(400, {"error": "invalid payload"})
            self.send_json(204)

        do_HEAD = do_GET

    return Handler


def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    app = App(Store(DB_PATH))
    server = ThreadingHTTPServer(("0.0.0.0", PORT), make_handler(app))
    server.daemon_threads = True
    log.info("listening on port %d", PORT)
    server.serve_forever()


if __name__ == "__main__":
    main()
