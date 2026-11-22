import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Head from '@docusaurus/Head';
import Layout from '@theme/Layout';
import styles from './admin.module.css';

const API_BASE = 'https://api.learnalgorithms.dev';
const TOKEN_KEY = 'learnalgorithms:admin-token:v1';
const PAGE_SIZE = 15;
const EVENTS_PAGE_SIZE = 15;

function formatDuration(ms) {
  if (ms === null || ms === undefined) return '—';
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function sortRows(rows, sortState) {
  if (!sortState.key) return rows;
  return [...rows].sort((a, b) => {
    const va = a[sortState.key];
    const vb = b[sortState.key];
    if (va === vb) return 0;
    if (va === null || va === undefined) return 1;
    if (vb === null || vb === undefined) return -1;
    let cmp = 0;
    if (typeof va === 'number' && typeof vb === 'number') {
      cmp = va - vb;
    } else if (typeof va === 'boolean' && typeof vb === 'boolean') {
      cmp = Number(va) - Number(vb);
    } else {
      cmp = String(va).localeCompare(String(vb));
    }
    return sortState.dir === 'asc' ? cmp : -cmp;
  });
}

function nextSort(prev, key) {
  if (prev.key !== key) return {key, dir: 'desc'};
  if (prev.dir === 'desc') return {key, dir: 'asc'};
  return {key: null, dir: 'desc'};
}

function SortTh({label, sortKey, sortState, onSort}) {
  const active = sortState.key === sortKey;
  const indicator = !active ? '↕' : sortState.dir === 'asc' ? '↑' : '↓';
  const ariaSort = !active ? 'none' : sortState.dir === 'asc' ? 'ascending' : 'descending';
  return (
    <th scope="col" aria-sort={ariaSort}>
      <button type="button" className={styles.sortBtn} onClick={() => onSort(sortKey)}>
        {label} <span aria-hidden="true">{indicator}</span>
      </button>
    </th>
  );
}

function Pagination({page, totalItems, pageSize, onPageChange, loading = false}) {
  if (!totalItems) return null;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = page * pageSize + 1;
  const end = Math.min(totalItems, (page + 1) * pageSize);
  return (
    <div className={styles.pagination}>
      <span>
        Showing <strong>{start}–{end}</strong> of <strong>{totalItems}</strong> (page {page + 1} of {totalPages})
      </span>
      <div className={styles.paginationBtns}>
        <button
          type="button"
          className={styles.secondaryBtn}
          disabled={loading || page === 0}
          onClick={() => onPageChange(page - 1)}>
          ← Previous
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          disabled={loading || page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}>
          Next →
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [token, setToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [issues, setIssues] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsPage, setEventsPage] = useState(0);
  const [etlReport, setEtlReport] = useState(null);
  const [etlMarkdown, setEtlMarkdown] = useState('');
  const [reportCopied, setReportCopied] = useState(false);
  const [health, setHealth] = useState(null);
  const [popular, setPopular] = useState([]);
  const [summaryPage, setSummaryPage] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [summaryError, setSummaryError] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [topPagesPage, setTopPagesPage] = useState(0);
  const [completionsPage, setCompletionsPage] = useState(0);
  const [feedbackPage, setFeedbackPage] = useState(0);
  const [issuesPage, setIssuesPage] = useState(0);
  const [topPagesSort, setTopPagesSort] = useState({key: null, dir: 'desc'});
  const [completionsSort, setCompletionsSort] = useState({key: null, dir: 'desc'});
  const [feedbackSort, setFeedbackSort] = useState({key: null, dir: 'desc'});
  const [issuesSort, setIssuesSort] = useState({key: null, dir: 'desc'});
  const [eventsSort, setEventsSort] = useState({key: null, dir: 'desc'});

  const sortedTopPages = useMemo(
    () => sortRows(stats?.topPages || [], topPagesSort),
    [stats, topPagesSort],
  );
  const sortedCompletions = useMemo(
    () => sortRows(stats?.lessonCompletions || [], completionsSort),
    [stats, completionsSort],
  );
  const sortedFeedback = useMemo(() => sortRows(feedback, feedbackSort), [feedback, feedbackSort]);
  const sortedIssues = useMemo(() => sortRows(issues, issuesSort), [issues, issuesSort]);
  const sortedEvents = useMemo(() => sortRows(events, eventsSort), [events, eventsSort]);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(TOKEN_KEY);
      if (saved) setToken(saved);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const fetchEventsPage = useCallback(async (authToken, periodDays, pageIdx) => {
    if (!authToken) return;
    setEventsLoading(true);
    try {
      const offset = pageIdx * EVENTS_PAGE_SIZE;
      const res = await fetch(
        `${API_BASE}/admin/events?days=${periodDays}&limit=${EVENTS_PAGE_SIZE}&offset=${offset}`,
        {headers: {Authorization: `Bearer ${authToken}`}, mode: 'cors'},
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setEvents(json.events || []);
      setEventsTotal(typeof json.total === 'number' ? json.total : (json.events || []).length);
      setEventsPage(pageIdx);
    } catch (err) {
      setError(`Could not load events page: ${err.message}`);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const fetchAll = useCallback(async (authToken, periodDays) => {
    if (!authToken) return;
    setLoading(true);
    setError('');
    const headers = {Authorization: `Bearer ${authToken}`};

    try {
      const healthStart = performance.now();
      const [healthRes, popularRes, statsRes, fbRes, issuesRes, eventsRes, reportRes] = await Promise.all([
        fetch(`${API_BASE}/health`, {mode: 'cors'}).catch(() => null),
        fetch(`${API_BASE}/popular`, {mode: 'cors'}).catch(() => null),
        fetch(`${API_BASE}/admin/stats?days=${periodDays}`, {headers, mode: 'cors'}),
        fetch(`${API_BASE}/admin/feedback`, {headers, mode: 'cors'}),
        fetch(`${API_BASE}/admin/issues`, {headers, mode: 'cors'}),
        fetch(`${API_BASE}/admin/events?days=${periodDays}&limit=${EVENTS_PAGE_SIZE}&offset=0`, {
          headers,
          mode: 'cors',
        }),
        fetch(`${API_BASE}/admin/report?days=${periodDays}`, {headers, mode: 'cors'}).catch(() => null),
      ]);
      const healthMs = Math.round(performance.now() - healthStart);

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

      const healthJson = healthRes && healthRes.ok ? await healthRes.json() : null;
      const popularJson = popularRes && popularRes.ok ? await popularRes.json() : {pages: []};
      const statsJson = await statsRes.json();
      const fbJson = fbRes.ok ? await fbRes.json() : {feedback: []};
      const issuesJson = issuesRes.ok ? await issuesRes.json() : {issues: []};
      const eventsJson = eventsRes.ok ? await eventsRes.json() : {events: [], total: 0};
      const reportJson = reportRes && reportRes.ok ? await reportRes.json() : null;

      setHealth(healthJson ? {ok: healthJson.status === 'ok', status: healthJson.status, latencyMs: healthMs} : {ok: false, status: 'error', latencyMs: healthMs});
      setPopular(popularJson.pages || []);
      setStats(statsJson);
      setFeedback(fbJson.feedback || []);
      setIssues(issuesJson.issues || []);
      setEvents(eventsJson.events || []);
      setEtlReport(reportJson?.report || null);
      setEtlMarkdown(reportJson?.markdown || '');
      setEventsTotal(
        typeof eventsJson.total === 'number' ? eventsJson.total : (eventsJson.events || []).length,
      );
      setEventsPage(0);
      setTopPagesPage(0);
      setCompletionsPage(0);
      setFeedbackPage(0);
      setIssuesPage(0);
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
    setEtlReport(null);
    setEtlMarkdown('');
    setHealth(null);
    setPopular([]);
    setSummaryData(null);
    setSummaryError('');
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
      const resp = await fetch(`${API_BASE}/admin/events?days=${days}&limit=50000&format=csv`, {
        headers: {Authorization: `Bearer ${token}`},
        mode: 'cors',
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `learnalgorithms-events-${days === 0 ? 'all' : `${days}d`}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(`CSV download failed: ${err.message}`);
    }
  }

  async function handleCopyReport() {
    if (!etlMarkdown) return;
    try {
      await navigator.clipboard.writeText(etlMarkdown);
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  }

  function handleDownloadReportFile(ext) {
    const content = ext === 'md' ? etlMarkdown : JSON.stringify(etlReport, null, 2);
    if (!content) return;
    const mime = ext === 'md' ? 'text/markdown;charset=utf-8' : 'application/json;charset=utf-8';
    const blob = new Blob([content], {type: mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learnalgorithms-report-${days === 0 ? 'all' : `${days}d`}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleFetchSummary(e) {
    e.preventDefault();
    const cleaned = summaryPage.trim().replace(/\/+$/, '');
    if (!cleaned) return;
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const res = await fetch(
        `${API_BASE}/feedback/summary?page=${encodeURIComponent(cleaned)}`,
        {mode: 'cors'},
      );
      const json = await res.json();
      if (!res.ok) {
        setSummaryData(null);
        setSummaryError(json.error || `HTTP ${res.status}`);
      } else {
        setSummaryData(json);
      }
    } catch (err) {
      setSummaryData(null);
      setSummaryError(`Request failed: ${err.message}`);
    } finally {
      setSummaryLoading(false);
    }
  }

  const knownConceptPages = useMemo(() => {
    const set = new Set();
    for (const f of feedback) {
      if (f.page && f.page.startsWith('/concepts/')) set.add(f.page);
    }
    for (const p of stats?.topPages || []) {
      if (p.page && p.page.startsWith('/concepts/')) set.add(p.page);
    }
    for (const p of popular) {
      if (p.page && p.page.startsWith('/concepts/')) set.add(p.page);
    }
    return [...set].sort();
  }, [feedback, stats, popular]);

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
                <div className={styles.titleRow}>
                  <h1 className={styles.title}>Admin Dashboard</h1>
                  {health && (
                    <span
                      className={health.ok ? styles.healthOk : styles.healthFail}
                      title="Live status from GET /health">
                      ● API {health.ok ? 'OK' : 'ERROR'} · {health.latencyMs} ms
                    </span>
                  )}
                  <a href="/api-docs" className={styles.apiDocsLink}>
                    OpenAPI docs ↗
                  </a>
                </div>
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
                  <option value={0}>All time</option>
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

            <details className={styles.guide}>
              <summary className={styles.guideSummary}>
                ℹ️ How to read these metrics (glossary of terms &amp; event types)
              </summary>
              <div className={styles.guideBody}>
                <div className={styles.guideGrid}>
                  <div>
                    <strong>Core concepts</strong>
                    <ul className={styles.guideList}>
                      <li><strong>Anonymous session:</strong> one browser tab visit, identified by a random UUID in <code>sessionStorage</code> (resets when the tab closes; no IPs or personal data are stored).</li>
                      <li><strong>Views (<code>page_view</code>):</strong> total times a page or lesson was opened (including internal SPA navigation).</li>
                      <li><strong>Avg time (<code>durationMs</code>):</strong> average active time spent on a page before navigating away or hiding the tab (capped at 1 hour).</li>
                      <li><strong>Avg scroll (<code>scrollPct</code>):</strong> average maximum scroll depth reached (0–100%), useful to distinguish quick bounces from full readings.</li>
                      <li><strong>Meta (<code>meta</code>):</strong> extra structured JSON context for each event (e.g. screen size <code>viewport</code>, previous page <code>from</code>, search <code>query</code>/<code>results</code>, opened checkpoint <code>summary</code>, or clicked resource <code>kind</code>).</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Event types recorded</strong>
                    <ul className={styles.guideList}>
                      <li><code>page_view</code> / <code>page_leave</code> — page opened and left (with time &amp; scroll depth).</li>
                      <li><code>lesson_complete</code> / <code>lesson_uncomplete</code> — student toggled the completion button at the bottom of a lesson.</li>
                      <li><code>search</code> — local search query selected, or a query returning <code>results: 0</code> (missing-topic signal).</li>
                      <li><code>details_open</code> — student opened a <code>&lt;details&gt;</code> checkpoint or exercise solution.</li>
                      <li><code>resource_click</code> — click to Java code (<code>java_code</code>) or formal proofs (<code>proof</code>).</li>
                      <li><code>cheat_sheet_filter</code> / <code>cheat_sheet_compare</code> — paradigm/property filters and algorithm comparisons in <code>/cheat-sheet</code>.</li>
                      <li><code>web_vitals</code> — Core Web Vitals performance snapshot (<code>ttfbMs</code>, <code>lcpMs</code>, <code>cls</code>) captured via native <code>PerformanceObserver</code>.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </details>

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
                  <h2 className={styles.sectionTitle}>Top pages ({sortedTopPages.length})</h2>
                  {sortedTopPages.length === 0 ? (
                    <p className={styles.empty}>No page views recorded yet.</p>
                  ) : (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <SortTh label="Page" sortKey="page" sortState={topPagesSort} onSort={(k) => { setTopPagesSort((s) => nextSort(s, k)); setTopPagesPage(0); }} />
                            <SortTh label="Views" sortKey="views" sortState={topPagesSort} onSort={(k) => { setTopPagesSort((s) => nextSort(s, k)); setTopPagesPage(0); }} />
                            <SortTh label="Sessions" sortKey="sessions" sortState={topPagesSort} onSort={(k) => { setTopPagesSort((s) => nextSort(s, k)); setTopPagesPage(0); }} />
                            <SortTh label="Avg time" sortKey="avgDurationMs" sortState={topPagesSort} onSort={(k) => { setTopPagesSort((s) => nextSort(s, k)); setTopPagesPage(0); }} />
                            <SortTh label="Avg scroll" sortKey="avgScrollPct" sortState={topPagesSort} onSort={(k) => { setTopPagesSort((s) => nextSort(s, k)); setTopPagesPage(0); }} />
                          </tr>
                        </thead>
                        <tbody>
                          {sortedTopPages
                            .slice(topPagesPage * PAGE_SIZE, (topPagesPage + 1) * PAGE_SIZE)
                            .map((p) => (
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
                  <Pagination
                    page={topPagesPage}
                    totalItems={sortedTopPages.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setTopPagesPage}
                  />
                </section>

                <section className={styles.section}>
                  <h2 className={styles.sectionTitle}>Lesson completions ({sortedCompletions.length})</h2>
                  {sortedCompletions.length === 0 ? (
                    <p className={styles.empty}>No lesson completions recorded yet.</p>
                  ) : (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <SortTh label="Lesson" sortKey="page" sortState={completionsSort} onSort={(k) => { setCompletionsSort((s) => nextSort(s, k)); setCompletionsPage(0); }} />
                            <SortTh label="Completed" sortKey="completed" sortState={completionsSort} onSort={(k) => { setCompletionsSort((s) => nextSort(s, k)); setCompletionsPage(0); }} />
                            <SortTh label="Uncompleted" sortKey="uncompleted" sortState={completionsSort} onSort={(k) => { setCompletionsSort((s) => nextSort(s, k)); setCompletionsPage(0); }} />
                          </tr>
                        </thead>
                        <tbody>
                          {sortedCompletions
                            .slice(completionsPage * PAGE_SIZE, (completionsPage + 1) * PAGE_SIZE)
                            .map((c) => (
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
                  <Pagination
                    page={completionsPage}
                    totalItems={sortedCompletions.length}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCompletionsPage}
                  />
                </section>
              </>
            )}

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Popular lessons — Matomo last 7 days (<code>GET /popular</code>)</h2>
              {popular.length === 0 ? (
                <p className={styles.empty}>No popular pages returned by Matomo (or MATOMO_TOKEN is not configured).</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">Lesson</th>
                        <th scope="col">Visits (7d)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {popular.map((p) => (
                        <tr key={p.page}>
                          <td className={styles.mono}>{p.page}</td>
                          <td>{p.visits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Latest feedback ({sortedFeedback.length})</h2>
              <form className={styles.summaryBar} onSubmit={handleFetchSummary}>
                <label className={styles.summaryLabel} htmlFor="feedback-summary-page">
                  Live page summary (<code>GET /feedback/summary</code>):
                </label>
                <input
                  id="feedback-summary-page"
                  type="text"
                  list="known-concept-pages"
                  className={styles.summaryInput}
                  placeholder="/concepts/sorting/quicksort"
                  value={summaryPage}
                  onChange={(e) => setSummaryPage(e.target.value)}
                />
                <datalist id="known-concept-pages">
                  {knownConceptPages.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
                <button type="submit" className={styles.secondaryBtn} disabled={summaryLoading}>
                  {summaryLoading ? 'Checking…' : 'Check page'}
                </button>
                {summaryData && (
                  <span className={styles.summaryResult}>
                    <code>{summaryData.page}</code>: 👍 <strong>{summaryData.helpful}</strong> · 👎 <strong>{summaryData.notHelpful}</strong>
                  </span>
                )}
                {summaryError && <span className={styles.summaryError}>{summaryError}</span>}
              </form>
              {sortedFeedback.length === 0 ? (
                <p className={styles.empty}>No feedback votes recorded yet.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <SortTh label="Day" sortKey="day" sortState={feedbackSort} onSort={(k) => { setFeedbackSort((s) => nextSort(s, k)); setFeedbackPage(0); }} />
                        <SortTh label="Page" sortKey="page" sortState={feedbackSort} onSort={(k) => { setFeedbackSort((s) => nextSort(s, k)); setFeedbackPage(0); }} />
                        <SortTh label="Helpful" sortKey="helpful" sortState={feedbackSort} onSort={(k) => { setFeedbackSort((s) => nextSort(s, k)); setFeedbackPage(0); }} />
                        <SortTh label="Comment" sortKey="comment" sortState={feedbackSort} onSort={(k) => { setFeedbackSort((s) => nextSort(s, k)); setFeedbackPage(0); }} />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFeedback
                        .slice(feedbackPage * PAGE_SIZE, (feedbackPage + 1) * PAGE_SIZE)
                        .map((f, idx) => (
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
              <Pagination
                page={feedbackPage}
                totalItems={sortedFeedback.length}
                pageSize={PAGE_SIZE}
                onPageChange={setFeedbackPage}
              />
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Latest GitHub issues ({sortedIssues.length})</h2>
              <p className={styles.sectionHint}>
                Populated automatically via <code>POST /webhooks/github</code> when an issue is actually submitted on GitHub (not just when clicking the link), provided the repository webhook is configured in GitHub Settings → Webhooks.
              </p>
              {sortedIssues.length === 0 ? (
                <p className={styles.empty}>No webhook issue events recorded yet.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <SortTh label="Received" sortKey="received" sortState={issuesSort} onSort={(k) => { setIssuesSort((s) => nextSort(s, k)); setIssuesPage(0); }} />
                        <SortTh label="Action" sortKey="action" sortState={issuesSort} onSort={(k) => { setIssuesSort((s) => nextSort(s, k)); setIssuesPage(0); }} />
                        <SortTh label="Issue" sortKey="number" sortState={issuesSort} onSort={(k) => { setIssuesSort((s) => nextSort(s, k)); setIssuesPage(0); }} />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedIssues
                        .slice(issuesPage * PAGE_SIZE, (issuesPage + 1) * PAGE_SIZE)
                        .map((it) => (
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
              <Pagination
                page={issuesPage}
                totalItems={sortedIssues.length}
                pageSize={PAGE_SIZE}
                onPageChange={setIssuesPage}
              />
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Raw events ({eventsTotal})</h2>
              {sortedEvents.length === 0 ? (
                <p className={styles.empty}>No raw events recorded in this period.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <SortTh label="Timestamp (UTC)" sortKey="ts" sortState={eventsSort} onSort={(k) => setEventsSort((s) => nextSort(s, k))} />
                        <SortTh label="Type" sortKey="eventType" sortState={eventsSort} onSort={(k) => setEventsSort((s) => nextSort(s, k))} />
                        <SortTh label="Page" sortKey="page" sortState={eventsSort} onSort={(k) => setEventsSort((s) => nextSort(s, k))} />
                        <SortTh label="Time / Scroll" sortKey="durationMs" sortState={eventsSort} onSort={(k) => setEventsSort((s) => nextSort(s, k))} />
                        <th scope="col">Meta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedEvents.map((ev, idx) => (
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
              <Pagination
                page={eventsPage}
                totalItems={eventsTotal}
                pageSize={EVENTS_PAGE_SIZE}
                loading={eventsLoading}
                onPageChange={(nextPage) => fetchEventsPage(token, days, nextPage)}
              />
            </section>

            <section className={styles.section}>
              <div className={styles.reportHeader}>
                <h2 className={styles.sectionTitle}>Teaching Report (ETL) &amp; Core Web Vitals</h2>
                {etlMarkdown && (
                  <div className={styles.reportActions}>
                    <button type="button" className={styles.secondaryBtn} onClick={handleCopyReport}>
                      {reportCopied ? 'Copied!' : 'Copy Markdown'}
                    </button>
                    <button type="button" className={styles.secondaryBtn} onClick={() => handleDownloadReportFile('md')}>
                      Download .md
                    </button>
                    <button type="button" className={styles.secondaryBtn} onClick={() => handleDownloadReportFile('json')}>
                      Download .json
                    </button>
                  </div>
                )}
              </div>
              {!etlReport ? (
                <p className={styles.empty}>
                  ETL report endpoint (<code>GET /admin/report</code>) not available yet on the API server. Rebuild the API container on the VPS to enable it.
                </p>
              ) : (
                <>
                  <div className={styles.vitalsGrid}>
                    <div className={styles.vitalCard}>
                      <div className={styles.vitalLabel}>Web Vitals samples</div>
                      <div className={styles.vitalValue}>{etlReport.webVitals?.samples ?? 0}</div>
                      <div className={styles.vitalHint}>Real visits that reported browser speed metrics.</div>
                    </div>
                    <div className={styles.vitalCard}>
                      <div className={styles.vitalLabel}>TTFB (p50 / p95)</div>
                      <div className={styles.vitalValue}>
                        {etlReport.webVitals?.ttfbP50Ms != null
                          ? `${etlReport.webVitals.ttfbP50Ms} / ${etlReport.webVitals.ttfbP95Ms} ms`
                          : '—'}
                      </div>
                      <div className={styles.vitalHint}>Time to First Byte (server response). Good: &lt; 800 ms.</div>
                    </div>
                    <div className={styles.vitalCard}>
                      <div className={styles.vitalLabel}>LCP (p50 / p95)</div>
                      <div className={styles.vitalValue}>
                        {etlReport.webVitals?.lcpP50Ms != null
                          ? `${etlReport.webVitals.lcpP50Ms} / ${etlReport.webVitals.lcpP95Ms} ms`
                          : '—'}
                      </div>
                      <div className={styles.vitalHint}>Largest Contentful Paint (main lesson visible). Good: &lt; 2500 ms.</div>
                    </div>
                    <div className={styles.vitalCard}>
                      <div className={styles.vitalLabel}>CLS (p95)</div>
                      <div className={styles.vitalValue}>
                        {etlReport.webVitals?.clsP95 != null ? etlReport.webVitals.clsP95 : '—'}
                      </div>
                      <div className={styles.vitalHint}>Cumulative Layout Shift (page jumping on load). Good: &lt; 0.1.</div>
                    </div>
                  </div>
                  <p className={styles.sectionHint}>
                    <strong>How to read the ETL report:</strong> <code>p50</code> is the median (typical visit) and <code>p95</code> is the 95th percentile (slowest 5% of visits). <strong>Top Pages</strong> shows views, median active reading time (s), average scroll depth (%), and completions. <strong>Zero-Result Searches</strong> lists queries with 0 matches (missing topics). <strong>Most Opened Checkpoints</strong> counts which <code>&lt;details&gt;</code> solutions students expand most.
                  </p>
                  <pre className={styles.reportPre}>{etlMarkdown}</pre>
                </>
              )}
            </section>
          </>
        )}
      </main>
    </Layout>
  );
}
