import os
import sqlite3
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "analytics"))
import etl_report  # noqa: E402


class EtlReportTest(unittest.TestCase):
    def test_transform_and_render_markdown(self):
        events = [
            {
                "ts": "2026-11-22T10:00:00+00:00",
                "day": "2026-11-22",
                "sessionId": "s1",
                "eventType": "page_view",
                "page": "/concepts/sorting/quicksort",
                "durationMs": None,
                "scrollPct": None,
                "meta": {"viewport": "desktop"},
            },
            {
                "ts": "2026-11-22T10:01:00+00:00",
                "day": "2026-11-22",
                "sessionId": "s1",
                "eventType": "page_leave",
                "page": "/concepts/sorting/quicksort",
                "durationMs": 60000,
                "scrollPct": 90,
                "meta": {},
            },
            {
                "ts": "2026-11-22T10:01:10+00:00",
                "day": "2026-11-22",
                "sessionId": "s1",
                "eventType": "search",
                "page": "/",
                "durationMs": None,
                "scrollPct": None,
                "meta": {"query": "dijkstra", "results": 0},
            },
            {
                "ts": "2026-11-22T10:01:20+00:00",
                "day": "2026-11-22",
                "sessionId": "s1",
                "eventType": "web_vitals",
                "page": "/concepts/sorting/quicksort",
                "durationMs": None,
                "scrollPct": None,
                "meta": {"ttfbMs": 40, "lcpMs": 380, "cls": 0.01},
            },
        ]
        report = etl_report.transform(events)
        self.assertEqual(report["totals"]["events"], 4)
        self.assertEqual(report["totals"]["sessions"], 1)
        self.assertEqual(report["zeroResultSearches"][0]["query"], "dijkstra")
        self.assertEqual(report["webVitals"]["lcpP50Ms"], 380)

        md = etl_report.render_markdown(report)
        self.assertIn("/concepts/sorting/quicksort", md)
        self.assertIn("dijkstra", md)
        self.assertIn("Core Web Vitals", md)

    def test_extract_from_sqlite(self):
        with tempfile.TemporaryDirectory() as tmp:
            db_path = os.path.join(tmp, "test.db")
            conn = sqlite3.connect(db_path)
            conn.execute(
                """CREATE TABLE telemetry_events (
                   id INTEGER PRIMARY KEY, ts TEXT, day TEXT, session_id TEXT,
                   event_type TEXT, page TEXT, duration_ms INTEGER, scroll_pct INTEGER, meta TEXT
                )"""
            )
            conn.execute(
                "INSERT INTO telemetry_events VALUES (1, '2026-11-22T10:00:00Z', '2026-11-22', 's1', 'lesson_complete', '/concepts/sorting/quicksort', NULL, NULL, NULL)"
            )
            conn.commit()
            conn.close()
            extracted = etl_report.extract_from_sqlite(db_path)
            self.assertEqual(len(extracted), 1)
            self.assertEqual(extracted[0]["eventType"], "lesson_complete")


if __name__ == "__main__":
    unittest.main()
