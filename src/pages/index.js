import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';
import Icon from '@site/src/components/Icon';

const card = (accentClass, icon, eyebrow, title, description, topics, cta, to) => ({
  accentClass, icon: <Icon name={icon} size={30} />, eyebrow, title, description, topics, cta, to,
});

const PARTS = [
  {
    title: 'Part I. Foundations',
    chapters: [
      card(styles.accentPurple, 'bulb', 'Chapter 1', 'Principles of Algorithmics',
        'What an algorithm is, and how to measure and analyze its cost: empirical measurement, counting operations, asymptotic notation, growth rates and loops.',
        ['Algorithmic thinking', 'Data structures', 'Measuring efficiency', 'Complexity analysis', 'Big O', 'Searching'],
        '9 lessons + exercises', '/concepts/principles-of-algorithmics'),
    ],
  },
  {
    title: 'Part II. Problem Domains',
    chapters: [
      card(styles.accentBlue, 'bars', 'Chapter 2', 'Sorting',
        'One of the most studied problems in computing: the simple algorithms, Quicksort, the efficient alternatives and how to choose one in practice.',
        ['Bubble', 'Insertion', 'Selection', 'Quicksort', 'Mergesort', 'Heapsort', 'Radix sort'],
        '7 lessons + exercises', '/concepts/sorting'),
    ],
  },
  {
    title: 'Part III. Design Techniques',
    chapters: [
      card(styles.accentGreen, 'hammer', 'Chapter 3', 'Brute Force',
        'Solving a problem in the most direct way, or by trying every candidate: its cost, when it is enough, and why it is the reference for every other technique.',
        ['Exhaustive search', 'String matching', 'Subsets', 'Testing oracle'],
        '1 lesson + exercises', '/concepts/brute-force'),
      card(styles.accentGreen, 'split', 'Chapter 4', 'Divide and Conquer',
        'Splitting a problem into smaller independent subproblems, analyzing the resulting recurrences, and many classic problems.',
        ['Recurrences', 'Binary search', 'Mergesort', 'Karatsuba', 'Quickselect', 'Median'],
        '5 lessons + exercises', '/concepts/divide-and-conquer'),
      card(styles.accentGreen, 'coin', 'Chapter 5', 'Greedy Algorithms',
        'One irrevocable choice per step: how to design the criterion, and how to prove that it is optimal or refute it with a counterexample.',
        ['Change', 'Knapsack', 'Scheduling', 'Prim', 'Kruskal'],
        '2 lessons + exercises', '/concepts/greedy-algorithms'),
      card(styles.accentGreen, 'grid', 'Chapter 6', 'Dynamic Programming',
        'Solving each subproblem only once and storing the result: the principle of optimality, recurrences and tables.',
        ['Binomials', 'Knapsack', 'Change', 'River', 'LCS', 'Edit distance'],
        '2 lessons + exercises', '/concepts/dynamic-programming'),
      card(styles.accentOrange, 'tree', 'Chapter 7', 'Backtracking',
        'Systematic search over a tree of states, abandoning partial solutions as soon as they cannot succeed.',
        ['Pruning', 'N-queens', 'Subset sum', 'Coloring', 'Sudoku'],
        '2 lessons + exercises', '/concepts/backtracking'),
      card(styles.accentOrange, 'target', 'Chapter 8', 'Branch and Bound',
        'Exploring the most promising states first, and discarding those that cannot beat the best solution found.',
        ['Bounds', 'Heuristics', 'A*', 'Assignment', 'Puzzles', 'TSP'],
        '2 lessons + exercises', '/concepts/branch-and-bound'),
    ],
  },
  {
    title: 'Part IV. Execution Models',
    chapters: [
      card(styles.accentTeal, 'cpu', 'Chapter 9', 'Parallel Algorithms',
        'Using several processors at once: concurrency and parallelism, the Java Fork/Join framework, and how to measure and predict parallel performance.',
        ['Threads', 'Fork/Join', 'Thresholds', 'Speedup', "Amdahl's law"],
        '3 lessons + exercises', '/concepts/parallel-algorithms'),
    ],
  },
  {
    title: 'Appendices',
    chapters: [
      card(styles.accentRose, 'sigma', 'Appendix A', 'Mathematical Background',
        'The mathematics behind the analysis of algorithms, explained rather than just stated: sums, logarithms, factorials, induction, loop invariants and recurrences.',
        ['Sums', 'Logarithms', 'Stirling', 'Induction', 'Invariants', 'Recurrences'],
        '2 lessons + exercises', '/concepts/mathematical-background'),
    ],
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
      <h2 className={styles.cardTitle}>{title}</h2>
      <p className={styles.cardDescription}>{description}</p>
      {topics && (
        <ul className={styles.cardTopics}>
          {topics.map((t) => (
            <li key={t} className={styles.cardTopic}>{t}</li>
          ))}
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
        {PARTS.map((p) => (
          <section key={p.title} className={styles.part}>
            <h2 className={styles.partTitle}>{p.title}</h2>
            <div className={styles.grid}>
              {p.chapters.map((s) => (
                <SectionCard key={s.title} {...s} />
              ))}
            </div>
          </section>
        ))}
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
