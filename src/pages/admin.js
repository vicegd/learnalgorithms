import React, {useCallback, useEffect, useState} from 'react';
import Head from '@docusaurus/Head';
import Layout from '@theme/Layout';
import styles from './admin.module.css';

const API_BASE = 'https://api.learnalgorithms.dev';
const TOKEN_KEY = 'learnalgorithms:admin-token:v1';

function formatDuration(ms) {
  if (ms === null || ms === undefined) return '—';
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

export default function AdminDashboardPage() {
  const [token, setToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [issues, setIssues] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(TOKEN_KEY);
      if (saved) setToken(saved);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const fetchAll = useCallback(async (authToken, periodDays) => {
    if (!authToken) return;
    setLoading(true);
    setError('');
    const headers = {Authorization: `Bearer ${authToken}`};

    try {
      const [statsRes, fbRes, issuesRes, eventsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/stats?days=${periodDays}`, {headers, mode: 'cors'}),
        fetch(`${API_BASE}/admin/feedback`, {headers, mode: 'cors'}),
        fetch(`${API_BASE}/admin/issues`, {headers, mode: 'cors'}),
        fetch(`${API_BASE}/admin/events?days=${periodDays}&limit=50`, {headers, mode: 'cors'}),
      ]);

      if (statsRes.status === 401 || fbRes.status === 401) {
        setError('Unauthorized: invalid ADMIN_TOKEN.');
        setToken('');
        try {
          window.sessionStorage.removeItem(TOKEN_KEY);
        } catch {
          // Ignore
        }
        return;
      }

      if (!statsRes.ok) {
        throw new Error(`API returned HTTP ${statsRes.status}`);
      }

      const statsJson = await statsRes.json();
      const fbJson = fbRes.ok ? await fbRes.json() : {feedback: []};
      const issuesJson = issuesRes.ok ? await issuesRes.json() : {issues: []};
      const eventsJson = eventsRes.ok ? await eventsRes.json() : {events: []};

      setStats(statsJson);
      setFeedback(fbJson.feedback || []);
      setIssues(issuesJson.issues || []);
      setEvents(eventsJson.events || []);
    } catch (err) {
      setError(`Could not load admin data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchAll(token, days);
    }
  }, [token, days, fetchAll]);

  function handleLogin(e) {
    e.preventDefault();
    const cleaned = tokenInput.trim();
    if (!cleaned) return;
    try {
      window.sessionStorage.setItem(TOKEN_KEY, cleaned);
    } catch {
      // Ignore
    }
    setToken(cleaned);
    setTokenInput('');
  }

  function handleLogout() {
    setToken('');
    setStats(null);
    setFeedback([]);
    setIssues([]);
    setEvents([]);
    setError('');
    try {
      window.sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore
    }
  }

  async function handleDownloadCsv() {
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE}/admin/events?days=${days}&limit=5000&format=csv`, {
        headers: {Authorization: `Bearer ${token}`},
        mode: 'cors',
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learnalgorithms-events-${days}d.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`CSV download failed: ${err.message}`);
    }
  }

  return (
    <Layout title="Admin Analytics" description="Private teaching analytics dashboard">
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className={styles.container}>
        {!token ? (
          <section className={styles.loginBox} aria-label="Admin authentication">
            <p className={styles.eyebrow}>Private Dashboard</p>
            <h1 className={styles.title}>Admin Analytics</h1>
            <p className={styles.subtitle}>
              Enter your <code>ADMIN_TOKEN</code> to view anonymous learning statistics, feedback,
              and GitHub issue events. The token stays only in this browser tab.
            </p>
            {error && <div className={styles.error} role="alert">{error}</div>}
            <form onSubmit={handleLogin} className={styles.loginForm}>
              <input
                type="password"
                className={styles.input}
                placeholder="Paste ADMIN_TOKEN…"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                aria-label="Admin token"
                autoComplete="off"
                required
              />
              <button type="submit" className={styles.primaryBtn}>
                Unlock dashboard
              </button>
            </form>
          </section>
        ) : (
          <>
            <header className={styles.topBar}>
              <div>
                <p className={styles.eyebrow}>Teaching Innovation Analytics</p>
                <h1 className={styles.title}>Admin Dashboard</h1>
              </div>
              <div className={styles.toolbar}>
                <select
                  className={styles.select}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  aria-label="Time window">
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={365}>Last 365 days</option>
                </select>
                <button
                  type="button"
                  onClick={() => fetchAll(token, days)}
                  disabled={loading}
                  className={styles.secondaryBtn}>
                  {loading ? 'Loading…' : 'Refresh'}
                </button>
                <button type="button" onClick={handleDownloadCsv} className={styles.primaryBtn}>
                  Download CSV ↓
                </button>
                <button type="button" onClick={handleLogout} className={styles.secondaryBtn}>
                  Lock
                </button>
              </div>
            </header>

            {error && <div className={styles.error} role="alert">{error}</div>}

            {stats && (
              <>
                <div className={styles.kpiGrid}>
                  <div className={styles.kpiCard}>
                    <div className={styles.kpiValue}>{stats.totals.events}</div>
                    <div className={styles.kpiLabel}>Telemetry events</div>
                  </div>
                  <div className={styles.kpiCard}>
                    <div className={styles.kpiValue}>{stats.totals.sessions}</div>
                    <div className={styles.kpiLabel}>Anonymous sessions</div>
                  </div>
                  <div className={styles.kpiCard}>
                    <div className={styles.kpiValue}>{stats.totals.activeDays}</div>
                    <div className={styles.kpiLabel}>Active days</div>
                  </div>
                  <div className={styles.kpiCard}>
                    <div className={styles.kpiValue}>{feedback.length}</div>
                    <div className={styles.kpiLabel}>Feedback entries</div>
                  </div>
                  <div className={styles.kpiCard}>
                    <div className={styles.kpiValue}>{issues.length}</div>
                    <div className={styles.kpiLabel}>GitHub issue events</div>
                  </div>
                </div>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Events by type</h2>
                  {Object.keys(stats.eventsByType || {}).length === 0 ? (
                    <p className={styles.empty}>No events recorded in this period yet.</p>
                  ) : (
                    <div className={styles.pills}>
                      {Object.entries(stats.eventsByType).map(([type, count]) => (
                        <span key={type} className={styles.pill}>
                          {type}: <strong>{count}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Top pages</h2>
                  {stats.topPages.length === 0 ? (
                    <p className={styles.empty}>No page views recorded yet.</p>
                  ) : (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th scope="col">Page</th>
                            <th scope="col">Views</th>
                            <th scope="col">Sessions</th>
                            <th scope="col">Avg time</th>
                            <th scope="col">Avg scroll</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.topPages.map((p) => (
                            <tr key={p.page}>
                              <td className={styles.mono}>{p.page}</td>
                              <td>{p.views}</td>
                              <td>{p.sessions}</td>
                              <td>{formatDuration(p.avgDurationMs)}</td>
                              <td>{p.avgScrollPct !== null ? `${p.avgScrollPct}%` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Lesson completions</h2>
                  {stats.lessonCompletions.length === 0 ? (
                    <p className={styles.empty}>No lesson completions recorded yet.</p>
                  ) : (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th scope="col">Lesson</th>
                            <th scope="col">Completed</th>
                            <th scope="col">Uncompleted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.lessonCompletions.map((c) => (
                            <tr key={c.page}>
                              <td className={styles.mono}>{c.page}</td>
                              <td>{c.completed}</td>
                              <td>{c.uncompleted}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Latest feedback ({feedback.length})</h2>
              {feedback.length === 0 ? (
                <p className={styles.empty}>No feedback votes recorded yet.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">Day</th>
                        <th scope="col">Page</th>
                        <th scope="col">Helpful</th>
                        <th scope="col">Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedback.map((f, idx) => (
                        <tr key={`${f.day}-${f.page}-${idx}`}>
                          <td className={styles.mono}>{f.day}</td>
                          <td className={styles.mono}>{f.page}</td>
                          <td>{f.helpful ? '👍 Yes' : '👎 No'}</td>
                          <td>{f.comment || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Latest GitHub issues ({issues.length})</h2>
              {issues.length === 0 ? (
                <p className={styles.empty}>No webhook issue events recorded yet.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">Received</th>
                        <th scope="col">Action</th>
                        <th scope="col">Issue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map((it) => (
                        <tr key={it.delivery}>
                          <td className={styles.mono}>{it.received.slice(0, 19).replace('T', ' ')}</td>
                          <td>{it.action}</td>
                          <td>
                            <a href={it.url} target="_blank" rel="noopener noreferrer">
                              #{it.number} {it.title}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Latest raw events (up to 50)</h2>
              {events.length === 0 ? (
                <p className={styles.empty}>No raw events recorded in this period.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">Timestamp (UTC)</th>
                        <th scope="col">Type</th>
                        <th scope="col">Page</th>
                        <th scope="col">Time / Scroll</th>
                        <th scope="col">Meta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((ev, idx) => (
                        <tr key={`${ev.ts}-${idx}`}>
                          <td className={styles.mono}>{ev.ts.slice(0, 19).replace('T', ' ')}</td>
                          <td className={styles.mono}>{ev.eventType}</td>
                          <td className={styles.mono}>{ev.page}</td>
                          <td className={styles.mono}>
                            {ev.durationMs !== null ? formatDuration(ev.durationMs) : '—'}
                            {ev.scrollPct !== null ? ` · ${ev.scrollPct}%` : ''}
                          </td>
                          <td className={styles.mono}>
                            {ev.meta ? JSON.stringify(ev.meta) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </Layout>
  );
}
