// Register the PWA Service Worker on production host for installability & offline reading.
if (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  window.location.hostname === 'learnalgorithms.dev'
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
