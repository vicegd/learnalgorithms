import React from 'react';

/*
 * A small set of line icons (24 x 24, stroke-based) used for the lesson cards
 * and the home page. Every icon inherits its color from `currentColor`.
 */
const PATHS = {
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
      <path d="M8 7h8M8 11h6" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.8.6 1.1 1.4 1.1 2.2h5c0-.8.3-1.6 1.1-2.2A6 6 0 0 0 12 3z" />
    </>
  ),
  puzzle: (
    <>
      <path d="M10 3h4v2.5a1.5 1.5 0 1 0 3 0V3h4v7h-2.5a1.5 1.5 0 1 0 0 3H21v8h-7v-2.5a1.5 1.5 0 1 0-3 0V21H3v-8h2.5a1.5 1.5 0 1 0 0-3H3V3h7z" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3 2 8l10 5 10-5-10-5z" />
      <path d="m2 13 10 5 10-5" />
      <path d="m2 17.5 10 5 10-5" />
    </>
  ),
  stopwatch: (
    <>
      <circle cx="12" cy="14" r="7.5" />
      <path d="M12 14V9.5M10 2.5h4M18.5 6.5l1.5-1.5" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 6-7" />
    </>
  ),
  curve: (
    <>
      <path d="M3 3v18h18" />
      <path d="M6 18c5 0 9-3 13-13" />
      <path d="M6 18c4-1 8-3 13-6" opacity="0.5" />
    </>
  ),
  loop: (
    <>
      <path d="M17 2l3 3-3 3" />
      <path d="M4 11V9a4 4 0 0 1 4-4h12" />
      <path d="M7 22l-3-3 3-3" />
      <path d="M20 13v2a4 4 0 0 1-4 4H4" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.8-4.8" />
    </>
  ),
  bars: (
    <>
      <path d="M5 20V14M10 20V10M15 20V7M20 20V4" />
    </>
  ),
  shuffle: (
    <>
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </>
  ),
  bolt: (
    <>
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </>
  ),
  scale: (
    <>
      <path d="M12 3v18M7 21h10M5 7h14" />
      <path d="m5 7-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z" />
    </>
  ),
  hammer: (
    <>
      <path d="m14 4 6 6-3 3-6-6z" />
      <path d="m11 7-8.5 8.5a2.1 2.1 0 0 0 3 3L14 10" />
    </>
  ),
  split: (
    <>
      <circle cx="12" cy="4.5" r="2" />
      <circle cx="5" cy="19.5" r="2" />
      <circle cx="19" cy="19.5" r="2" />
      <path d="M12 6.5v4M12 10.5 5 17.5M12 10.5l7 7" />
    </>
  ),
  sigma: (
    <>
      <path d="M18 4H6l6 8-6 8h12" />
    </>
  ),
  coin: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </>
  ),
  tree: (
    <>
      <circle cx="12" cy="4" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
      <circle cx="3.5" cy="20" r="1.5" />
      <circle cx="8.5" cy="20" r="1.5" />
      <path d="M10.6 5.4 7.4 10.6M13.4 5.4l3.2 5.2M5.2 13.8l-1 4.7M6.8 13.8l1 4.7" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  cpu: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
      <rect x="9.5" y="9.5" width="5" height="5" />
      <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
    </>
  ),
  fork: (
    <>
      <path d="M6 3v6a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
      <path d="M12 15v6M9 21h6" />
    </>
  ),
  gauge: (
    <>
      <path d="M3.5 17a9 9 0 1 1 17 0" />
      <path d="m12 14 4.5-5" />
      <circle cx="12" cy="14" r="1.2" />
    </>
  ),
  stairs: (
    <>
      <path d="M3 21h5v-5h5v-5h5V6h3" />
      <path d="M3 21V3" opacity="0.4" />
    </>
  ),
  pencil: (
    <>
      <path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
      <path d="m15 5 4 4" />
    </>
  ),
  folder: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  glossary: (
    <>
      <path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z" />
      <path d="M8 9h6M8 13h4" />
      <path d="M18 20h2" />
    </>
  ),
};

export default function Icon({ name, size = 28, className, title }) {
  const content = PATHS[name] ?? PATHS.book;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {content}
    </svg>
  );
}

/*
 * Chooses an icon for a lesson or chapter from its URL. The first rule whose
 * keyword appears in the URL wins, so more specific keywords come first.
 */
const RULES = [
  ['exercises', 'pencil'],
  ['glossary', 'glossary'],
  ['references', 'book'],
  ['proofs', 'stairs'],
  ['algorithmic-thinking', 'bulb'],
  ['case-study-pairwise', 'puzzle'],
  ['data-structures', 'layers'],
  ['measuring-efficiency', 'stopwatch'],
  ['complexity-of-loops', 'loop'],
  ['complexity-analysis', 'chart'],
  ['asymptotic-notation', 'curve'],
  ['growth-rates', 'curve'],
  ['searching', 'search'],
  ['sorting-problem', 'bars'],
  ['bubble-sort', 'bars'],
  ['insertion-sort', 'bars'],
  ['selection-sort', 'bars'],
  ['quicksort', 'bolt'],
  ['efficient-sorting', 'bolt'],
  ['comparing-sorting', 'scale'],
  ['brute-force', 'hammer'],
  ['divide-and-conquer', 'split'],
  ['greedy', 'coin'],
  ['dynamic-programming', 'grid'],
  ['backtracking', 'tree'],
  ['branch-and-bound', 'target'],
  ['fork-join', 'fork'],
  ['parallel-performance', 'gauge'],
  ['parallel', 'cpu'],
  ['sums-and-logarithms', 'sigma'],
  ['induction', 'stairs'],
  // chapters
  ['foundations-of-algorithms', 'bulb'],
  ['fundamental-problem-domains', 'bars'],
  ['algorithm-design-paradigms', 'puzzle'],
  ['state-space-search', 'tree'],
  ['advanced-execution-models', 'cpu'],
  ['mathematical-background', 'sigma'],
];

export function iconForUrl(url = '', fallback = 'book') {
  const lower = url.toLowerCase();
  for (const [keyword, icon] of RULES) {
    if (lower.includes(keyword)) return icon;
  }
  return fallback;
}

/* One accent color per chapter, matching the home page cards. */
const ACCENTS = [
  ['foundations-of-algorithms', '#8b5cf6'],
  ['fundamental-problem-domains', '#3b82f6'],
  ['algorithm-design-paradigms', '#2e8555'],
  ['state-space-search', '#ea580c'],
  ['advanced-execution-models', '#0d9488'],
  ['mathematical-background', '#db2777'],
];

export function accentForUrl(url = '') {
  const lower = url.toLowerCase();
  for (const [keyword, color] of ACCENTS) {
    if (lower.includes(keyword)) return color;
  }
  return 'var(--ifm-color-primary)';
}
