const API_ENDPOINT = 'https://api.learnalgorithms.dev/events';
const SESSION_KEY = 'learnalgorithms:telemetry-session:v1';

let currentPage = null;
let activeSince = 0;
let accumulatedMs = 0;
let hasFlushedLeave = false;
let maxScrollPct = 0;
let listenersAttached = false;
let lcpMs = null;
let clsScore = 0;
let vitalsFlushed = false;

function isProductionHost() {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'learnalgorithms.dev';
}

function generateUuidV4() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getSessionId() {
  if (typeof window === 'undefined') return '';
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateUuidV4();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return generateUuidV4();
  }
}

function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function viewportBucket() {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 640) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function updateScrollDepth() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop || 0;
  const scrollable = doc.scrollHeight - window.innerHeight;
  const pct = scrollable <= 0 ? 100 : Math.min(100, Math.round((scrollTop / scrollable) * 100));
  if (pct > maxScrollPct) {
    maxScrollPct = pct;
  }
}

function sendEvents(events) {
  if (!isProductionHost() || !events.length) return;
  try {
    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({events}),
      keepalive: true,
      mode: 'cors',
    }).catch(() => {});
  } catch {
    // Ignore network/browser errors
  }
}

export function trackEvent(eventType, meta = null, pageOverride = null) {
  if (typeof window === 'undefined') return;
  const page = normalizePath(pageOverride || window.location.pathname);
  const payload = {
    sessionId: getSessionId(),
    eventType,
    page,
  };
  if (meta && typeof meta === 'object') {
    payload.meta = meta;
  }
  sendEvents([payload]);
}

function pauseTimer() {
  if (activeSince) {
    accumulatedMs += Math.max(0, Date.now() - activeSince);
    activeSince = 0;
  }
}

function resumeTimer() {
  if (!activeSince && currentPage && !hasFlushedLeave) {
    activeSince = Date.now();
  }
}

function flushPageLeave() {
  if (!currentPage || hasFlushedLeave) return;
  hasFlushedLeave = true;
  pauseTimer();
  updateScrollDepth();
  sendEvents([
    {
      sessionId: getSessionId(),
      eventType: 'page_leave',
      page: currentPage,
      durationMs: Math.round(accumulatedMs),
      scrollPct: maxScrollPct,
    },
  ]);
}

function observeWebVitals() {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last && typeof last.startTime === 'number') {
        lcpMs = Math.round(last.startTime);
      }
    });
    lcpObserver.observe({type: 'largest-contentful-paint', buffered: true});
  } catch {
    // Unsupported browser
  }
  try {
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput && typeof entry.value === 'number') {
          clsScore += entry.value;
        }
      }
    });
    clsObserver.observe({type: 'layout-shift', buffered: true});
  } catch {
    // Unsupported browser
  }
}

function flushWebVitals() {
  if (vitalsFlushed || !currentPage || typeof performance === 'undefined') return;
  vitalsFlushed = true;
  let ttfbMs = null;
  let transferBytes = 0;
  try {
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      if (typeof nav.responseStart === 'number') {
        ttfbMs = Math.round(nav.responseStart);
      }
      if (typeof nav.transferSize === 'number' && nav.transferSize >= 0) {
        transferBytes += nav.transferSize;
      }
    }
    const resources = performance.getEntriesByType('resource') || [];
    for (const r of resources) {
      if (typeof r.transferSize === 'number' && r.transferSize > 0) {
        transferBytes += r.transferSize;
      }
    }
  } catch {
    // Ignore
  }
  const meta = {};
  if (ttfbMs !== null) meta.ttfbMs = ttfbMs;
  if (lcpMs !== null) meta.lcpMs = lcpMs;
  meta.cls = Math.round(clsScore * 1000) / 1000;
  // Sustainable Web Design Model (SWDM): ~0.81 kWh/GB * 442 gCO2/kWh ≈ 0.35 mg CO2 per KB
  const transferKB = Math.round((transferBytes / 1024) * 10) / 10;
  meta.transferKB = transferKB;
  meta.co2Mg = Math.round(transferKB * 0.35 * 10) / 10;
  if (Object.keys(meta).length > 0) {
    trackEvent('web_vitals', meta, currentPage);
  }
}

function attachGlobalListeners() {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;

  observeWebVitals();
  window.addEventListener('scroll', updateScrollDepth, {passive: true});
  window.addEventListener('pagehide', () => {
    flushPageLeave();
    flushWebVitals();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      pauseTimer();
      flushWebVitals();
    } else if (document.visibilityState === 'visible') {
      resumeTimer();
    }
  });

  // Track opening of <details> checkpoints / exercise solutions inside lessons
  document.addEventListener(
    'toggle',
    (e) => {
      const el = e.target;
      if (!el || el.tagName !== 'DETAILS' || !el.open) return;
      if (!el.closest('main') || currentPage === '/api-docs') return;
      const summaryEl = el.querySelector('summary');
      const summary = summaryEl ? summaryEl.textContent.replace(/\s+/g, ' ').trim().slice(0, 100) : '';
      if (summary) {
        trackEvent('details_open', {summary});
      }
    },
    true,
  );

  // Track clicks on Java companion code links and formal proof links
  document.addEventListener('click', (e) => {
    const link = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!link || !link.closest('main')) return;
    const href = link.getAttribute('href') || '';
    if (href.includes('github.com/vicegd/algorithms')) {
      trackEvent('resource_click', {kind: 'java_code', target: href.slice(0, 120)});
    } else if (/\/proofs(#|$)/.test(href)) {
      trackEvent('resource_click', {kind: 'proof', target: href.slice(0, 120)});
    }
  });
}

export function onRouteDidUpdate({location, previousLocation}) {
  if (typeof window === 'undefined') return;
  attachGlobalListeners();

  const nextPage = normalizePath(location.pathname);
  if (previousLocation && normalizePath(previousLocation.pathname) === nextPage) {
    return;
  }

  if (previousLocation && currentPage) {
    flushPageLeave();
  }

  currentPage = nextPage;
  accumulatedMs = 0;
  hasFlushedLeave = false;
  activeSince = document.visibilityState === 'hidden' ? 0 : Date.now();
  maxScrollPct = 0;
  updateScrollDepth();

  const meta = {viewport: viewportBucket()};
  if (previousLocation) {
    meta.from = normalizePath(previousLocation.pathname);
  } else if (document.referrer) {
    try {
      const refHost = new URL(document.referrer).hostname;
      if (refHost && refHost !== window.location.hostname) {
        meta.referrerHost = refHost;
      }
    } catch {
      // Ignore invalid referrer
    }
  }

  sendEvents([
    {
      sessionId: getSessionId(),
      eventType: 'page_view',
      page: currentPage,
      meta,
    },
  ]);
}
