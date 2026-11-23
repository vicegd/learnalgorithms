import React, {useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {usePluginData} from '@docusaurus/useGlobalData';
import Layout from '@theme/Layout';
import styles from './index.module.css';
import Icon from '@site/src/components/Icon';
import {normalizePermalink, useStudyProgress} from '@site/src/utils/studyProgress';
import {recommendNextLessons} from '@site/src/utils/recommender';
import {createProgressBadge, renderBadgeSvg, verifyProgressBadge} from '@site/src/utils/progressBadge';

const CHAPTERS = [
  {
    accentClass: styles.accentPurple,
    icon: <Icon name="bulb" size={30} />,
    eyebrow: 'Part I · Chapter 1',
    title: 'Principles of Algorithmics',
    topics: [
      { label: "Algorithmic thinking", to: '/concepts/principles-of-algorithmics/algorithmic-thinking' },
      { label: "Pairwise product", to: '/concepts/principles-of-algorithmics/case-study-pairwise' },
      { label: "Data structures", to: '/concepts/principles-of-algorithmics/data-structures' },
      { label: "Measuring efficiency", to: '/concepts/principles-of-algorithmics/measuring-efficiency' },
      { label: "Complexity analysis", to: '/concepts/principles-of-algorithmics/complexity-analysis' },
      { label: "Big O", to: '/concepts/principles-of-algorithmics/asymptotic-notation' },
      { label: "Growth rates", to: '/concepts/principles-of-algorithmics/growth-rates' },
      { label: "Loops", to: '/concepts/principles-of-algorithmics/complexity-of-loops' },
      { label: "Searching", to: '/concepts/principles-of-algorithmics/searching-case-studies' },
      { label: "Summary", to: '/concepts/principles-of-algorithmics/summary' },
      { label: "Exercises", to: '/concepts/principles-of-algorithmics/exercises' },
      { label: "Proofs", to: '/concepts/principles-of-algorithmics/proofs' },
      { label: "References", to: '/concepts/principles-of-algorithmics/references' },
    ],
    cta: '13 lessons',
    to: '/concepts/principles-of-algorithmics',
  },
  {
    accentClass: styles.accentBlue,
    icon: <Icon name="bars" size={30} />,
    eyebrow: 'Part II · Chapter 2',
    title: 'Sorting',
    topics: [
      { label: "The sorting problem", to: '/concepts/sorting/the-sorting-problem' },
      { label: "Bubble", to: '/concepts/sorting/bubble-sort' },
      { label: "Insertion", to: '/concepts/sorting/insertion-sort' },
      { label: "Selection", to: '/concepts/sorting/selection-sort' },
      { label: "Quicksort", to: '/concepts/sorting/quicksort' },
      { label: "Shellsort", to: '/concepts/sorting/efficient-sorting#shellsort-insertion-over-long-distances' },
      { label: "Heapsort", to: '/concepts/sorting/efficient-sorting#heapsort-selection-with-a-heap' },
      { label: "Mergesort", to: '/concepts/sorting/efficient-sorting#mergesort-sorting-by-merging' },
      { label: "Radix sort", to: '/concepts/sorting/efficient-sorting#sorting-without-comparisons' },
      { label: "Choosing an algorithm", to: '/concepts/sorting/comparing-sorting-algorithms' },
      { label: "Summary", to: '/concepts/sorting/summary' },
      { label: "Exercises", to: '/concepts/sorting/exercises' },
      { label: "Proofs", to: '/concepts/sorting/proofs' },
      { label: "References", to: '/concepts/sorting/references' },
    ],
    cta: '11 lessons',
    to: '/concepts/sorting',
  },
  {
    accentClass: styles.accentGreen,
    icon: <Icon name="hammer" size={30} />,
    eyebrow: 'Part III · Chapter 3',
    title: 'Brute Force',
    topics: [
      { label: "Brute force", to: '/concepts/brute-force/brute-force-and-exhaustive-search' },
      { label: "String matching", to: '/concepts/brute-force/brute-force-and-exhaustive-search#example-naive-string-matching' },
      { label: "Subsets", to: '/concepts/brute-force/brute-force-and-exhaustive-search#example-exhaustive-search-over-subsets' },
      { label: "When to use it", to: '/concepts/brute-force/brute-force-and-exhaustive-search#when-brute-force-is-the-right-choice' },
      { label: "Summary", to: '/concepts/brute-force/summary' },
      { label: "Exercises", to: '/concepts/brute-force/exercises' },
      { label: "References", to: '/concepts/brute-force/references' },
    ],
    cta: '4 lessons',
    to: '/concepts/brute-force',
  },
  {
    accentClass: styles.accentGreen,
    icon: <Icon name="split" size={30} />,
    eyebrow: 'Part III · Chapter 4',
    title: 'Divide and Conquer',
    topics: [
      { label: "The scheme", to: '/concepts/divide-and-conquer/divide-and-conquer-scheme' },
      { label: "Recurrences", to: '/concepts/divide-and-conquer/analysis' },
      { label: "Binary search", to: '/concepts/divide-and-conquer/numbers-and-searches#sequential-and-binary-search' },
      { label: "Fibonacci", to: '/concepts/divide-and-conquer/numbers-and-searches#the-fibonacci-numbers' },
      { label: "Mergesort", to: '/concepts/divide-and-conquer/classic-problems#mergesort' },
      { label: "Hanoi", to: '/concepts/divide-and-conquer/classic-problems#the-towers-of-hanoi' },
      { label: "Karatsuba", to: '/concepts/divide-and-conquer/classic-problems#multiplication-of-large-integers' },
      { label: "Trominoes", to: '/concepts/divide-and-conquer/classic-problems#the-tromino-puzzle' },
      { label: "Median", to: '/concepts/divide-and-conquer/majority-mode-and-median#the-median' },
      { label: "Summary", to: '/concepts/divide-and-conquer/summary' },
      { label: "Exercises", to: '/concepts/divide-and-conquer/exercises' },
      { label: "Proofs", to: '/concepts/divide-and-conquer/proofs' },
      { label: "References", to: '/concepts/divide-and-conquer/references' },
    ],
    cta: '9 lessons',
    to: '/concepts/divide-and-conquer',
  },
  {
    accentClass: styles.accentGreen,
    icon: <Icon name="coin" size={30} />,
    eyebrow: 'Part III · Chapter 5',
    title: 'Greedy Algorithms',
    topics: [
      { label: "The greedy method", to: '/concepts/greedy-algorithms/greedy-method' },
      { label: "Change", to: '/concepts/greedy-algorithms/greedy-method#the-problem-of-the-change' },
      { label: "Knapsack", to: '/concepts/greedy-algorithms/classic-problems#the-knapsack-problem' },
      { label: "Plumber", to: '/concepts/greedy-algorithms/classic-problems#the-diligent-plumber' },
      { label: "Coloring", to: '/concepts/greedy-algorithms/classic-problems#graph-coloring' },
      { label: "Prim and Kruskal", to: '/concepts/greedy-algorithms/classic-problems#minimum-spanning-trees-prim-and-kruskal' },
      { label: "Summary", to: '/concepts/greedy-algorithms/summary' },
      { label: "Exercises", to: '/concepts/greedy-algorithms/exercises' },
      { label: "Proofs", to: '/concepts/greedy-algorithms/proofs' },
      { label: "References", to: '/concepts/greedy-algorithms/references' },
    ],
    cta: '6 lessons',
    to: '/concepts/greedy-algorithms',
  },
  {
    accentClass: styles.accentGreen,
    icon: <Icon name="grid" size={30} />,
    eyebrow: 'Part III · Chapter 6',
    title: 'Dynamic Programming',
    topics: [
      { label: "The method", to: '/concepts/dynamic-programming/dynamic-programming-method' },
      { label: "Binomials", to: '/concepts/dynamic-programming/classic-problems#combinations' },
      { label: "Knapsack", to: '/concepts/dynamic-programming/classic-problems#the-01-knapsack-problem' },
      { label: "Change", to: '/concepts/dynamic-programming/classic-problems#the-problem-of-the-change' },
      { label: "River", to: '/concepts/dynamic-programming/classic-problems#cheaper-travel-on-the-river' },
      { label: "LCS and edit distance", to: '/concepts/dynamic-programming/classic-problems#beyond-the-course-dynamic-programming-on-strings' },
      { label: "Summary", to: '/concepts/dynamic-programming/summary' },
      { label: "Exercises", to: '/concepts/dynamic-programming/exercises' },
      { label: "Proofs", to: '/concepts/dynamic-programming/proofs' },
      { label: "References", to: '/concepts/dynamic-programming/references' },
    ],
    cta: '6 lessons',
    to: '/concepts/dynamic-programming',
  },
  {
    accentClass: styles.accentOrange,
    icon: <Icon name="tree" size={30} />,
    eyebrow: 'Part III · Chapter 7',
    title: 'Backtracking',
    topics: [
      { label: "The scheme", to: '/concepts/backtracking/backtracking-scheme' },
      { label: "Pruning", to: '/concepts/backtracking/backtracking-scheme#pruning-the-key-to-efficiency' },
      { label: "Permutations", to: '/concepts/backtracking/classic-problems#permutations' },
      { label: "Subset sum", to: '/concepts/backtracking/classic-problems#subset-sum' },
      { label: "N-queens", to: '/concepts/backtracking/classic-problems#n-queens' },
      { label: "Coloring", to: '/concepts/backtracking/classic-problems#graph-coloring' },
      { label: "Sudoku", to: '/concepts/backtracking/classic-problems#sudoku' },
      { label: "Summary", to: '/concepts/backtracking/summary' },
      { label: "Exercises", to: '/concepts/backtracking/exercises' },
      { label: "Proofs", to: '/concepts/backtracking/proofs' },
      { label: "References", to: '/concepts/backtracking/references' },
    ],
    cta: '6 lessons',
    to: '/concepts/backtracking',
  },
  {
    accentClass: styles.accentOrange,
    icon: <Icon name="target" size={30} />,
    eyebrow: 'Part III · Chapter 8',
    title: 'Branch and Bound',
    topics: [
      { label: "The scheme", to: '/concepts/branch-and-bound/branch-and-bound-scheme' },
      { label: "Bounds", to: '/concepts/branch-and-bound/branch-and-bound-scheme#bounding-the-pruning-function' },
      { label: "A*", to: '/concepts/branch-and-bound/branch-and-bound-scheme#branch-and-bound-and-a' },
      { label: "Assignment", to: '/concepts/branch-and-bound/classic-problems#task-assignment' },
      { label: "Knapsack", to: '/concepts/branch-and-bound/classic-problems#01-knapsack' },
      { label: "Puzzles", to: '/concepts/branch-and-bound/classic-problems#sliding-puzzles' },
      { label: "TSP", to: '/concepts/branch-and-bound/classic-problems#the-traveling-salesman' },
      { label: "Summary", to: '/concepts/branch-and-bound/summary' },
      { label: "Exercises", to: '/concepts/branch-and-bound/exercises' },
      { label: "Proofs", to: '/concepts/branch-and-bound/proofs' },
      { label: "References", to: '/concepts/branch-and-bound/references' },
    ],
    cta: '6 lessons',
    to: '/concepts/branch-and-bound',
  },
  {
    accentClass: styles.accentGreen,
    icon: <Icon name="split" size={30} />,
    eyebrow: 'Part III · Synthesis',
    title: 'Choosing a Technique',
    topics: [
      { label: "One problem, six techniques", to: '/concepts/synthesis/choosing-a-technique#one-problem-six-techniques-the-01-knapsack' },
      { label: "Change", to: '/concepts/synthesis/choosing-a-technique#the-change-problem-when-greedy-is-enough' },
      { label: "Fibonacci", to: '/concepts/synthesis/choosing-a-technique#fibonacci-from-exponential-to-logarithmic' },
      { label: "A guide for choosing", to: '/concepts/synthesis/choosing-a-technique#a-guide-for-choosing' },
    ],
    cta: '1 lesson',
    to: '/concepts/synthesis/choosing-a-technique',
  },
  {
    accentClass: styles.accentTeal,
    icon: <Icon name="cpu" size={30} />,
    eyebrow: 'Part IV · Chapter 9',
    title: 'Parallel Algorithms',
    topics: [
      { label: "Concurrency and parallelism", to: '/concepts/parallel-algorithms/parallel-algorithms' },
      { label: "Fork/Join", to: '/concepts/parallel-algorithms/fork-join-framework' },
      { label: "Thresholds", to: '/concepts/parallel-algorithms/fork-join-framework#choosing-the-threshold' },
      { label: "Speedup", to: '/concepts/parallel-algorithms/parallel-performance#speedup-and-efficiency' },
      { label: "Amdahl's law", to: '/concepts/parallel-algorithms/parallel-performance#amdahls-law' },
      { label: "Summary", to: '/concepts/parallel-algorithms/summary' },
      { label: "Exercises", to: '/concepts/parallel-algorithms/exercises' },
      { label: "Proofs", to: '/concepts/parallel-algorithms/proofs' },
      { label: "References", to: '/concepts/parallel-algorithms/references' },
    ],
    cta: '7 lessons',
    to: '/concepts/parallel-algorithms',
  },
  {
    accentClass: styles.accentRose,
    icon: <Icon name="sigma" size={30} />,
    eyebrow: 'Appendix A',
    title: 'Mathematical Background',
    topics: [
      { label: "Sums", to: '/concepts/mathematical-background/sums-and-logarithms#arithmetic-series' },
      { label: "Logarithms", to: '/concepts/mathematical-background/sums-and-logarithms#logarithms' },
      { label: "Stirling", to: '/concepts/mathematical-background/sums-and-logarithms#factorials-and-stirlings-formula' },
      { label: "Induction", to: '/concepts/mathematical-background/induction-and-recurrences#mathematical-induction' },
      { label: "Invariants", to: '/concepts/mathematical-background/induction-and-recurrences#loop-invariants' },
      { label: "Recurrences", to: '/concepts/mathematical-background/induction-and-recurrences#recurrences' },
      { label: "Summary", to: '/concepts/mathematical-background/summary' },
      { label: "Exercises", to: '/concepts/mathematical-background/exercises' },
      { label: "References", to: '/concepts/mathematical-background/references' },
    ],
    cta: '5 lessons',
    to: '/concepts/mathematical-background',
  },
];

const ALGORITHMS_SECTION = {
  accentClass: styles.accentGreen,
  icon: <Icon name="book" size={30} />,
    eyebrow: 'Algorithm Collection',
  title: 'Algorithm Sheets',
  description:
    'Rigorous, interactive breakdowns of each algorithm: from the naive approach and why it fails, through the full derivation, to annotated multi-language code and step-by-step table visualizations.',
  topics: ['Problem Statement', 'Complexity Analysis', 'Pseudocode', 'Interactive Trace', '...'],
  cta: 'Browse Algorithms',
  to: '/algorithms/',
};

function Intro({
  totalCompleted,
  totalLessons,
  streak,
  masteredChapters,
  recommendations,
  onResetProgress,
  onExportBadge,
}) {
  const pct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;
  return (
    <header className={styles.intro}>
      <p className={styles.heroEyebrow}>Learn Algorithms</p>
      <h1 className={styles.introTitle}>Algorithmics, from intuition to proof</h1>
      <p className={styles.introText}>
        A complete course on the design and analysis of algorithms: how to measure their cost,
        how to analyze it before running a single line, and the main strategies to design efficient
        solutions. Every example has been executed and every time has been measured.
      </p>
      <div className={styles.heroButtons}>
        <Link className={clsx('button button--lg', styles.btnPrimary)} to="/concepts/">
          Start the course →
        </Link>
        <Link className={clsx('button button--lg', styles.btnGhost)} to="/cheat-sheet">
          Big-O Cheat Sheet
        </Link>
        <Link className={clsx('button button--lg', styles.btnGhost)} to="/knowledge-graph">
          Knowledge Graph
        </Link>
        <Link className={clsx('button button--lg', styles.btnGhost)} to="/flashcards">
          Flashcards
        </Link>
        <Link className={clsx('button button--lg', styles.btnGhost)} to="/benchmark">
          WASM / HPC Lab
        </Link>
        <Link className={clsx('button button--lg', styles.btnGhost)} to="/concepts/glossary">
          Glossary
        </Link>
      </div>
      {totalCompleted > 0 && (
        <div className={styles.overallProgress}>
          <div className={styles.overallProgressHeader}>
            <span>
              Study progress: <strong>{totalCompleted}</strong> / {totalLessons} lessons ({pct}%)
            </span>
            <div className={styles.progressActions}>
              <button
                type="button"
                onClick={onExportBadge}
                className={styles.exportBadgeBtn}
                title="View and download your visual progress badge and verifiable JSON proof">
                Export progress
              </button>
              <button
                type="button"
                onClick={onResetProgress}
                className={styles.resetProgressBtn}>
                Reset
              </button>
            </div>
          </div>
          <div className={styles.progressTrack} aria-hidden="true">
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          {(streak > 0 || masteredChapters > 0) && (
            <div className={styles.gamificationRow}>
              {streak > 0 && (
                <span className={styles.streakBadge}>
                  🔥 {streak}-day study streak
                </span>
              )}
              {masteredChapters > 0 && (
                <span className={styles.masteryBadge}>
                  🏆 {masteredChapters} {masteredChapters === 1 ? 'chapter' : 'chapters'} mastered
                </span>
              )}
            </div>
          )}
          {recommendations.length > 0 && (
            <div className={styles.recBox}>
              <div className={styles.recTitle}>Recommended next for you:</div>
              <ul className={styles.recList}>
                {recommendations.map((rec) => (
                  <li key={rec.url}>
                    <Link to={rec.url} className={styles.recLink}>{rec.title}</Link>
                    <span className={styles.recReason}> — {rec.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function SectionCard({ accentClass, icon, eyebrow, title, description, topics, cta, to, progress }) {
  const hasProgress = progress && progress.completed > 0 && progress.total > 0;
  const isMastered = hasProgress && progress.completed >= progress.total;
  const pct = hasProgress ? Math.round((progress.completed / progress.total) * 100) : 0;
  return (
    <article className={clsx(styles.card, accentClass)}>
      <div className={styles.cardTopRow}>
        {icon && <div className={styles.cardIcon}>{icon}</div>}
        {isMastered && (
          <span className={styles.cardMasteredBadge} title="All lessons in this chapter completed">
            🏆 Mastered
          </span>
        )}
      </div>
      <p className={styles.cardEyebrow}>{eyebrow}</p>
      <h2 className={styles.cardTitle}>
        {to ? <Link className={styles.cardTitleLink} to={to}>{title}</Link> : title}
      </h2>
      {description && <p className={styles.cardDescription}>{description}</p>}
      {topics && (
        <ul className={styles.cardTopics}>
          {topics.map((t) => {
            const label = typeof t === 'string' ? t : t.label;
            return (
              <li key={label} className={styles.cardTopicItem}>
                {typeof t === 'string' ? (
                  <span className={styles.cardTopic}>{label}</span>
                ) : (
                  <Link className={clsx(styles.cardTopic, styles.cardTopicLink)} to={t.to}>{label}</Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {hasProgress && (
        <div className={styles.cardProgress}>
          <div className={styles.cardProgressLabel}>
            <span>{progress.completed} / {progress.total} completed</span>
            <span>{pct}%</span>
          </div>
          <div className={styles.progressTrack} aria-hidden="true">
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      <div className={styles.cardFooter}>
        {to ? (
          <Link className={clsx(styles.cardLink, accentClass)} to={to}>
            {cta} <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <span className={styles.cardComingSoon}>{cta}</span>
        )}
      </div>
    </article>
  );
}

function getChapterLessons(chapterTo, concepts) {
  const base = normalizePermalink(chapterTo);
  if (base === '/concepts/synthesis/choosing-a-technique') {
    return concepts.filter((c) => normalizePermalink(c.url) === base);
  }
  return concepts.filter((c) => normalizePermalink(c.url).startsWith(`${base}/`));
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  const siteData = usePluginData('docusaurus-plugin-site-data');
  const concepts = siteData?.concepts || [];
  const { completed, streak, isCompleted, resetProgress } = useStudyProgress();
  const showAlgorithms = siteConfig.customFields?.showAlgorithms !== false;

  const totalLessons = concepts.length;
  const totalCompleted = concepts.filter((c) => isCompleted(c.url)).length;
  const chapterProgressList = CHAPTERS.map((s) => {
    const lessons = getChapterLessons(s.to, concepts);
    const completedCount = lessons.filter((c) => isCompleted(c.url)).length;
    return { chapter: s, completed: completedCount, total: lessons.length };
  });
  const masteredChapters = chapterProgressList.filter(
    (item) => item.total > 0 && item.completed >= item.total,
  ).length;
  const recommendations = recommendNextLessons(concepts, completed, 3);

  const [badgeModal, setBadgeModal] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!badgeModal) return undefined;
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setBadgeModal(null);
        setVerifyResult(null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [badgeModal]);

  function triggerDownload(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleExportBadge() {
    try {
      const badge = await createProgressBadge({
        completedLessons: [...completed],
        totalLessons,
        masteredChapters,
        streakDays: streak,
      });
      const svg = renderBadgeSvg(badge);
      setVerifyResult(null);
      setBadgeModal({ badge, svg });
    } catch {
      // Ignore Web Crypto errors in unsupported environments
    }
  }

  async function handleVerifyFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const ok = await verifyProgressBadge(parsed);
      setVerifyResult(
        ok
          ? {
              ok: true,
              message: `Valid badge (${parsed.payload.completedCount}/${parsed.payload.totalLessons} lessons, issued ${(parsed.payload.issuedAt || '').slice(0, 10)}) — SHA-256 integrity verified.`,
            }
          : {
              ok: false,
              message: 'Invalid badge — SHA-256 digest does not match (file was modified or malformed).',
            },
      );
    } catch {
      setVerifyResult({ ok: false, message: 'Could not read JSON badge file.' });
    }
  }

  return (
    <Layout title="Home" description={siteConfig.tagline}>
      <main className={styles.main}>
        <Intro
          totalCompleted={totalCompleted}
          totalLessons={totalLessons}
          streak={streak}
          masteredChapters={masteredChapters}
          recommendations={recommendations}
          onResetProgress={resetProgress}
          onExportBadge={handleExportBadge}
        />
        {badgeModal && (
          <div
            className={styles.modalBackdrop}
            role="dialog"
            aria-modal="true"
            aria-label="Study Progress Badge"
            onClick={() => {
              setBadgeModal(null);
              setVerifyResult(null);
            }}>
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Study Progress Badge</h2>
                <button
                  type="button"
                  className={styles.modalClose}
                  aria-label="Close"
                  onClick={() => {
                    setBadgeModal(null);
                    setVerifyResult(null);
                  }}>
                  ×
                </button>
              </div>
              <div className={styles.badgePreview}>
                <img
                  src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(badgeModal.svg)}`}
                  alt="Learn Algorithms Study Progress Badge"
                  className={styles.badgeImg}
                />
              </div>
              <p className={styles.modalHint}>
                Anonymous snapshot generated locally in your browser with a <code>SHA-256</code> integrity hash. Download the visual SVG badge or the verifiable JSON proof.
              </p>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={clsx('button', styles.btnPrimary)}
                  onClick={() =>
                    triggerDownload(
                      badgeModal.svg,
                      'learnalgorithms-progress-badge.svg',
                      'image/svg+xml;charset=utf-8',
                    )
                  }>
                  Download SVG badge
                </button>
                <button
                  type="button"
                  className={clsx('button', styles.btnGhost)}
                  onClick={() =>
                    triggerDownload(
                      JSON.stringify(badgeModal.badge, null, 2),
                      'learnalgorithms-progress-badge.json',
                      'application/json;charset=utf-8',
                    )
                  }>
                  Download JSON proof
                </button>
                <button
                  type="button"
                  className={clsx('button', styles.btnGhost)}
                  onClick={() => fileInputRef.current?.click()}>
                  Verify JSON file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleVerifyFile}
                  style={{ display: 'none' }}
                />
              </div>
              {verifyResult && (
                <div
                  className={clsx(
                    styles.verifyBox,
                    verifyResult.ok ? styles.verifyOk : styles.verifyFail,
                  )}
                  role="status">
                  {verifyResult.ok ? '✅ ' : '❌ '}
                  {verifyResult.message}
                </div>
              )}
            </div>
          </div>
        )}
        <div className={styles.grid}>
          {chapterProgressList.map(({ chapter, completed, total }) => (
            <SectionCard
              key={chapter.title}
              {...chapter}
              progress={{ completed, total }}
            />
          ))}
        </div>
        {showAlgorithms && (
          <section className={styles.part}>
            <h2 className={styles.partTitle}>Algorithm Collection</h2>
            <div className={styles.grid}>
              <SectionCard {...ALGORITHMS_SECTION} />
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}
