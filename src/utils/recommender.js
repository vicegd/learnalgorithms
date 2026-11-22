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
      const unlockText = `unlocks ${unlocks} ${unlocks === 1 ? 'topic' : 'topics'}`;
      let prereqText;
      if (l.prerequisites.length === 0) {
        prereqText = 'Foundational lesson';
      } else if (l.prerequisites.length === 1) {
        const preLesson = byUrl.get(l.prerequisites[0]);
        prereqText = preLesson?.title
          ? `Prerequisite completed (${preLesson.title})`
          : 'Prerequisite completed';
      } else {
        prereqText = `All ${l.prerequisites.length} prerequisites completed`;
      }
      const reason =
        l.prerequisites.length === 0
          ? unlocks > 0
            ? `${prereqText} · ${unlockText}`
            : `${prereqText} · no prerequisites required`
          : unlocks > 0
            ? `${prereqText} · ${unlockText}`
            : prereqText;
      return {
        ...l,
        unlocks,
        reason,
      };
    });

  candidates.sort((a, b) => b.unlocks - a.unlocks || a.prerequisites.length - b.prerequisites.length);
  return candidates.slice(0, limit);
}
