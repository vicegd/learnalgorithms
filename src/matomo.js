// Client module: fires trackPageView on every route change (including initial load)
export function onRouteDidUpdate({ location, previousLocation }) {
  if (typeof window === 'undefined' || !window._paq) return;

  if (previousLocation) {
    // SPA navigation: update URL and title before tracking
    window._paq.push(['setCustomUrl', location.pathname]);
    window._paq.push(['setDocumentTitle', document.title]);
  }

  window._paq.push(['trackPageView']);
}
