import React, {useMemo, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {usePluginData} from '@docusaurus/useGlobalData';
import {normalizePermalink, useStudyProgress} from '@site/src/utils/studyProgress';
import styles from './knowledge-graph.module.css';

const CHAPTER_ORDER = [
  'Principles Of Algorithmics',
  'Sorting',
  'Brute Force',
  'Divide And Conquer',
  'Greedy Algorithms',
  'Dynamic Programming',
  'Backtracking',
  'Branch And Bound',
  'Synthesis',
  'Parallel Algorithms',
  'Mathematical Background',
];

function isLessonUrl(url) {
  return !/\/(exercises|proofs|references|summary)$/.test(url);
}

export default function KnowledgeGraphPage() {
  const siteData = usePluginData('docusaurus-plugin-site-data');
  const {isCompleted} = useStudyProgress();
  const [selectedUrl, setSelectedUrl] = useState(null);

  const lessons = useMemo(() => {
    const raw = (siteData?.concepts || []).filter((c) => isLessonUrl(normalizePermalink(c.url)));
    return raw.map((c) => ({
      ...c,
      url: normalizePermalink(c.url),
      prerequisites: (c.prerequisites || []).map(normalizePermalink),
    }));
  }, [siteData]);

  const byUrl = useMemo(() => {
    const map = new Map();
    for (const l of lessons) map.set(l.url, l);
    return map;
  }, [lessons]);

  const dependentsByUrl = useMemo(() => {
    const map = new Map();
    for (const l of lessons) map.set(l.url, []);
    for (const l of lessons) {
      for (const pre of l.prerequisites) {
        if (map.has(pre)) map.get(pre).push(l.url);
      }
    }
    return map;
  }, [lessons]);

  const grouped = useMemo(() => {
    const groups = new Map();
    for (const cat of CHAPTER_ORDER) groups.set(cat, []);
    for (const l of lessons) {
      if (!groups.has(l.category)) groups.set(l.category, []);
      groups.get(l.category).push(l);
    }
    return [...groups.entries()].filter(([, list]) => list.length > 0);
  }, [lessons]);

  const selected = selectedUrl ? byUrl.get(selectedUrl) : null;
  const selectedPrereqs = useMemo(
    () => new Set(selected ? selected.prerequisites : []),
    [selected],
  );
  const selectedUnlocks = useMemo(
    () => new Set(selected ? dependentsByUrl.get(selected.url) || [] : []),
    [selected, dependentsByUrl],
  );

  const totalEdges = useMemo(
    () => lessons.reduce((acc, l) => acc + l.prerequisites.length, 0),
    [lessons],
  );

  return (
    <Layout
      title="Knowledge Graph"
      description="Interactive prerequisite and dependency knowledge graph of all lessons in the course">
      <main className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Knowledge Graph</p>
          <h1 className={styles.title}>Course Dependency Map</h1>
          <p className={styles.subtitle}>
            Explore how the <strong>{lessons.length} lessons</strong> and{' '}
            <strong>{totalEdges} prerequisite links</strong> connect across chapters. Click any
            lesson to highlight what you should read first and which topics it unlocks.
          </p>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={clsx(styles.dot, styles.dotSelected)} /> Selected lesson
            </span>
            <span className={styles.legendItem}>
              <span className={clsx(styles.dot, styles.dotPrereq)} /> Prerequisites (read first)
            </span>
            <span className={styles.legendItem}>
              <span className={clsx(styles.dot, styles.dotUnlocks)} /> Unlocks (next lessons)
            </span>
            <span className={styles.legendItem}>
              <span className={clsx(styles.dot, styles.dotDone)} /> ✓ Completed in this browser
            </span>
          </div>
        </header>

        {selected && (
          <section className={styles.inspector} aria-live="polite" aria-label="Selected lesson details">
            <div className={styles.inspectorTop}>
              <h2 className={styles.inspectorTitle}>
                {selected.title} {isCompleted(selected.url) ? '✓' : ''}
              </h2>
              <div className={styles.inspectorActions}>
                <Link to={selected.url} className={styles.openLink}>
                  Open lesson →
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedUrl(null)}
                  className={styles.clearBtn}>
                  Clear selection
                </button>
              </div>
            </div>
            <div className={styles.inspectorCols}>
              <div>
                <p className={styles.inspectorLabel}>
                  Prerequisites ({selected.prerequisites.length})
                </p>
                <div className={styles.relList}>
                  {selected.prerequisites.length === 0 ? (
                    <span className={styles.edgeMeta}>No prerequisites — great starting point!</span>
                  ) : (
                    selected.prerequisites.map((u) => {
                      const target = byUrl.get(u);
                      return (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setSelectedUrl(u)}
                          className={clsx(styles.relChip, styles.relChipPrereq)}>
                          {target ? target.title : u}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              <div>
                <p className={styles.inspectorLabel}>
                  Unlocks ({selectedUnlocks.size})
                </p>
                <div className={styles.relList}>
                  {selectedUnlocks.size === 0 ? (
                    <span className={styles.edgeMeta}>Capstone / leaf lesson in this branch.</span>
                  ) : (
                    [...selectedUnlocks].map((u) => {
                      const target = byUrl.get(u);
                      return (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setSelectedUrl(u)}
                          className={clsx(styles.relChip, styles.relChipUnlocks)}>
                          {target ? target.title : u}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <div className={styles.chapters}>
          {grouped.map(([category, list]) => {
            const doneCount = list.filter((l) => isCompleted(l.url)).length;
            return (
              <section key={category} className={styles.chapterBlock}>
                <div className={styles.chapterHeader}>
                  <h2 className={styles.chapterTitle}>{category}</h2>
                  <span className={styles.chapterCount}>
                    {doneCount}/{list.length} completed
                  </span>
                </div>
                <div className={styles.nodeGrid}>
                  {list.map((lesson) => {
                    const isSel = selectedUrl === lesson.url;
                    const isPre = selectedPrereqs.has(lesson.url);
                    const isUnl = selectedUnlocks.has(lesson.url);
                    const dimmed = selectedUrl && !isSel && !isPre && !isUnl;
                    const done = isCompleted(lesson.url);
                    return (
                      <button
                        key={lesson.url}
                        type="button"
                        onClick={() => setSelectedUrl(isSel ? null : lesson.url)}
                        aria-pressed={isSel}
                        className={clsx(
                          styles.node,
                          isSel && styles.nodeSelected,
                          isPre && styles.nodePrereq,
                          isUnl && styles.nodeUnlocks,
                          dimmed && styles.nodeDimmed,
                        )}>
                        {done && <span className={styles.doneBadge} aria-label="Completed">✓</span>}
                        <span>{lesson.title}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </Layout>
  );
}
