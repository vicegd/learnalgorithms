import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';
import Icon from '@site/src/components/Icon';

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
    ],
    cta: '9 lessons',
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
    ],
    cta: '7 lessons',
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
    ],
    cta: '1 lesson',
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
    ],
    cta: '5 lessons',
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
    ],
    cta: '2 lessons',
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
    ],
    cta: '2 lessons',
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
    ],
    cta: '2 lessons',
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
    ],
    cta: '2 lessons',
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
    ],
    cta: '3 lessons',
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
    ],
    cta: '2 lessons',
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

function Intro() {
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
        <Link className={clsx('button button--lg', styles.btnGhost)} to="/concepts/glossary">
          Glossary
        </Link>
      </div>
    </header>
  );
}

function SectionCard({ accentClass, icon, eyebrow, title, description, topics, cta, to }) {
  return (
    <article className={clsx(styles.card, accentClass)}>
      {icon && <div className={styles.cardIcon}>{icon}</div>}
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

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  const showAlgorithms = siteConfig.customFields?.showAlgorithms !== false;
  return (
    <Layout title="Home" description={siteConfig.tagline}>
      <main className={styles.main}>
        <Intro />
        <div className={styles.grid}>
          {CHAPTERS.map((s) => (
            <SectionCard key={s.title} {...s} />
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
