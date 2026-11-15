import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const CHAPTERS = [
  {
    accentClass: styles.accentPurple,
    eyebrow: 'Chapter 1',
    title: 'Foundations of Algorithms',
    description:
      'What an algorithm is, and how to measure and analyze its cost: empirical measurement, counting operations, asymptotic notation, growth rates and loops.',
    topics: ['Algorithmic thinking', 'Data structures', 'Measuring efficiency', 'Complexity analysis', 'Big O', 'Searching'],
    cta: '9 lessons + exercises',
    to: '/concepts/category/1-foundations-of-algorithms',
  },
  {
    accentClass: styles.accentBlue,
    eyebrow: 'Chapter 2',
    title: 'Fundamental Problem Domains',
    description:
      'Sorting, one of the most studied problems in computing: the simple algorithms, Quicksort, the efficient alternatives and how to choose one in practice.',
    topics: ['Bubble', 'Insertion', 'Selection', 'Quicksort', 'Mergesort', 'Heapsort', 'Radix sort'],
    cta: '7 lessons + exercises',
    to: '/concepts/category/2-fundamental-problem-domains',
  },
  {
    accentClass: styles.accentGreen,
    eyebrow: 'Chapter 3',
    title: 'Algorithm Design Paradigms',
    description:
      'General strategies for designing algorithms, each one illustrated with classic problems and measured implementations.',
    topics: ['Brute force', 'Divide and conquer', 'Recurrences', 'Greedy', 'Dynamic programming'],
    cta: '10 lessons + exercises',
    to: '/concepts/category/3-algorithm-design-paradigms',
  },
  {
    accentClass: styles.accentOrange,
    eyebrow: 'Chapter 4',
    title: 'State Space Search and Optimization',
    description:
      'Exact search over huge spaces of candidate solutions: exploring implicit trees of states, pruning hopeless branches and using bounds and heuristics.',
    topics: ['Backtracking', 'Pruning', 'N-queens', 'Branch and bound', 'A*'],
    cta: '4 lessons + exercises',
    to: '/concepts/category/4-state-space-search-and-optimization',
  },
  {
    accentClass: styles.accentTeal,
    eyebrow: 'Chapter 5',
    title: 'Advanced Execution Models',
    description:
      'Using several processors at once: concurrency and parallelism, the Java Fork/Join framework, and how to measure and predict parallel performance.',
    topics: ['Threads', 'Fork/Join', 'Thresholds', 'Speedup', "Amdahl's law"],
    cta: '3 lessons + exercises',
    to: '/concepts/category/5-advanced-execution-models',
  },
  {
    accentClass: styles.accentPurple,
    eyebrow: 'Chapter 6',
    title: 'Mathematical Background',
    description:
      'The mathematics behind the analysis of algorithms, explained rather than just stated: sums, logarithms, factorials, induction, loop invariants and recurrences.',
    topics: ['Sums', 'Logarithms', 'Stirling', 'Induction', 'Invariants', 'Recurrences'],
    cta: '2 lessons + exercises',
    to: '/concepts/category/6-mathematical-background',
  },
];

const ALGORITHMS_SECTION = {
  accentClass: styles.accentGreen,
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
  const sections = showAlgorithms ? [...CHAPTERS, ALGORITHMS_SECTION] : CHAPTERS;
  return (
    <Layout title="Home" description={siteConfig.tagline}>
      <main className={styles.main}>
        <Intro />
        <div className={styles.grid}>
          {sections.map((s) => (
            <SectionCard key={s.title} {...s} />
          ))}
        </div>
      </main>
    </Layout>
  );
}
