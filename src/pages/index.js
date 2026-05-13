import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

const PSEUDOCODE = `function coinChange(coins, S):
  dp = [∞] * (S + 1)
  dp[0] = 0

  for i in 1 .. S:
    for c in coins:
      if c ≤ i:
        dp[i] = min(dp[i],
                    dp[i - c] + 1)

  return dp[S] ≠ ∞ ? dp[S] : -1`;

function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <p className={styles.heroEyebrow}>Learn Algorithms</p>
        <h1 className={styles.heroTitle}>
          From intuition<br />
          <span className={styles.heroAccent}>to proof.</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Structured algorithm sheets, theoretical foundations, and interactive
          visualizations — everything you need to truly understand classic algorithms.
        </p>
        <div className={styles.heroButtons}>
          <Link className={clsx('button button--lg', styles.btnPrimary)} to="/algorithms/">
            Browse Algorithms →
          </Link>
          <Link className={clsx('button button--lg', styles.btnGhost)} to="/blog">
            Read the Blog
          </Link>
        </div>
      </div>
      <div className={styles.heroVisual} aria-hidden="true">
        <div className={styles.codeCard}>
          <div className={styles.codeCardDots}>
            <span /><span /><span />
          </div>
          <pre className={styles.codeCardPre}>{PSEUDOCODE}</pre>
        </div>
      </div>
    </section>
  );
}

const SECTIONS = [
  {
    accentClass: styles.accentPurple,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
      </svg>
    ),
    eyebrow: 'Theoretical Background',
    title: 'Concepts',
    description:
      'The theoretical groundwork that makes algorithms truly make sense. Each topic is a self-contained chapter — read it in order as a structured course, or jump to any entry as a quick reference.',
    topics: ['Complexity Analysis', 'Recursion', 'Divide & Conquer', 'Dynamic Programming', 'Greedy', '...'],
    cta: 'Browse Concepts',
    to: '/concepts/',
  },
  {
    accentClass: styles.accentGreen,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="28" height="28">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    eyebrow: 'Algorithm Collection',
    title: 'Algorithm Sheets',
    description:
      'Rigorous, interactive breakdowns of each algorithm: from the naive approach and why it fails, through the full derivation, to annotated multi-language code and step-by-step table visualizations.',
    topics: ['Problem Statement', 'Complexity Analysis', 'Pseudocode', 'Interactive Trace', '...'],
    cta: 'Browse Algorithms',
    to: '/algorithms/',
  },
];

function SectionCard({ accentClass, icon, eyebrow, title, description, topics, cta, to }) {
  return (
    <article className={clsx(styles.card, accentClass)}>
      <div className={styles.cardIcon}>{icon}</div>
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
  return (
    <Layout title="Home" description={siteConfig.tagline}>
      <main className={styles.main}>
        <div className={styles.grid}>
          {SECTIONS.map((s) => (
            <SectionCard key={s.title} {...s} />
          ))}
        </div>
      </main>
    </Layout>
  );
}
