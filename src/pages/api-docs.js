import React, {useState} from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './api-docs.module.css';

const API_BASE = 'https://api.learnalgorithms.dev';

const GROUPS = [
  {
    name: 'Public endpoints',
    endpoints: [
      {
        method: 'GET',
        path: '/health',
        summary: 'Liveness check',
        details: 'Returns 200 OK when the API container is healthy and ready to serve requests.',
        tryUrl: `${API_BASE}/health`,
        responses: ['200 OK — {"status":"ok"}'],
        example: `curl -i ${API_BASE}/health`,
      },
      {
        method: 'GET',
        path: '/popular',
        summary: 'Most read lessons of the last 7 days',
        details:
          'Fetched server-to-server from Matomo and cached in memory for 15 minutes. Degrades gracefully to an empty list if Matomo is unreachable.',
        tryUrl: `${API_BASE}/popular`,
        responses: ['200 OK — {"pages":[{"page":"...","visits":42}]}'],
        example: `curl -i ${API_BASE}/popular`,
      },
      {
        method: 'GET',
        path: '/feedback/summary',
        summary: 'Aggregated helpfulness votes for one lesson',
        details: 'Query parameter: page (e.g. /concepts/sorting/quicksort). Rate-limited per IP.',
        tryUrl: `${API_BASE}/feedback/summary?page=/concepts/sorting/quicksort`,
        responses: [
          '200 OK — {"page":"...","helpful":10,"notHelpful":1}',
          '400 Bad Request — invalid page',
          '429 Too Many Requests',
        ],
        example: `curl -i "${API_BASE}/feedback/summary?page=/concepts/sorting/quicksort"`,
      },
      {
        method: 'POST',
        path: '/feedback',
        summary: 'Submit anonymous lesson feedback',
        auth: 'Origin: learnalgorithms.dev',
        details:
          'Stores a helpful/not-helpful vote with an optional comment (max 500 chars). Protected against bots with a honeypot field, minimum time on page (3 s), and one vote per page, client, and day.',
        payload: `{
  "page": "/concepts/sorting/quicksort",
  "helpful": true,
  "comment": "The partition trace made it click!",
  "elapsed": 12000,
  "website": "",
  "client": "11111111-1111-4111-8111-111111111111"
}`,
        responses: [
          '201 Created — stored',
          '200 OK — already voted today',
          '202 Accepted — bot check',
          '400 Bad Request',
          '403 Forbidden',
          '429 Too Many Requests',
        ],
      },
      {
        method: 'POST',
        path: '/events',
        summary: 'Record anonymous student/usage telemetry events',
        auth: 'Origin: learnalgorithms.dev',
        details:
          'Accepts a single event or a batch (max 20 events, 4 KB body). Allowed eventType values: page_view, page_leave, lesson_complete, lesson_uncomplete, cheat_sheet_filter, cheat_sheet_compare, visualizer_interact, search.',
        payload: `{
  "events": [
    {
      "sessionId": "11111111-1111-4111-8111-111111111111",
      "eventType": "page_leave",
      "page": "/concepts/sorting/quicksort",
      "durationMs": 45000,
      "scrollPct": 85
    }
  ]
}`,
        responses: ['201 Created — {"status":"stored","count":1}', '400 Bad Request', '403 Forbidden', '429 Too Many Requests'],
      },
    ],
  },
  {
    name: 'Integrations & Webhooks',
    endpoints: [
      {
        method: 'POST',
        path: '/webhooks/github',
        summary: 'Receive GitHub issue events',
        auth: 'HMAC-SHA256',
        details:
          'Verifies X-Hub-Signature-256 in constant time using GITHUB_WEBHOOK_SECRET and stores issue events idempotently by X-GitHub-Delivery.',
        responses: ['200 OK — ping', '202 Accepted — ignored', '204 No Content — stored', '400 Bad Request', '401 Unauthorized'],
      },
    ],
  },
  {
    name: 'Admin & Teaching Innovation Analytics',
    endpoints: [
      {
        method: 'GET',
        path: '/admin/stats',
        summary: 'Aggregated learning analytics summary',
        auth: 'Bearer Token',
        details:
          'Query parameter: days (1–365, default 30). Returns totals (events, sessions, activeDays), events by type, top pages with average duration and scroll depth, lesson completions, and daily activity.',
        responses: ['200 OK — JSON report', '400 Bad Request', '401 Unauthorized'],
        example: `curl -H "Authorization: Bearer <ADMIN_TOKEN>" "${API_BASE}/admin/stats?days=30"`,
      },
      {
        method: 'GET',
        path: '/admin/events',
        summary: 'Export anonymized telemetry events (JSON or CSV)',
        auth: 'Bearer Token',
        details:
          'Query parameters: days (1–365, default 30), limit (1–5000, default 500), format (json | csv). With format=csv downloads learnalgorithms-events.csv ready for Excel, R, SPSS, or Python.',
        responses: ['200 OK — application/json or text/csv', '400 Bad Request', '401 Unauthorized'],
        example: `curl -H "Authorization: Bearer <ADMIN_TOKEN>" "${API_BASE}/admin/events?days=30&format=csv" -o learnalgorithms-events.csv`,
      },
      {
        method: 'GET',
        path: '/admin/feedback',
        summary: 'Latest qualitative feedback votes and comments',
        auth: 'Bearer Token',
        details: 'Returns the latest 200 feedback entries stored in SQLite with Cache-Control: no-store.',
        responses: ['200 OK — {"feedback":[...]}', '401 Unauthorized'],
        example: `curl -H "Authorization: Bearer <ADMIN_TOKEN>" "${API_BASE}/admin/feedback"`,
      },
    ],
  },
];

function EndpointCard({ep}) {
  const [loading, setLoading] = useState(false);
  const [liveOutput, setLiveOutput] = useState(null);

  async function runTry() {
    if (!ep.tryUrl || loading) return;
    setLoading(true);
    try {
      const resp = await fetch(ep.tryUrl, {mode: 'cors'});
      const text = await resp.text();
      let formatted = text;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // Keep raw text
      }
      setLiveOutput(`HTTP ${resp.status}\n${formatted}`);
    } catch (err) {
      setLiveOutput(`Request failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <details className={styles.card}>
      <summary className={styles.summaryRow}>
        <span
          className={clsx(
            styles.method,
            ep.method === 'GET' ? styles.methodGet : styles.methodPost,
          )}>
          {ep.method}
        </span>
        <span className={styles.path}>{ep.path}</span>
        <span className={styles.desc}>{ep.summary}</span>
        {ep.auth && <span className={styles.authBadge}>{ep.auth}</span>}
      </summary>
      <div className={styles.cardBody}>
        <p>{ep.details}</p>

        {ep.payload && (
          <>
            <div className={styles.sectionLabel}>Example JSON Body</div>
            <pre className={styles.codeBlock}>{ep.payload}</pre>
          </>
        )}

        {ep.example && (
          <>
            <div className={styles.sectionLabel}>Example Request</div>
            <pre className={styles.codeBlock}>{ep.example}</pre>
          </>
        )}

        <div className={styles.sectionLabel}>Responses</div>
        <div className={styles.responses}>
          {ep.responses.map((r) => (
            <span key={r} className={styles.statusPill}>
              {r}
            </span>
          ))}
        </div>

        {ep.tryUrl && (
          <div className={styles.tryRow}>
            <button
              type="button"
              onClick={runTry}
              disabled={loading}
              className={styles.tryBtn}>
              {loading ? 'Calling live API…' : `Try live ${ep.method} ${ep.path}`}
            </button>
            {liveOutput && <pre className={styles.codeBlock}>{liveOutput}</pre>}
          </div>
        )}
      </div>
    </details>
  );
}

export default function ApiDocsPage() {
  const specUrl = useBaseUrl('/openapi.yaml');
  return (
    <Layout
      title="API Reference"
      description="Interactive OpenAPI 3.1 reference for api.learnalgorithms.dev">
      <main className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>OpenAPI 3.1 Reference</p>
          <h1 className={styles.title}>learnalgorithms.dev API</h1>
          <p className={styles.subtitle}>
            Privacy-preserving REST API written with the Python standard library and SQLite. Stores
            no personal data or IP addresses. Click any endpoint below to inspect its schema or try
            live public requests.
          </p>
          <div className={styles.metaRow}>
            <span className={styles.baseUrl}>{API_BASE}</span>
            <a href={specUrl} download="openapi.yaml" className={styles.downloadLink}>
              Download openapi.yaml ↓
            </a>
          </div>
        </header>

        {GROUPS.map((group) => (
          <section key={group.name} aria-label={group.name}>
            <h2 className={styles.groupTitle}>{group.name}</h2>
            <div className={styles.list}>
              {group.endpoints.map((ep) => (
                <EndpointCard key={`${ep.method}-${ep.path}`} ep={ep} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </Layout>
  );
}
