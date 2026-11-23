#!/usr/bin/env python3
"""
Reproducible ETL pipeline for learnalgorithms.dev teaching-innovation analytics.

Extracts anonymized telemetry events from SQLite (api.sqlite3) or from an
exported CSV (/admin/events?format=csv), cleans and aggregates learning metrics
(reading time, scroll depth, zero-result searches, opened checkpoints, Core Web
Vitals), and outputs structured JSON and a Markdown report ready for annual
teaching-innovation reports.

Standard library only (no third-party packages).
"""
import argparse
import csv
import json
import re
import sqlite3
import statistics
from collections import Counter, defaultdict
from pathlib import Path

STOPWORDS = frozenset({
    # English
    "the", "and", "for", "that", "this", "with", "from", "have", "was", "were", "are", "but",
    "not", "you", "your", "very", "more", "some", "into", "about", "just", "like", "what",
    "when", "where", "which", "how", "can", "could", "would", "should", "there", "their",
    "been", "being", "than", "then", "also", "only", "page", "lesson",
    # Spanish
    "los", "las", "una", "uno", "unos", "unas", "para", "por", "con", "sin", "sobre", "entre",
    "como", "pero", "mas", "muy", "este", "esta", "estos", "estas", "eso", "esa", "todo",
    "toda", "todos", "que", "del", "hay", "ser", "esta", "son", "fue", "tiene", "bien",
})
TOKEN_RE = re.compile(r"[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]{3,}")

INTENT_LEXICON = {
    "bug_typo": ("typo", "error", "broken", "bug", "wrong", "errata", "fallo", "roto", "mal", "incorrect"),
    "confusion": ("confus", "unclear", "hard", "difficult", "understand", "duda", "entiendo", "difícil", "dificil", "claro", "explic"),
    "suggestion": ("add", "more", "example", "diagram", "visual", "improve", "añadir", "ejemplo", "mejorar", "falt", "suggest", "would be"),
    "positive": ("great", "clear", "helpful", "good", "nice", "excellent", "thanks", "genial", "claro", "útil", "util", "buen", "gracias", "excelente"),
}


def classify_comment_intent(text, helpful=None):
    low = (text or "").lower()
    for intent in ("bug_typo", "confusion", "suggestion", "positive"):
        if any(kw in low for kw in INTENT_LEXICON[intent]):
            return intent
    if helpful is True:
        return "positive"
    if helpful is False:
        return "confusion"
    return "neutral"


ES_MARKERS = frozenset({
    "que", "los", "las", "una", "para", "por", "con", "muy", "más", "mas", "bien",
    "pero", "este", "esta", "esto", "gracias", "genial", "claro", "ejemplo", "duda", "error", "entiendo",
})


def detect_language(text):
    low = (text or "").lower()
    if any(ch in low for ch in "áéíóúüñ¿¡"):
        return "es"
    words = TOKEN_RE.findall(low)
    es_hits = sum(1 for w in words if w in ES_MARKERS)
    return "es" if es_hits >= 1 else "en"


def polarity_score(text, helpful=None):
    low = (text or "").lower()
    pos = sum(1 for kw in INTENT_LEXICON["positive"] if kw in low)
    neg = sum(1 for kw in INTENT_LEXICON["bug_typo"] + INTENT_LEXICON["confusion"] if kw in low)
    if pos == 0 and neg == 0:
        if helpful is True:
            return 0.5
        if helpful is False:
            return -0.5
        return 0.0
    return round((pos - neg) / (pos + neg), 2)


def analyze_nlp(feedback_list, all_searches):
    term_counts = Counter()
    bigram_counts = Counter()
    intents = Counter()
    languages = Counter()
    polarities = []
    classified_comments = []

    def add_text_ngrams(text, weight=1):
        toks = [t for t in TOKEN_RE.findall((text or "").lower()) if t not in STOPWORDS]
        for t in toks:
            term_counts[t] += weight
        for a, b in zip(toks, toks[1:]):
            bigram_counts[f"{a} {b}"] += weight

    for q, count in all_searches.items():
        add_text_ngrams(q, count)

    for f in feedback_list:
        comment = (f.get("comment") or "").strip()
        if not comment:
            continue
        intent = classify_comment_intent(comment, f.get("helpful"))
        lang = detect_language(comment)
        pol = polarity_score(comment, f.get("helpful"))
        intents[intent] += 1
        languages[lang] += 1
        polarities.append(pol)
        classified_comments.append({
            "page": f.get("page", ""),
            "intent": intent,
            "lang": lang,
            "polarity": pol,
            "comment": comment,
        })
        add_text_ngrams(comment, 1)

    return {
        "analyzedComments": len(classified_comments),
        "avgPolarity": round(statistics.mean(polarities), 2) if polarities else None,
        "languages": dict(languages.most_common()),
        "intentBreakdown": dict(intents.most_common()),
        "topTerms": [{"term": t, "count": c} for t, c in term_counts.most_common(15)],
        "topBigrams": [{"bigram": bg, "count": c} for bg, c in bigram_counts.most_common(10)],
    }


def extract_from_sqlite(db_path):
    conn = sqlite3.connect(db_path)
    try:
        rows = conn.execute(
            """SELECT ts, day, session_id, event_type, page, duration_ms, scroll_pct, meta
               FROM telemetry_events ORDER BY id ASC"""
        ).fetchall()
    finally:
        conn.close()
    events = []
    for ts, day, sid, et, pg, dur, sc, meta_raw in rows:
        meta = json.loads(meta_raw) if meta_raw else {}
        events.append({
            "ts": ts,
            "day": day,
            "sessionId": sid,
            "eventType": et,
            "page": pg,
            "durationMs": dur,
            "scrollPct": sc,
            "meta": meta if isinstance(meta, dict) else {},
        })
    return events


def extract_from_csv(csv_path):
    events = []
    with open(csv_path, encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            meta_str = (row.get("meta") or "").lstrip("'")
            try:
                meta = json.loads(meta_str) if meta_str else {}
            except ValueError:
                meta = {}
            dur = int(row["durationMs"]) if row.get("durationMs") else None
            sc = int(row["scrollPct"]) if row.get("scrollPct") else None
            events.append({
                "ts": row.get("ts", ""),
                "day": row.get("day", ""),
                "sessionId": row.get("sessionId", ""),
                "eventType": row.get("eventType", ""),
                "page": (row.get("page") or "").lstrip("'"),
                "durationMs": dur,
                "scrollPct": sc,
                "meta": meta if isinstance(meta, dict) else {},
            })
    return events


def extract_extras_from_sqlite(db_path):
    conn = sqlite3.connect(db_path)
    feedback, issues = [], []
    try:
        tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
        if "feedback" in tables:
            rows = conn.execute(
                "SELECT page, helpful, comment, day FROM feedback ORDER BY id DESC LIMIT 500"
            ).fetchall()
            feedback = [{"page": p, "helpful": bool(h), "comment": c, "day": d} for p, h, c, d in rows]
        if "github_issues" in tables:
            rows = conn.execute(
                "SELECT delivery, action, number, title, url, received FROM github_issues ORDER BY received DESC LIMIT 200"
            ).fetchall()
            issues = [
                {"delivery": d, "action": a, "number": n, "title": t, "url": u, "received": r}
                for d, a, n, t, u, r in rows
            ]
    finally:
        conn.close()
    return feedback, issues


def percentile(values, p):
    if not values:
        return None
    s = sorted(values)
    idx = min(len(s) - 1, max(0, int(round((p / 100.0) * (len(s) - 1)))))
    return s[idx]


def transform(events, feedback=None, issues=None, popular=None, survey=None):
    sessions = set()
    days = set()
    by_type = Counter()
    page_views = Counter()
    page_durations = defaultdict(list)
    page_scrolls = defaultdict(list)
    completions = Counter()
    uncompletions = Counter()
    zero_searches = Counter()
    all_searches = Counter()
    top_checkpoints = Counter()
    resource_by_kind = Counter()
    cheat_filters = Counter()
    cheat_compares = 0
    daily_events = Counter()
    daily_sessions = defaultdict(set)
    device_counts = Counter()
    ttfb_vals, lcp_vals, cls_vals = [], [], []
    transfer_kb_vals, co2_mg_vals = [], []

    for e in events:
        if e["sessionId"]:
            sessions.add(e["sessionId"])
        if e["day"]:
            days.add(e["day"])
            daily_events[e["day"]] += 1
            if e["sessionId"]:
                daily_sessions[e["day"]].add(e["sessionId"])
        et = e["eventType"]
        by_type[et] += 1
        page = e["page"]
        meta = e.get("meta") or {}

        if et == "page_view":
            page_views[page] += 1
            vp = str(meta.get("viewport") or "")
            if "x" in vp:
                try:
                    w = int(vp.split("x", 1)[0])
                    if w < 768:
                        device_counts["mobile"] += 1
                    elif w < 1024:
                        device_counts["tablet"] += 1
                    else:
                        device_counts["desktop"] += 1
                except ValueError:
                    pass
        elif et == "page_leave":
            if isinstance(e["durationMs"], int) and e["durationMs"] >= 0:
                page_durations[page].append(e["durationMs"])
            if isinstance(e["scrollPct"], int) and 0 <= e["scrollPct"] <= 100:
                page_scrolls[page].append(e["scrollPct"])
        elif et == "lesson_complete":
            completions[page] += 1
        elif et == "lesson_uncomplete":
            uncompletions[page] += 1
        elif et == "search" and meta.get("query"):
            q = str(meta["query"]).strip().lower()
            if q:
                all_searches[q] += 1
                if meta.get("results") == 0:
                    zero_searches[q] += 1
        elif et == "details_open" and meta.get("summary"):
            top_checkpoints[str(meta["summary"])] += 1
        elif et == "resource_click":
            kind = str(meta.get("kind") or "other")
            resource_by_kind[kind] += 1
        elif et == "cheat_sheet_filter":
            label = str(meta.get("paradigm") or meta.get("property") or meta.get("filter") or "filter")
            cheat_filters[label] += 1
        elif et == "cheat_sheet_compare":
            cheat_compares += 1
        elif et == "web_vitals":
            if isinstance(meta.get("ttfbMs"), (int, float)):
                ttfb_vals.append(meta["ttfbMs"])
            if isinstance(meta.get("lcpMs"), (int, float)):
                lcp_vals.append(meta["lcpMs"])
            if isinstance(meta.get("cls"), (int, float)):
                cls_vals.append(meta["cls"])
            if isinstance(meta.get("transferKB"), (int, float)):
                transfer_kb_vals.append(meta["transferKB"])
            if isinstance(meta.get("co2Mg"), (int, float)):
                co2_mg_vals.append(meta["co2Mg"])

    top_pages = []
    for pg, views in page_views.most_common(25):
        durs = page_durations.get(pg, [])
        scs = page_scrolls.get(pg, [])
        top_pages.append({
            "page": pg,
            "views": views,
            "medianDurationSec": round(statistics.median(durs) / 1000.0, 1) if durs else None,
            "avgScrollPct": round(statistics.mean(scs), 1) if scs else None,
            "completions": completions.get(pg, 0),
            "uncompletions": uncompletions.get(pg, 0),
        })

    fb_list = list(feedback or [])
    fb_helpful = sum(1 for f in fb_list if f.get("helpful"))
    fb_not_helpful = len(fb_list) - fb_helpful
    fb_by_page_map = defaultdict(lambda: {"helpful": 0, "notHelpful": 0})
    fb_comments = []
    for f in fb_list:
        pg = f.get("page") or ""
        if f.get("helpful"):
            fb_by_page_map[pg]["helpful"] += 1
        else:
            fb_by_page_map[pg]["notHelpful"] += 1
        if f.get("comment"):
            fb_comments.append({
                "day": f.get("day", ""),
                "page": pg,
                "helpful": bool(f.get("helpful")),
                "comment": str(f.get("comment")),
            })
    fb_by_page = [
        {"page": pg, "helpful": v["helpful"], "notHelpful": v["notHelpful"]}
        for pg, v in sorted(fb_by_page_map.items(), key=lambda kv: -(kv[1]["helpful"] + kv[1]["notHelpful"]))[:20]
    ]

    issues_list = list(issues or [])
    popular_list = list(popular or [])
    nlp = analyze_nlp(fb_list, all_searches)

    daily_activity = [
        {"day": d, "events": daily_events[d], "sessions": len(daily_sessions[d])}
        for d in sorted(daily_events.keys())[-30:]
    ]
    total_dev = sum(device_counts.values())
    devices = {
        "total": total_dev,
        "desktop": device_counts.get("desktop", 0),
        "tablet": device_counts.get("tablet", 0),
        "mobile": device_counts.get("mobile", 0),
    }

    return {
        "totals": {
            "events": len(events),
            "sessions": len(sessions),
            "activeDays": len(days),
            "completions": sum(completions.values()),
            "feedback": len(fb_list),
            "issues": len(issues_list),
        },
        "eventsByType": dict(by_type.most_common()),
        "dailyActivity": daily_activity,
        "devices": devices,
        "topPages": top_pages,
        "popularPages": popular_list,
        "topSearches": [{"query": q, "count": c} for q, c in all_searches.most_common(15)],
        "zeroResultSearches": [{"query": q, "count": c} for q, c in zero_searches.most_common(20)],
        "topCheckpoints": [{"summary": s, "count": c} for s, c in top_checkpoints.most_common(20)],
        "resourceClicks": dict(resource_by_kind.most_common()),
        "cheatSheetUsage": {
            "filters": dict(cheat_filters.most_common(15)),
            "compares": cheat_compares,
        },
        "feedback": {
            "total": len(fb_list),
            "helpful": fb_helpful,
            "notHelpful": fb_not_helpful,
            "byPage": fb_by_page,
            "recentComments": fb_comments[:25],
        },
        "survey": survey or {"total": 0, "averages": {}, "distribution": {}, "entries": []},
        "nlp": nlp,
        "issues": issues_list[:20],
        "webVitals": {
            "samples": max(len(ttfb_vals), len(lcp_vals), len(cls_vals)),
            "ttfbP50Ms": percentile(ttfb_vals, 50),
            "ttfbP95Ms": percentile(ttfb_vals, 95),
            "lcpP50Ms": percentile(lcp_vals, 50),
            "lcpP95Ms": percentile(lcp_vals, 95),
            "clsP95": percentile(cls_vals, 95),
        },
        "greenSoftware": {
            "samples": len(co2_mg_vals),
            "avgTransferKB": round(statistics.mean(transfer_kb_vals), 1) if transfer_kb_vals else None,
            "p95TransferKB": percentile(transfer_kb_vals, 95),
            "avgCo2Mg": round(statistics.mean(co2_mg_vals), 1) if co2_mg_vals else None,
            "totalCo2Grams": round(sum(co2_mg_vals) / 1000.0, 4) if co2_mg_vals else None,
            "rating": (
                "A+" if co2_mg_vals and statistics.mean(co2_mg_vals) < 95 else
                "A" if co2_mg_vals and statistics.mean(co2_mg_vals) < 186 else
                "B" if co2_mg_vals and statistics.mean(co2_mg_vals) < 341 else
                "C" if co2_mg_vals else None
            ),
        },
    }


def render_markdown(report):
    t = report["totals"]
    lines = [
        "# learnalgorithms.dev — Learning Analytics ETL Report",
        "",
        f"- **Total events:** {t['events']}",
        f"- **Anonymous sessions:** {t['sessions']}",
        f"- **Active days:** {t['activeDays']}",
        f"- **Lesson completions:** {t['completions']}",
        f"- **Feedback votes:** {t.get('feedback', 0)}",
        f"- **GitHub issue events:** {t.get('issues', 0)}",
    ]

    if report.get("eventsByType"):
        lines.extend(["", "## Events by Type", ""])
        for et, count in report["eventsByType"].items():
            lines.append(f"- `{et}`: {count}")

    if report.get("dailyActivity"):
        lines.extend([
            "",
            "## Daily Activity",
            "",
            "| Day | Events | Anonymous sessions |",
            "| :--- | ---: | ---: |",
        ])
        for row in report["dailyActivity"]:
            lines.append(f"| {row['day']} | {row['events']} | {row['sessions']} |")

    dev = report.get("devices") or {}
    if dev.get("total", 0) > 0:
        tot = dev["total"]
        lines.extend([
            "",
            "## Devices (Page Views)",
            "",
            f"- **Desktop:** {dev['desktop']} ({round(100 * dev['desktop'] / tot)}%)",
            f"- **Mobile:** {dev['mobile']} ({round(100 * dev['mobile'] / tot)}%)",
            f"- **Tablet:** {dev['tablet']} ({round(100 * dev['tablet'] / tot)}%)",
        ])

    lines.extend([
        "",
        "## Top Pages",
        "",
        "| Page | Views | Median time (s) | Avg scroll (%) | Completions |",
        "| :--- | ---: | ---: | ---: | ---: |",
    ])
    for p in report["topPages"]:
        dur = f"{p['medianDurationSec']}" if p["medianDurationSec"] is not None else "—"
        sc = f"{p['avgScrollPct']}" if p["avgScrollPct"] is not None else "—"
        lines.append(f"| `{p['page']}` | {p['views']} | {dur} | {sc} | {p['completions']} |")

    if report.get("popularPages"):
        lines.extend(["", "## Popular Lessons (Matomo · Last 7 Days)", ""])
        for p in report["popularPages"]:
            lines.append(f"- `{p['page']}`: {p['visits']} visits")

    if report.get("topSearches"):
        lines.extend(["", "## Top Searches", ""])
        for item in report["topSearches"]:
            lines.append(f"- `{item['query']}` ({item['count']})")

    if report["zeroResultSearches"]:
        lines.extend(["", "## Zero-Result Searches (Content Gaps)", ""])
        for item in report["zeroResultSearches"]:
            lines.append(f"- `{item['query']}` ({item['count']})")

    if report["topCheckpoints"]:
        lines.extend(["", "## Most Opened Checkpoints & Solutions", ""])
        for item in report["topCheckpoints"]:
            lines.append(f"- {item['summary']} ({item['count']})")

    res_clicks = report.get("resourceClicks") or {}
    cs = report.get("cheatSheetUsage") or {}
    if res_clicks or cs.get("filters") or cs.get("compares"):
        lines.extend(["", "## Resource Clicks & Cheat Sheet Usage", ""])
        for kind, count in res_clicks.items():
            lines.append(f"- Resource click `{kind}`: {count}")
        if cs.get("compares"):
            lines.append(f"- Cheat Sheet algorithm comparisons: {cs['compares']}")
        for flt, count in (cs.get("filters") or {}).items():
            lines.append(f"- Cheat Sheet filter `{flt}`: {count}")

    fb = report.get("feedback") or {}
    if fb.get("total", 0) > 0:
        lines.extend([
            "",
            "## Student Feedback",
            "",
            f"- **Helpful:** {fb['helpful']} · **Not helpful:** {fb['notHelpful']} (total {fb['total']})",
        ])
        if fb.get("byPage"):
            lines.extend(["", "| Page | Helpful | Not helpful |", "| :--- | ---: | ---: |"])
            for row in fb["byPage"]:
                lines.append(f"| `{row['page']}` | {row['helpful']} | {row['notHelpful']} |")
        if fb.get("recentComments"):
            lines.extend(["", "### Recent Feedback Comments", ""])
            for c in fb["recentComments"]:
                tag = "Helpful" if c["helpful"] else "Not helpful"
                lines.append(f"- [{c['day']}] `{c['page']}` ({tag}): {c['comment']}")

    sv = report.get("survey") or {}
    if sv.get("total", 0) > 0:
        avg = sv.get("averages") or {}
        lines.extend([
            "",
            "## Student Satisfaction Survey (1–5 Scale)",
            "",
            f"- **Total responses:** {sv['total']}",
            f"- **Clarity of explanations:** {avg.get('clarity')} / 5",
            f"- **Usefulness for studying:** {avg.get('usefulness')} / 5",
            f"- **Interactive tools (Cheat Sheet, Knowledge Graph, Audio):** {avg.get('tools')} / 5",
            f"- **Overall satisfaction:** {avg.get('overall')} / 5",
        ])
        sv_comments = [e for e in (sv.get("entries") or []) if e.get("comment")][:15]
        if sv_comments:
            lines.extend(["", "### Recent Survey Comments", ""])
            for c in sv_comments:
                lines.append(f"- [{c['day']}] (overall {c['overall']}/5): {c['comment']}")

    nlp = report.get("nlp") or {}
    if nlp.get("analyzedComments", 0) > 0 or nlp.get("topTerms"):
        lines.extend(["", "## NLP Analysis (Feedback & Search Terms)", ""])
        if nlp.get("intentBreakdown"):
            intents_str = ", ".join(f"`{k}`: {v}" for k, v in nlp["intentBreakdown"].items())
            lines.append(f"- **Comment intent classification ({nlp['analyzedComments']} comments):** {intents_str}")
        if nlp.get("avgPolarity") is not None:
            lines.append(f"- **Average sentiment polarity (-1 to +1):** {nlp['avgPolarity']}")
        if nlp.get("languages"):
            lang_str = ", ".join(f"`{k}`: {v}" for k, v in nlp["languages"].items())
            lines.append(f"- **Detected comment languages:** {lang_str}")
        if nlp.get("topTerms"):
            terms_str = ", ".join(f"`{t['term']}` ({t['count']})" for t in nlp["topTerms"])
            lines.append(f"- **Top extracted terms:** {terms_str}")
        if nlp.get("topBigrams"):
            bg_str = ", ".join(f"`{b['bigram']}` ({b['count']})" for b in nlp["topBigrams"])
            lines.append(f"- **Top bigrams:** {bg_str}")

    issues = report.get("issues") or []
    if issues:
        lines.extend(["", "## GitHub Issues", ""])
        for it in issues:
            lines.append(f"- [{it.get('action', '')}] #{it.get('number', '')} {it.get('title', '')}")

    wv = report["webVitals"]
    if wv["samples"] > 0:
        lines.extend([
            "",
            "## Core Web Vitals",
            "",
            f"- Samples: {wv['samples']}",
            f"- TTFB p50 / p95: {wv['ttfbP50Ms']} ms / {wv['ttfbP95Ms']} ms",
            f"- LCP p50 / p95: {wv['lcpP50Ms']} ms / {wv['lcpP95Ms']} ms",
            f"- CLS p95: {wv['clsP95']}",
        ])

    gs = report.get("greenSoftware") or {}
    if gs.get("samples", 0) > 0:
        lines.extend([
            "",
            "## Green Software (Carbon Footprint · SWDM)",
            "",
            "_Estimated via the Sustainable Web Design Model (SWDM: ~0.35 mg CO2 per KB transferred over the network via `PerformanceResourceTiming`; cached PWA loads transfer ~0 KB). Ratings: **A+** < 95 mg, **A** < 186 mg, **B** < 341 mg, **C** >= 341 mg per visit._",
            "",
            f"- **Samples:** {gs['samples']} (real page loads reporting network transfer size)",
            f"- **Avg / p95 transfer per load:** {gs['avgTransferKB']} KB / {gs['p95TransferKB']} KB (data downloaded per visit)",
            f"- **Avg CO2 per visit:** {gs['avgCo2Mg']} mg (environmental rating **{gs['rating']}**)",
            f"- **Total estimated CO2 (period):** {gs['totalCo2Grams']} g (cumulative across all measured loads)",
        ])

    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description="ETL report generator for learnalgorithms.dev telemetry")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--sqlite", help="Path to SQLite database (api.sqlite3)")
    group.add_argument("--csv", help="Path to exported CSV (learnalgorithms-events.csv)")
    parser.add_argument("--out-json", help="Optional path to write JSON summary")
    parser.add_argument("--out-md", help="Optional path to write Markdown report")
    args = parser.parse_args()

    if args.sqlite:
        events = extract_from_sqlite(args.sqlite)
        feedback, issues = extract_extras_from_sqlite(args.sqlite)
    else:
        events = extract_from_csv(args.csv)
        feedback, issues = [], []

    report = transform(events, feedback=feedback, issues=issues)
    md = render_markdown(report)

    if args.out_json:
        Path(args.out_json).write_text(json.dumps(report, indent=2), encoding="utf-8")
    if args.out_md:
        Path(args.out_md).write_text(md, encoding="utf-8")
    if not args.out_json and not args.out_md:
        print(md)


if __name__ == "__main__":
    main()
