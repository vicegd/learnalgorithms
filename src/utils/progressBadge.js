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
