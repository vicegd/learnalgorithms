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
import sqlite3
import statistics
from collections import Counter, defaultdict
from pathlib import Path


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


def percentile(values, p):
    if not values:
        return None
    s = sorted(values)
    idx = min(len(s) - 1, max(0, int(round((p / 100.0) * (len(s) - 1)))))
    return s[idx]


def transform(events):
    sessions = set()
    days = set()
    by_type = Counter()
    page_views = Counter()
    page_durations = defaultdict(list)
    page_scrolls = defaultdict(list)
    completions = Counter()
    zero_searches = Counter()
    top_checkpoints = Counter()
    ttfb_vals, lcp_vals, cls_vals = [], [], []

    for e in events:
        if e["sessionId"]:
            sessions.add(e["sessionId"])
        if e["day"]:
            days.add(e["day"])
        et = e["eventType"]
        by_type[et] += 1
        page = e["page"]
        meta = e.get("meta") or {}

        if et == "page_view":
            page_views[page] += 1
        elif et == "page_leave":
            if isinstance(e["durationMs"], int) and e["durationMs"] >= 0:
                page_durations[page].append(e["durationMs"])
            if isinstance(e["scrollPct"], int) and 0 <= e["scrollPct"] <= 100:
                page_scrolls[page].append(e["scrollPct"])
        elif et == "lesson_complete":
            completions[page] += 1
        elif et == "search" and meta.get("results") == 0 and meta.get("query"):
            zero_searches[str(meta["query"]).lower()] += 1
        elif et == "details_open" and meta.get("summary"):
            top_checkpoints[str(meta["summary"])] += 1
        elif et == "web_vitals":
            if isinstance(meta.get("ttfbMs"), (int, float)):
                ttfb_vals.append(meta["ttfbMs"])
            if isinstance(meta.get("lcpMs"), (int, float)):
                lcp_vals.append(meta["lcpMs"])
            if isinstance(meta.get("cls"), (int, float)):
                cls_vals.append(meta["cls"])

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
        })

    return {
        "totals": {
            "events": len(events),
            "sessions": len(sessions),
            "activeDays": len(days),
            "completions": sum(completions.values()),
        },
        "eventsByType": dict(by_type.most_common()),
        "topPages": top_pages,
        "zeroResultSearches": [{"query": q, "count": c} for q, c in zero_searches.most_common(20)],
        "topCheckpoints": [{"summary": s, "count": c} for s, c in top_checkpoints.most_common(20)],
        "webVitals": {
            "samples": max(len(ttfb_vals), len(lcp_vals), len(cls_vals)),
            "ttfbP50Ms": percentile(ttfb_vals, 50),
            "ttfbP95Ms": percentile(ttfb_vals, 95),
            "lcpP50Ms": percentile(lcp_vals, 50),
            "lcpP95Ms": percentile(lcp_vals, 95),
            "clsP95": percentile(cls_vals, 95),
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
        "",
        "## Top Pages",
        "",
        "| Page | Views | Median time (s) | Avg scroll (%) | Completions |",
        "| :--- | ---: | ---: | ---: | ---: |",
    ]
    for p in report["topPages"]:
        dur = f"{p['medianDurationSec']}" if p["medianDurationSec"] is not None else "—"
        sc = f"{p['avgScrollPct']}" if p["avgScrollPct"] is not None else "—"
        lines.append(f"| `{p['page']}` | {p['views']} | {dur} | {sc} | {p['completions']} |")

    if report["zeroResultSearches"]:
        lines.extend(["", "## Zero-Result Searches (Content Gaps)", ""])
        for item in report["zeroResultSearches"]:
            lines.append(f"- `{item['query']}` ({item['count']})")

    if report["topCheckpoints"]:
        lines.extend(["", "## Most Opened Checkpoints & Solutions", ""])
        for item in report["topCheckpoints"]:
            lines.append(f"- {item['summary']} ({item['count']})")

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

    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description="ETL report generator for learnalgorithms.dev telemetry")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--sqlite", help="Path to SQLite database (api.sqlite3)")
    group.add_argument("--csv", help="Path to exported CSV (learnalgorithms-events.csv)")
    parser.add_argument("--out-json", help="Optional path to write JSON summary")
    parser.add_argument("--out-md", help="Optional path to write Markdown report")
    args = parser.parse_args()

    events = extract_from_sqlite(args.sqlite) if args.sqlite else extract_from_csv(args.csv)
    report = transform(events)
    md = render_markdown(report)

    if args.out_json:
        Path(args.out_json).write_text(json.dumps(report, indent=2), encoding="utf-8")
    if args.out_md:
        Path(args.out_md).write_text(md, encoding="utf-8")
    if not args.out_json and not args.out_md:
        print(md)


if __name__ == "__main__":
    main()
