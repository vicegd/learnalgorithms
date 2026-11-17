import React, {useMemo, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './cheat-sheet.module.css';

const JAVA_REPO = 'https://github.com/vicegd/algorithms/tree/master/src/topics';

const ALGORITHMS = [
  {
    id: 'linear-search',
    name: 'Sequential Search',
    paradigm: 'Searching',
    best: 'O(1)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
    notes: 'Works on unsorted arrays.',
    lessonUrl: '/concepts/principles-of-algorithmics/searching-case-studies',
    codeUrl: `${JAVA_REPO}/foundation`,
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    paradigm: 'Divide & Conquer',
    best: 'O(1)',
    average: 'O(log n)',
    worst: 'O(log n)',
    space: 'O(1)',
    notes: 'Requires a sorted array; iterative uses O(1) space.',
    lessonUrl: '/concepts/divide-and-conquer/numbers-and-searches#sequential-and-binary-search',
    codeUrl: `${JAVA_REPO}/divideconquer`,
  },
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    paradigm: 'Sorting',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    notes: 'Stable, in-place; O(n) best case with early-exit flag.',
    lessonUrl: '/concepts/sorting/bubble-sort',
    codeUrl: `${JAVA_REPO}/sorting`,
  },
  {
    id: 'insertion-sort',
    name: 'Insertion Sort',
    paradigm: 'Sorting',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    notes: 'Stable, in-place; very fast on small or nearly sorted inputs.',
    lessonUrl: '/concepts/sorting/insertion-sort',
    codeUrl: `${JAVA_REPO}/sorting`,
  },
  {
    id: 'selection-sort',
    name: 'Selection Sort',
    paradigm: 'Sorting',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    notes: 'In-place, not stable; performs at most n - 1 swaps.',
    lessonUrl: '/concepts/sorting/selection-sort',
    codeUrl: `${JAVA_REPO}/sorting`,
  },
  {
    id: 'shellsort',
    name: 'Shellsort',
    paradigm: 'Sorting',
    best: 'O(n log n)',
    average: 'O(n^1.3–n^1.5)',
    worst: 'O(n²)',
    space: 'O(1)',
    notes: 'In-place, not stable; complexity depends on gap sequence.',
    lessonUrl: '/concepts/sorting/efficient-sorting#shellsort-insertion-over-long-distances',
    codeUrl: `${JAVA_REPO}/sorting`,
  },
  {
    id: 'quicksort',
    name: 'Quicksort',
    paradigm: 'Sorting',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
    space: 'O(log n)',
    notes: 'In-place, not stable; median-of-three reduces worst-case risk.',
    lessonUrl: '/concepts/sorting/quicksort',
    codeUrl: `${JAVA_REPO}/sorting`,
  },
  {
    id: 'heapsort',
    name: 'Heapsort',
    paradigm: 'Sorting',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(1)',
    notes: 'In-place, not stable; guaranteed O(n log n) worst case.',
    lessonUrl: '/concepts/sorting/efficient-sorting#heapsort-selection-with-a-heap',
    codeUrl: `${JAVA_REPO}/sorting`,
  },
  {
    id: 'mergesort',
    name: 'Mergesort',
    paradigm: 'Sorting',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(n)',
    notes: 'Stable; classic Divide & Conquer with guaranteed O(n log n).',
    lessonUrl: '/concepts/sorting/efficient-sorting#mergesort-sorting-by-merging',
    codeUrl: `${JAVA_REPO}/sorting`,
  },
  {
    id: 'radix-sort',
    name: 'Radix Sort (LSD)',
    paradigm: 'Sorting',
    best: 'O(d(n + k))',
    average: 'O(d(n + k))',
    worst: 'O(d(n + k))',
    space: 'O(n + k)',
    notes: 'Non-comparison sort; linear when digit count d and base k are small.',
    lessonUrl: '/concepts/sorting/efficient-sorting#sorting-without-comparisons',
    codeUrl: `${JAVA_REPO}/sorting`,
  },
  {
    id: 'karatsuba',
    name: 'Karatsuba Multiplication',
    paradigm: 'Divide & Conquer',
    best: 'O(n^1.585)',
    average: 'O(n^1.585)',
    worst: 'O(n^1.585)',
    space: 'O(n)',
    notes: 'Multiplies n-digit integers with 3 recursive calls instead of 4.',
    lessonUrl: '/concepts/divide-and-conquer/classic-problems#multiplication-of-large-integers',
    codeUrl: `${JAVA_REPO}/divideconquer`,
  },
  {
    id: 'quickselect',
    name: 'Quickselect / Median',
    paradigm: 'Divide & Conquer',
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n²)',
    space: 'O(log n)',
    notes: 'Finds the k-th smallest element without sorting the whole array.',
    lessonUrl: '/concepts/divide-and-conquer/majority-mode-and-median#the-median',
    codeUrl: `${JAVA_REPO}/divideconquer`,
  },
  {
    id: 'naive-string',
    name: 'Naive String Matching',
    paradigm: 'Searching',
    best: 'O(n)',
    average: 'O(n + m)',
    worst: 'O(n · m)',
    space: 'O(1)',
    notes: 'Brute-force pattern search of length m in text of length n.',
    lessonUrl: '/concepts/brute-force/brute-force-and-exhaustive-search#example-naive-string-matching',
    codeUrl: `${JAVA_REPO}/foundation`,
  },
  {
    id: 'prim-kruskal',
    name: 'Prim & Kruskal (MST)',
    paradigm: 'Greedy',
    best: 'O(E log V)',
    average: 'O(E log V)',
    worst: 'O(E log V)',
    space: 'O(V + E)',
    notes: 'Minimum spanning tree using priority queue or Union-Find.',
    lessonUrl: '/concepts/greedy-algorithms/classic-problems#minimum-spanning-trees-prim-and-kruskal',
    codeUrl: `${JAVA_REPO}/greedy`,
  },
  {
    id: 'knapsack-dp',
    name: '0/1 Knapsack (DP)',
    paradigm: 'Dynamic Programming',
    best: 'O(n · W)',
    average: 'O(n · W)',
    worst: 'O(n · W)',
    space: 'O(n · W)',
    notes: 'Pseudo-polynomial optimal solution; space can be reduced to O(W).',
    lessonUrl: '/concepts/dynamic-programming/classic-problems#the-01-knapsack-problem',
    codeUrl: `${JAVA_REPO}/dynamic`,
  },
  {
    id: 'coin-change-dp',
    name: 'Coin Change (DP)',
    paradigm: 'Dynamic Programming',
    best: 'O(n · A)',
    average: 'O(n · A)',
    worst: 'O(n · A)',
    space: 'O(A)',
    notes: 'Optimal for arbitrary coin systems where Greedy can fail.',
    lessonUrl: '/concepts/dynamic-programming/classic-problems#the-problem-of-the-change',
    codeUrl: `${JAVA_REPO}/dynamic`,
  },
  {
    id: 'lcs-edit-distance',
    name: 'LCS & Edit Distance',
    paradigm: 'Dynamic Programming',
    best: 'O(n · m)',
    average: 'O(n · m)',
    worst: 'O(n · m)',
    space: 'O(n · m)',
    notes: '2D table over prefixes of two strings of lengths n and m.',
    lessonUrl: '/concepts/dynamic-programming/classic-problems#beyond-the-course-dynamic-programming-on-strings',
    codeUrl: `${JAVA_REPO}/dynamic`,
  },
  {
    id: 'n-queens',
    name: 'N-Queens',
    paradigm: 'Backtracking & B&B',
    best: 'O(n!)',
    average: 'O(n!)',
    worst: 'O(n!)',
    space: 'O(n)',
    notes: 'Prunes invalid row/diagonal placements early during search.',
    lessonUrl: '/concepts/backtracking/classic-problems#n-queens',
    codeUrl: `${JAVA_REPO}/backtracking`,
  },
  {
    id: 'subset-sum',
    name: 'Subset Sum',
    paradigm: 'Backtracking & B&B',
    best: 'O(n)',
    average: 'O(2^n)',
    worst: 'O(2^n)',
    space: 'O(n)',
    notes: 'Exponential worst case; pruning remaining sum improves practical speed.',
    lessonUrl: '/concepts/backtracking/classic-problems#subset-sum',
    codeUrl: `${JAVA_REPO}/backtracking`,
  },
  {
    id: 'tsp-bnb',
    name: 'Traveling Salesman (B&B)',
    paradigm: 'Backtracking & B&B',
    best: 'O(n²)',
    average: 'O(2^n · n)',
    worst: 'O(n!)',
    space: 'O(n!)',
    notes: 'Priority-queue search guided by lower-bound cost estimates.',
    lessonUrl: '/concepts/branch-and-bound/classic-problems#the-traveling-salesman',
    codeUrl: `${JAVA_REPO}/branchandbound`,
  },
];

const PARADIGMS = [
  'All',
  'Sorting',
  'Searching',
  'Divide & Conquer',
  'Greedy',
  'Dynamic Programming',
  'Backtracking & B&B',
];

function complexityTier(expr) {
  const s = expr.toLowerCase();
  if (s.includes('2^n') || s.includes('n!')) return styles.tierExp;
  if (s.includes('n²') || s.includes('^2') || s.includes('n · m') || s.includes('n · w') || s.includes('n · a') || s.includes('^1.')) {
    return styles.tierSlow;
  }
  if (s.includes('log n') && !s.includes('n log n')) return styles.tierFast;
  if (s === 'o(1)' || s.includes('d(n + k)')) return styles.tierFast;
  return styles.tierMedium;
}

export default function CheatSheetPage() {
  const [query, setQuery] = useState('');
  const [paradigm, setParadigm] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALGORITHMS.filter((alg) => {
      if (paradigm !== 'All' && alg.paradigm !== paradigm) return false;
      if (!q) return true;
      return (
        alg.name.toLowerCase().includes(q) ||
        alg.paradigm.toLowerCase().includes(q) ||
        alg.notes.toLowerCase().includes(q)
      );
    });
  }, [query, paradigm]);

  const selectedAlgorithms = useMemo(
    () => ALGORITHMS.filter((alg) => selectedIds.includes(alg.id)),
    [selectedIds],
  );

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  return (
    <Layout
      title="Big-O Cheat Sheet"
      description="Interactive complexity comparison table for the algorithms covered in the course">
      <main className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Quick Reference</p>
          <h1 className={styles.title}>Big-O Complexity Cheat Sheet</h1>
          <p className={styles.subtitle}>
            Filter by paradigm, search by algorithm or property, and select up to 3 algorithms to
            compare their time and space complexities side by side.
          </p>
        </header>

        <section className={styles.controls} aria-label="Filters">
          <div className={styles.searchRow}>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search algorithms, e.g. Quicksort, stable, DP..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search algorithms"
            />
            <span className={styles.resultCount}>
              Showing <strong>{filtered.length}</strong> of {ALGORITHMS.length} algorithms
            </span>
          </div>

          <div className={styles.filters} role="group" aria-label="Filter by paradigm">
            {PARADIGMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setParadigm(p)}
                className={clsx(styles.filterBtn, paradigm === p && styles.filterBtnActive)}
                aria-pressed={paradigm === p}>
                {p}
              </button>
            ))}
          </div>
        </section>

        {selectedAlgorithms.length > 0 && (
          <section className={styles.comparePanel} aria-label="Side-by-side comparison">
            <div className={styles.compareHeader}>
              <h2 className={styles.compareTitle}>
                Comparing {selectedAlgorithms.length} {selectedAlgorithms.length === 1 ? 'algorithm' : 'algorithms'} (max 3)
              </h2>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className={styles.clearCompareBtn}>
                Clear selection
              </button>
            </div>
            <div className={styles.compareGrid}>
              {selectedAlgorithms.map((alg) => (
                <article key={alg.id} className={styles.compareCard}>
                  <div className={styles.compareCardHeader}>
                    <h3 className={styles.compareCardTitle}>{alg.name}</h3>
                    <button
                      type="button"
                      onClick={() => toggleSelect(alg.id)}
                      className={styles.removeBtn}
                      aria-label={`Remove ${alg.name} from comparison`}>
                      ×
                    </button>
                  </div>
                  <dl className={styles.compareMeta}>
                    <dt>Paradigm</dt>
                    <dd>{alg.paradigm}</dd>
                    <dt>Best</dt>
                    <dd><span className={clsx(styles.badge, complexityTier(alg.best))}>{alg.best}</span></dd>
                    <dt>Average</dt>
                    <dd><span className={clsx(styles.badge, complexityTier(alg.average))}>{alg.average}</span></dd>
                    <dt>Worst</dt>
                    <dd><span className={clsx(styles.badge, complexityTier(alg.worst))}>{alg.worst}</span></dd>
                    <dt>Space</dt>
                    <dd><span className={clsx(styles.badge, complexityTier(alg.space))}>{alg.space}</span></dd>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Compare</th>
                <th>Algorithm</th>
                <th>Paradigm</th>
                <th>Best</th>
                <th>Average</th>
                <th>Worst</th>
                <th>Space</th>
                <th>Resources</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>
                    No algorithms match your current search or filter.
                  </td>
                </tr>
              ) : (
                filtered.map((alg) => {
                  const isSelected = selectedIds.includes(alg.id);
                  return (
                    <tr key={alg.id} className={isSelected ? styles.rowSelected : undefined}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(alg.id)}
                          aria-label={`Compare ${alg.name}`}
                        />
                      </td>
                      <td>
                        <span className={styles.algName}>{alg.name}</span>
                        <span className={styles.algNotes}>{alg.notes}</span>
                      </td>
                      <td>
                        <span className={styles.paradigmTag}>{alg.paradigm}</span>
                      </td>
                      <td>
                        <span className={clsx(styles.badge, complexityTier(alg.best))}>{alg.best}</span>
                      </td>
                      <td>
                        <span className={clsx(styles.badge, complexityTier(alg.average))}>{alg.average}</span>
                      </td>
                      <td>
                        <span className={clsx(styles.badge, complexityTier(alg.worst))}>{alg.worst}</span>
                      </td>
                      <td>
                        <span className={clsx(styles.badge, complexityTier(alg.space))}>{alg.space}</span>
                      </td>
                      <td>
                        <div className={styles.linksCell}>
                          <Link to={alg.lessonUrl}>Lesson →</Link>
                          <a href={alg.codeUrl} target="_blank" rel="noopener noreferrer">
                            Java code ↗
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </Layout>
  );
}
