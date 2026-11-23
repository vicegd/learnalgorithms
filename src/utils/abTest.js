import {trackEvent} from '@site/src/telemetry';

const STORAGE_PREFIX = 'la.ab:';
const EXPOSED_PREFIX = 'la.ab.exp:';

/**
 * Privacy-preserving 50/50 A/B variant assignment stored only in sessionStorage
 * (no cookies, no cross-session tracking, no PII).
 */
export function getAbVariant(experimentId) {
  if (typeof window === 'undefined') return 'A';
  const key = `${STORAGE_PREFIX}${experimentId}`;
  try {
    const existing = window.sessionStorage.getItem(key);
    if (existing === 'A' || existing === 'B') return existing;
    const assigned = Math.random() < 0.5 ? 'A' : 'B';
    window.sessionStorage.setItem(key, assigned);
    return assigned;
  } catch {
    return 'A';
  }
}

export function trackAbExposure(experimentId, variant) {
  if (typeof window === 'undefined') return;
  const key = `${EXPOSED_PREFIX}${experimentId}`;
  try {
    if (window.sessionStorage.getItem(key) === '1') return;
    window.sessionStorage.setItem(key, '1');
  } catch {
    // ignore storage errors
  }
  trackEvent('ab_exposure', {experiment: experimentId, variant});
}

export function trackAbConversion(experimentId, variant) {
  if (typeof window === 'undefined') return;
  trackEvent('ab_conversion', {experiment: experimentId, variant});
}
