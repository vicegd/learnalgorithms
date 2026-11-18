const API_ENDPOINT = 'https://api.learnalgorithms.dev/events';
const SESSION_KEY = 'learnalgorithms:telemetry-session:v1';

let currentPage = null;
let enteredAt = 0;
let maxScrollPct = 0;
let listenersAttached = false;

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

function flushPageLeave() {
  if (!currentPage || !enteredAt) return;
  updateScrollDepth();
  const durationMs = Math.max(0, Math.round(Date.now() - enteredAt));
  sendEvents([
    {
      sessionId: getSessionId(),
      eventType: 'page_leave',
      page: currentPage,
      durationMs,
      scrollPct: maxScrollPct,
    },
  ]);
  enteredAt = 0;
}

function attachGlobalListeners() {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;

  window.addEventListener('scroll', updateScrollDepth, {passive: true});
  window.addEventListener('pagehide', flushPageLeave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPageLeave();
    } else if (document.visibilityState === 'visible' && currentPage && !enteredAt) {
      enteredAt = Date.now();
    }
  });
}

export function onRouteDidUpdate({location, previousLocation}) {
  if (typeof window === 'undefined') return;
  attachGlobalListeners();

  if (previousLocation && currentPage) {
    flushPageLeave();
  }

  currentPage = normalizePath(location.pathname);
  enteredAt = Date.now();
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
