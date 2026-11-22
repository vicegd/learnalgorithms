/**
 * Privacy-preserving verifiable progress badge using native Web Crypto API (SHA-256).
 * Contains no personal data; integrity can be verified offline via canonical JSON hash.
 */

export function canonicalPayload(payload) {
  return JSON.stringify({
    platform: payload.platform,
    issuedAt: payload.issuedAt,
    completedCount: payload.completedCount,
    totalLessons: payload.totalLessons,
    masteredChapters: payload.masteredChapters,
    streakDays: payload.streakDays,
    completedLessons: [...payload.completedLessons].sort(),
  });
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createProgressBadge({
  completedLessons,
  totalLessons,
  masteredChapters,
  streakDays,
}) {
  const payload = {
    platform: 'learnalgorithms.dev',
    issuedAt: new Date().toISOString(),
    completedCount: completedLessons.length,
    totalLessons,
    masteredChapters,
    streakDays,
    completedLessons: [...completedLessons].sort(),
  };
  const digest = await sha256Hex(canonicalPayload(payload));
  return {
    schema: 'learnalgorithms-progress-badge/v1',
    payload,
    proof: {
      algorithm: 'SHA-256',
      digest,
    },
  };
}

export async function verifyProgressBadge(badge) {
  if (!badge || !badge.payload || !badge.proof || badge.proof.algorithm !== 'SHA-256') {
    return false;
  }
  const expected = await sha256Hex(canonicalPayload(badge.payload));
  return expected === badge.proof.digest;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderBadgeSvg(badge) {
  const p = badge.payload;
  const pct = p.totalLessons > 0 ? Math.round((p.completedCount / p.totalLessons) * 100) : 0;
  const barWidth = Math.round((560 * pct) / 100);
  const dateStr = (p.issuedAt || '').slice(0, 10);
  const shortHash = `${badge.proof.digest.slice(0, 16)}…${badge.proof.digest.slice(-8)}`;
  const chaptersLabel = `${p.masteredChapters} ${p.masteredChapters === 1 ? 'chapter' : 'chapters'} mastered`;
  const streakLabel = `${p.streakDays}-day streak`;

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320" viewBox="0 0 640 320" role="img" aria-label="Learn Algorithms Study Progress Badge">',
    '  <defs>',
    '    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">',
    '      <stop offset="0%" stop-color="#0f291e"/>',
    '      <stop offset="100%" stop-color="#1b4332"/>',
    '    </linearGradient>',
    '    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">',
    '      <stop offset="0%" stop-color="#3ecc5f"/>',
    '      <stop offset="100%" stop-color="#74e38d"/>',
    '    </linearGradient>',
    '  </defs>',
    '  <rect width="640" height="320" rx="20" fill="url(#bg)"/>',
    '  <rect x="1" y="1" width="638" height="318" rx="19" fill="none" stroke="#3ecc5f" stroke-opacity="0.35" stroke-width="2"/>',
    '  <text x="40" y="54" fill="#74e38d" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="13" font-weight="700" letter-spacing="2">LEARN ALGORITHMS · STUDY PROGRESS BADGE</text>',
    '  <text x="40" y="108" fill="#ffffff" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="40" font-weight="800">' + escapeXml(`${pct}% Completed`) + '</text>',
    '  <text x="600" y="106" text-anchor="end" fill="#c7f0d3" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="18" font-weight="600">' + escapeXml(`${p.completedCount} / ${p.totalLessons} lessons`) + '</text>',
    '  <rect x="40" y="132" width="560" height="14" rx="7" fill="#ffffff" fill-opacity="0.14"/>',
    `  <rect x="40" y="132" width="${barWidth}" height="14" rx="7" fill="url(#bar)"/>`,
    '  <rect x="40" y="170" width="265" height="46" rx="10" fill="#ffffff" fill-opacity="0.08"/>',
    '  <text x="58" y="199" fill="#fef08a" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="16" font-weight="700">' + escapeXml(`🏆  ${chaptersLabel}`) + '</text>',
    '  <rect x="325" y="170" width="275" height="46" rx="10" fill="#ffffff" fill-opacity="0.08"/>',
    '  <text x="343" y="199" fill="#fed7aa" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="16" font-weight="700">' + escapeXml(`🔥  ${streakLabel}`) + '</text>',
    '  <line x1="40" y1="246" x2="600" y2="246" stroke="#ffffff" stroke-opacity="0.14"/>',
    '  <text x="40" y="276" fill="#9bd8b0" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="12">' + escapeXml(`SHA-256: ${shortHash}`) + '</text>',
    '  <text x="600" y="276" text-anchor="end" fill="#9bd8b0" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="12">' + escapeXml(`learnalgorithms.dev · ${dateStr}`) + '</text>',
    '</svg>',
  ].join('\n');
}
