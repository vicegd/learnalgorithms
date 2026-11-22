import hashlib
import hmac
import json
import os
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "app"))
os.environ.update(GITHUB_WEBHOOK_SECRET="whsecret", ADMIN_TOKEN="admintoken")
import server  # noqa: E402

ORIGIN = server.ALLOWED_ORIGIN


class ApiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        server.GITHUB_WEBHOOK_SECRET, server.ADMIN_TOKEN = "whsecret", "admintoken"
        cls.tmp = tempfile.TemporaryDirectory()
        cls.app = server.App(server.Store(os.path.join(cls.tmp.name, "t.db")),
                             popular_fetch=lambda: [{"page": "/concepts/sorting/quicksort", "visits": 42}])
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.make_handler(cls.app))
        cls.base = f"http://127.0.0.1:{cls.httpd.server_address[1]}"
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.app.store.db.close()
        cls.tmp.cleanup()

    def req(self, method, path, body=None, headers=None, raw=None):
        data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
        h = {"Origin": ORIGIN}
        if body is not None:
            h["Content-Type"] = "application/json"
        h.update(headers or {})
        r = urllib.request.Request(self.base + path, data=data, method=method, headers=h)
        try:
            with urllib.request.urlopen(r) as resp:
                text = resp.read()
                return resp.status, (json.loads(text) if text else None), resp.headers
        except urllib.error.HTTPError as e:
            text = e.read()
            return e.code, (json.loads(text) if text else None), e.headers

    def vote(self, page="/concepts/sorting/quicksort", ip="1.1.1.1", **extra):
        body = {"page": page, "helpful": True, "elapsed": 5000}
        body.update(extra)
        return self.req("POST", "/feedback", body, {"X-Real-IP": ip})

    def test_health_and_security_headers(self):
        status, data, headers = self.req("GET", "/health")
        self.assertEqual((status, data), (200, {"status": "ok"}))
        self.assertEqual(headers["X-Content-Type-Options"], "nosniff")
        self.assertIn("default-src 'none'", headers["Content-Security-Policy"])
        self.assertEqual(headers["Access-Control-Allow-Origin"], ORIGIN)

    def test_cors_other_origin(self):
        status, _, headers = self.req("GET", "/health", headers={"Origin": "https://evil.example"})
        self.assertEqual(status, 200)
        self.assertIsNone(headers.get("Access-Control-Allow-Origin"))
        status, _, _ = self.vote(headers=None) if False else self.req(
            "POST", "/feedback", {"page": "/concepts/a/b", "helpful": True, "elapsed": 5000},
            {"Origin": "https://evil.example"})
        self.assertEqual(status, 403)

    def test_vote_once_per_day(self):
        self.assertEqual(self.vote(ip="2.2.2.2")[0], 201)
        self.assertEqual(self.vote(ip="2.2.2.2")[0], 200)  # already voted
        status, data, _ = self.req("GET", "/feedback/summary?page=/concepts/sorting/quicksort")
        self.assertEqual(status, 200)
        self.assertGreaterEqual(data["helpful"], 1)

    def test_validation(self):
        for page in ["/etc/passwd", "/concepts/../x", "/concepts/a'; DROP TABLE feedback;--", 42, None]:
            self.assertEqual(self.vote(page=page, ip="3.3.3.3")[0], 400, page)
        self.assertEqual(self.vote(ip="3.3.3.3", helpful="yes")[0], 400)
        self.assertEqual(self.vote(ip="3.3.3.3", comment="x" * 501)[0], 400)
        status, _, _ = self.req("POST", "/feedback", raw=b"not json",
                                headers={"Content-Type": "application/json"})
        self.assertEqual(status, 400)
        status, _, _ = self.req("POST", "/feedback", raw=b"{}", headers={"Content-Type": "text/plain"})
        self.assertEqual(status, 400)

    def test_body_too_large(self):
        big = json.dumps({"page": "/concepts/a/b", "helpful": True, "elapsed": 5000,
                          "comment": "x" * 10000}).encode()
        status, _, _ = self.req("POST", "/feedback", raw=big, headers={"Content-Type": "application/json"})
        self.assertEqual(status, 400)

    def test_bots_are_silently_discarded(self):
        self.assertEqual(self.vote(page="/concepts/a/bot", ip="4.4.4.4", website="http://spam")[0], 202)
        self.assertEqual(self.vote(page="/concepts/a/bot", ip="4.4.4.5", elapsed=200)[0], 202)
        _, data, _ = self.req("GET", "/feedback/summary?page=/concepts/a/bot")
        self.assertEqual(data["helpful"] + data["notHelpful"], 0)

    def test_comment_control_characters_removed(self):
        self.assertEqual(self.vote(page="/concepts/a/ctrl", ip="5.5.5.5", comment=" ok\x00\x07 ")[0], 201)
        _, data, _ = self.req("GET", "/admin/feedback", headers={"Authorization": "Bearer admintoken"})
        self.assertIn({"page": "/concepts/a/ctrl", "helpful": True, "comment": "ok",
                       "day": data["feedback"][0]["day"]}, data["feedback"])

    def test_rate_limit(self):
        codes = [self.vote(page=f"/concepts/r/p{i}", ip="6.6.6.6")[0] for i in range(server.RATE_LIMIT + 2)]
        self.assertIn(429, codes)
        self.assertEqual(self.vote(page="/concepts/r/other", ip="7.7.7.7")[0], 201)  # other client unaffected

    def test_same_ip_different_clients(self):
        a, b = "11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"
        self.assertEqual(self.vote(page="/concepts/n/at", ip="8.8.8.8", client=a)[0], 201)
        self.assertEqual(self.vote(page="/concepts/n/at", ip="8.8.8.8", client=b)[0], 201)
        self.assertEqual(self.vote(page="/concepts/n/at", ip="8.8.8.8", client=a)[0], 200)
        self.assertEqual(self.vote(page="/concepts/n/at", ip="8.8.8.8", client="not-a-uuid")[0], 400)

    def test_admin_requires_token(self):
        self.assertEqual(self.req("GET", "/admin/feedback")[0], 401)
        self.assertEqual(self.req("GET", "/admin/feedback", headers={"Authorization": "Bearer wrong"})[0], 401)

    def test_popular(self):
        status, data, _ = self.req("GET", "/popular")
        self.assertEqual(data["pages"][0]["visits"], 42)

    def test_github_webhook_signature(self):
        body = json.dumps({"action": "opened", "issue": {"number": 7, "title": "Typo", "html_url": "u"}}).encode()
        sig = "sha256=" + hmac.new(b"whsecret", body, hashlib.sha256).hexdigest()
        h = {"Content-Type": "application/json", "X-GitHub-Event": "issues", "X-GitHub-Delivery": "d1"}
        self.assertEqual(self.req("POST", "/webhooks/github", raw=body,
                                  headers={**h, "X-Hub-Signature-256": "sha256=" + "0" * 64})[0], 401)
        self.assertEqual(self.req("POST", "/webhooks/github", raw=body, headers=h)[0], 401)
        self.assertEqual(self.req("POST", "/webhooks/github", raw=body,
                                  headers={**h, "X-Hub-Signature-256": sig})[0], 204)
        self.assertEqual(self.req("GET", "/admin/issues")[0], 401)
        s, issues_data, _ = self.req("GET", "/admin/issues", headers={"Authorization": "Bearer admintoken"})
        self.assertEqual(s, 200)
        self.assertEqual(issues_data["issues"][0]["number"], 7)
        self.assertEqual(issues_data["issues"][0]["title"], "Typo")

    def test_unknown_route(self):
        self.assertEqual(self.req("GET", "/../../etc/passwd")[0], 404)

    def test_events_validation_and_admin_stats(self):
        sid = "11111111-1111-4111-8111-111111111111"
        # Wrong origin is rejected
        s, _, _ = self.req("POST", "/events", body={
            "sessionId": sid, "eventType": "page_view", "page": "/cheat-sheet",
        }, headers={"Origin": "https://evil.example"})
        self.assertEqual(s, 403)

        # Invalid eventType or page or sessionId
        self.assertEqual(self.req("POST", "/events", body={
            "sessionId": sid, "eventType": "hack", "page": "/cheat-sheet",
        })[0], 400)
        self.assertEqual(self.req("POST", "/events", body={
            "sessionId": sid, "eventType": "page_view", "page": "/../../etc/passwd",
        })[0], 400)
        self.assertEqual(self.req("POST", "/events", body={
            "sessionId": "bad", "eventType": "page_view", "page": "/",
        })[0], 400)

        # Valid batch of events
        s, data, _ = self.req("POST", "/events", body={
            "events": [
                {
                    "sessionId": sid,
                    "eventType": "page_view",
                    "page": "/concepts/sorting/quicksort",
                    "meta": {"viewport": "desktop"},
                },
                {
                    "sessionId": sid,
                    "eventType": "page_leave",
                    "page": "/concepts/sorting/quicksort",
                    "durationMs": 45000,
                    "scrollPct": 85,
                },
                {
                    "sessionId": sid,
                    "eventType": "lesson_complete",
                    "page": "/concepts/sorting/quicksort",
                },
                {
                    "sessionId": sid,
                    "eventType": "search",
                    "page": "/",
                    "meta": {"query": "knapsack", "results": 4},
                },
                {
                    "sessionId": sid,
                    "eventType": "details_open",
                    "page": "/concepts/sorting/quicksort",
                    "meta": {"summary": "Checkpoint: Pivot choice"},
                },
                {
                    "sessionId": sid,
                    "eventType": "resource_click",
                    "page": "/concepts/sorting/quicksort",
                    "meta": {"kind": "java_code"},
                },
                {
                    "sessionId": sid,
                    "eventType": "web_vitals",
                    "page": "/knowledge-graph",
                    "meta": {"ttfbMs": 45, "lcpMs": 420, "cls": 0.01},
                },
            ]
        })
        self.assertEqual(s, 201)
        self.assertEqual(data["count"], 7)

        # Admin endpoints require token
        self.assertEqual(self.req("GET", "/admin/stats")[0], 401)
        self.assertEqual(self.req("GET", "/admin/events")[0], 401)

        # Admin stats aggregation
        s, stats, _ = self.req("GET", "/admin/stats?days=7", headers={"Authorization": "Bearer admintoken"})
        self.assertEqual(s, 200)
        self.assertGreaterEqual(stats["totals"]["events"], 3)
        self.assertGreaterEqual(stats["totals"]["sessions"], 1)
        qs = [p for p in stats["topPages"] if p["page"] == "/concepts/sorting/quicksort"][0]
        self.assertEqual(qs["views"], 1)
        self.assertEqual(qs["avgDurationMs"], 45000)
        self.assertEqual(qs["avgScrollPct"], 85)

        # All-time stats (days=0) and paginated events (limit + offset + total)
        s, all_stats, _ = self.req("GET", "/admin/stats?days=0", headers={"Authorization": "Bearer admintoken"})
        self.assertEqual(s, 200)
        self.assertIsNone(all_stats["since"])
        self.assertGreaterEqual(all_stats["totals"]["events"], 6)

        s, page1, _ = self.req("GET", "/admin/events?days=0&limit=2&offset=0", headers={"Authorization": "Bearer admintoken"})
        self.assertEqual(s, 200)
        self.assertEqual(len(page1["events"]), 2)
        self.assertGreaterEqual(page1["total"], 6)

        s, page2, _ = self.req("GET", "/admin/events?days=0&limit=2&offset=2", headers={"Authorization": "Bearer admintoken"})
        self.assertEqual(s, 200)
        self.assertEqual(len(page2["events"]), 2)
        self.assertEqual(page2["offset"], 2)

        # CSV formula injection neutralization (CWE-1236)
        self.assertEqual(server.csv_safe("=SUM(A1:A2)"), "'=SUM(A1:A2)")
        self.assertEqual(server.csv_safe("+1+1"), "'+1+1")
        self.assertEqual(server.csv_safe("-1"), "'-1")
        self.assertEqual(server.csv_safe("@cmd"), "'@cmd")
        self.assertEqual(server.csv_safe("/concepts/sorting/quicksort"), "/concepts/sorting/quicksort")

        # Admin events CSV export with CORS header for /admin dashboard
        req = urllib.request.Request(
            self.base + "/admin/events?days=7&format=csv",
            headers={"Authorization": "Bearer admintoken", "Origin": ORIGIN},
        )
        with urllib.request.urlopen(req) as resp:
            self.assertEqual(resp.status, 200)
            self.assertEqual(resp.headers.get("Access-Control-Allow-Origin"), ORIGIN)
            self.assertIn("text/csv", resp.headers.get("Content-Type", ""))
            csv_text = resp.read().decode("utf-8")
            self.assertIn("ts,day,sessionId,eventType,page,durationMs,scrollPct,meta", csv_text)
            self.assertIn("/concepts/sorting/quicksort", csv_text)


if __name__ == "__main__":
    unittest.main()
