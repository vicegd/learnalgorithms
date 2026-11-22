import {normalizePermalink} from './studyProgress.js';

function isLessonUrl(url) {
  return !/\/(exercises|proofs|references|summary)$/.test(url);
}

/**
 * Explainable next-lesson recommender based on the course prerequisite DAG.
 *
 * Selects uncompleted lessons whose prerequisites are all satisfied,
 * ranking them by how many downstream lessons they unlock (out-degree).
 */
export function recommendNextLessons(concepts, completedSet, limit = 3) {
  const lessons = (concepts || [])
    .map((c) => ({
      ...c,
      url: normalizePermalink(c.url),
      prerequisites: (c.prerequisites || []).map(normalizePermalink),
    }))
    .filter((c) => c.url && isLessonUrl(c.url));

  const byUrl = new Map(lessons.map((l) => [l.url, l]));
  const unlocksCount = new Map(lessons.map((l) => [l.url, 0]));

  for (const l of lessons) {
    for (const pre of l.prerequisites) {
      if (unlocksCount.has(pre)) {
        unlocksCount.set(pre, unlocksCount.get(pre) + 1);
      }
    }
  }

  const candidates = lessons
    .filter((l) => !completedSet.has(l.url))
    .filter((l) => l.prerequisites.every((pre) => !byUrl.has(pre) || completedSet.has(pre)))
    .map((l) => {
      const unlocks = unlocksCount.get(l.url) || 0;
      const reason =
        l.prerequisites.length === 0
          ? unlocks > 0
            ? `Foundational lesson · unlocks ${unlocks} ${unlocks === 1 ? 'topic' : 'topics'}`
            : 'Foundational lesson · no prerequisites required'
          : unlocks > 0
            ? `All ${l.prerequisites.length} prerequisites completed · unlocks ${unlocks} ${unlocks === 1 ? 'topic' : 'topics'}`
            : `All ${l.prerequisites.length} prerequisites completed`;
      return {
        ...l,
        unlocks,
        reason,
      };
    });

  candidates.sort((a, b) => b.unlocks - a.unlocks || a.prerequisites.length - b.prerequisites.length);
  return candidates.slice(0, limit);
}
