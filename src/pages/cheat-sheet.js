import React, {useMemo, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import styles from './cheat-sheet.module.css';

const JAVA_REPO = 'https://github.com/vicegd/algorithms/tree/master/src/topics';

const ALGORITHMS = [
  // ── Foundations & Brute Force ─────────────────────────────────────────────
  {
    id: 'pairwise-brute',
    name: 'Max Pairwise Product (Brute Force)',
    paradigm: 'Brute Force',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    notes: 'Checks every pair (i, j); baseline for stress testing.',
    lessonUrl: '/concepts/principles-of-algorithmics/case-study-pairwise#step-4-the-brute-force-approach',
    codeUrl: `${JAVA_REPO}/foundation`,
  },
  {
    id: 'pairwise-sort',
    name: 'Max Pairwise Product (Sorting)',
    paradigm: 'Brute Force',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(log n)',
    notes: 'Sorts the array first and multiplies the last two elements.',
    lessonUrl: '/concepts/principles-of-algorithmics/case-study-pairwise#step-5-improving-time-by-sorting',
    codeUrl: `${JAVA_REPO}/foundation`,
  },
  {
    id: 'pairwise-linear',
    name: 'Max Pairwise Product (Optimal)',
    paradigm: 'Brute Force',
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
    notes: 'Single pass tracking the two largest elements.',
    lessonUrl: '/concepts/principles-of-algorithmics/case-study-pairwise#step-7-the-optimal-linear-solution',
    codeUrl: `${JAVA_REPO}/foundation`,
  },
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
    id: 'linear-search-sentinel',
    name: 'Sequential Search (Sentinel)',
    paradigm: 'Searching',
    best: 'O(1)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
    notes: 'Eliminates the bounds check inside the loop.',
    lessonUrl: '/concepts/principles-of-algorithmics/searching-case-studies#sequential-search-with-a-sentinel',
    codeUrl: `${JAVA_REPO}/foundation`,
  },
  {
    id: 'naive-string',
    name: 'Naive String Matching',
    paradigm: 'Brute Force',
    best: 'O(n)',
    average: 'O(n + m)',
    worst: 'O(n · m)',
    space: 'O(1)',
    notes: 'Brute-force pattern search of length m in text of length n.',
    lessonUrl: '/concepts/brute-force/brute-force-and-exhaustive-search#example-naive-string-matching',
    codeUrl: `${JAVA_REPO}/foundation`,
  },
  {
    id: 'exhaustive-subsets',
    name: 'Exhaustive Subset Search',
    paradigm: 'Brute Force',
    best: 'O(2^n · n)',
    average: 'O(2^n · n)',
    worst: 'O(2^n · n)',
    space: 'O(n)',
    notes: 'Generates and tests all 2^n subsets; useful only for small n or as a test oracle.',
    lessonUrl: '/concepts/brute-force/brute-force-and-exhaustive-search#example-exhaustive-search-over-subsets',
    codeUrl: `${JAVA_REPO}/foundation`,
  },

  // ── Sorting ───────────────────────────────────────────────────────────────
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
    id: 'bubble-sentinel',
    name: 'Bubble Sort (Sentinel)',
    paradigm: 'Sorting',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    notes: 'Tracks the last swap index to skip already-sorted suffixes.',
    lessonUrl: '/concepts/sorting/bubble-sort#bubble-sort-with-a-sentinel',
    codeUrl: `${JAVA_REPO}/sorting`,
  },
  {
    id: 'bubble-bidirectional',
    name: 'Bidirectional Bubble Sort',
    paradigm: 'Sorting',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    notes: 'Cocktail shaker sort; mitigates the "turtles" problem.',
    lessonUrl: '/concepts/sorting/bubble-sort#bidirectional-bubble-sort',
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
    notes: 'Stable, in-place, adaptive; very fast on small or nearly sorted inputs.',
    lessonUrl: '/concepts/sorting/insertion-sort',
    codeUrl: `${JAVA_REPO}/sorting`,
  },
  {
    id: 'binary-insertion-sort',
    name: 'Binary Insertion Sort',
    paradigm: 'Sorting',
    best: 'O(n log n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    notes: 'Reduces comparisons to O(n log n), but shifts remain O(n²).',
    lessonUrl: '/concepts/sorting/insertion-sort#binary-insertion',
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
    id: 'counting-sort',
    name: 'Counting Sort / Binsort',
    paradigm: 'Sorting',
    best: 'O(n + k)',
    average: 'O(n + k)',
    worst: 'O(n + k)',
    space: 'O(n + k)',
    notes: 'Non-comparison stable sort for integer keys in range [0, k).',
    lessonUrl: '/concepts/sorting/efficient-sorting#counting-sort-and-binsort',
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

  // ── Divide & Conquer ──────────────────────────────────────────────────────
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
    id: 'vector-sum-dc',
    name: 'Vector Summation (D&C)',
    paradigm: 'Divide & Conquer',
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(log n)',
    notes: 'Splits array in half recursively; O(log n) call stack.',
    lessonUrl: '/concepts/divide-and-conquer/divide-and-conquer-scheme#a-first-example-three-ways-of-summing-a-vector',
    codeUrl: `${JAVA_REPO}/divideconquer`,
  },
  {
    id: 'fib-recursive',
    name: 'Fibonacci (Naive Recursive)',
    paradigm: 'Divide & Conquer',
    best: 'O(2^n)',
    average: 'O(2^n)',
    worst: 'O(2^n)',
    space: 'O(n)',
    notes: 'Actually Θ(φ^n); exponential due to overlapping subproblems.',
    lessonUrl: '/concepts/divide-and-conquer/numbers-and-searches#the-fibonacci-numbers',
    codeUrl: `${JAVA_REPO}/divideconquer`,
  },
  {
    id: 'euclid-gcd',
    name: "Euclid's GCD Algorithm",
    paradigm: 'Divide & Conquer',
    best: 'O(1)',
    average: 'O(log b)',
    worst: 'O(log b)',
    space: 'O(1)',
    notes: 'Computes gcd(a, b) via repeated modulo reduction.',
    lessonUrl: '/concepts/divide-and-conquer/numbers-and-searches#euclids-algorithm',
    codeUrl: `${JAVA_REPO}/divideconquer`,
  },
  {
    id: 'hanoi',
    name: 'Towers of Hanoi',
    paradigm: 'Divide & Conquer',
    best: 'O(2^n)',
    average: 'O(2^n)',
    worst: 'O(2^n)',
    space: 'O(n)',
    notes: 'Minimum 2^n - 1 moves; classic subtraction recurrence T(n) = 2T(n-1) + 1.',
    lessonUrl: '/concepts/divide-and-conquer/classic-problems#the-towers-of-hanoi',
    codeUrl: `${JAVA_REPO}/divideconquer`,
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
    id: 'tennis-tournament',
    name: 'Tennis Tournament Schedule',
    paradigm: 'Divide & Conquer',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(n²)',
    notes: 'Builds a round-robin schedule for n = 2^k players; optimal for output size.',
    lessonUrl: '/concepts/divide-and-conquer/classic-problems#the-tennis-tournament',
    codeUrl: `${JAVA_REPO}/divideconquer`,
  },
  {
    id: 'tromino',
    name: 'Tromino Tiling Puzzle',
    paradigm: 'Divide & Conquer',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(n²)',
    notes: 'Tiles a 2^k × 2^k board (n = 2^k) minus one square in 4 quadrants.',
    lessonUrl: '/concepts/divide-and-conquer/classic-problems#the-tromino-puzzle',
    codeUrl: `${JAVA_REPO}/divideconquer`,
  },
  {
    id: 'majority-element',
    name: 'Majority Element (D&C)',
    paradigm: 'Divide & Conquer',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(log n)',
    notes: 'Finds an element appearing > n/2 times by halving and counting.',
    lessonUrl: '/concepts/divide-and-conquer/majority-mode-and-median#the-majority-element',
    codeUrl: `${JAVA_REPO}/divideconquer`,
  },
  {
    id: 'mode-dc',
    name: 'Mode (Sorting / D&C)',
    paradigm: 'Divide & Conquer',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(log n)',
    notes: 'Improves over O(n²) brute force by sorting or partitioning.',
    lessonUrl: '/concepts/divide-and-conquer/majority-mode-and-median#the-mode',
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

  // ── Greedy ────────────────────────────────────────────────────────────────
  {
    id: 'coin-change-greedy',
    name: 'Coin Change (Greedy)',
    paradigm: 'Greedy',
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(1)',
    notes: 'Optimal only for canonical coin systems (e.g. euros); can fail otherwise.',
    lessonUrl: '/concepts/greedy-algorithms/greedy-method#the-problem-of-the-change',
    codeUrl: `${JAVA_REPO}/greedy`,
  },
  {
    id: 'files-on-disk',
    name: 'Files on a Disk',
    paradigm: 'Greedy',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(1)',
    notes: 'Optimal for maximizing file count (smallest first), not for minimizing free space.',
    lessonUrl: '/concepts/greedy-algorithms/classic-problems#files-on-a-disk',
    codeUrl: `${JAVA_REPO}/greedy`,
  },
  {
    id: 'fractional-knapsack',
    name: 'Fractional Knapsack',
    paradigm: 'Greedy',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(1)',
    notes: 'Optimal when items can be broken; sort by value/weight ratio.',
    lessonUrl: '/concepts/greedy-algorithms/classic-problems#the-knapsack-problem',
    codeUrl: `${JAVA_REPO}/greedy`,
  },
  {
    id: 'diligent-plumber',
    name: 'Diligent Plumber Scheduling',
    paradigm: 'Greedy',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(1)',
    notes: 'Shortest processing time first minimizes total waiting time.',
    lessonUrl: '/concepts/greedy-algorithms/classic-problems#the-diligent-plumber',
    codeUrl: `${JAVA_REPO}/greedy`,
  },
  {
    id: 'knights-tour-warnsdorff',
    name: "Knight's Tour (Warnsdorff)",
    paradigm: 'Greedy',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(n²)',
    notes: 'Heuristic choosing the square with fewest onward moves on an n × n board.',
    lessonUrl: '/concepts/greedy-algorithms/classic-problems#the-knights-tour',
    codeUrl: `${JAVA_REPO}/greedy`,
  },
  {
    id: 'task-assignment-greedy',
    name: 'Task Assignment (Greedy)',
    paradigm: 'Greedy',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(n)',
    notes: 'Fast heuristic, but does not guarantee the global minimum cost.',
    lessonUrl: '/concepts/greedy-algorithms/classic-problems#assigning-tasks-to-agents',
    codeUrl: `${JAVA_REPO}/greedy`,
  },
  {
    id: 'graph-coloring-greedy',
    name: 'Graph Coloring (Greedy)',
    paradigm: 'Greedy',
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V²)',
    space: 'O(V)',
    notes: 'Produces a valid coloring quickly, though not always with minimum colors.',
    lessonUrl: '/concepts/greedy-algorithms/classic-problems#graph-coloring',
    codeUrl: `${JAVA_REPO}/greedy`,
  },
  {
    id: 'prim-kruskal',
    name: 'Prim & Kruskal (MST)',
    paradigm: 'Greedy',
    best: 'O(E log V)',
    average: 'O(E log V)',
    worst: 'O(E log V)',
    space: 'O(V + E)',
    notes: 'Guaranteed optimal Minimum Spanning Tree via priority queue or Union-Find.',
    lessonUrl: '/concepts/greedy-algorithms/classic-problems#minimum-spanning-trees-prim-and-kruskal',
    codeUrl: `${JAVA_REPO}/greedy`,
  },

  // ── Dynamic Programming ───────────────────────────────────────────────────
  {
    id: 'fib-dp',
    name: 'Fibonacci (DP Table)',
    paradigm: 'Dynamic Programming',
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
    space: 'O(n)',
    notes: 'Eliminates redundant calls; space can be reduced to O(1).',
    lessonUrl: '/concepts/dynamic-programming/dynamic-programming-method#fibonacci-with-a-table',
    codeUrl: `${JAVA_REPO}/dynamic`,
  },
  {
    id: 'combinations-dp',
    name: "Binomial Coefficients (Pascal's Triangle)",
    paradigm: 'Dynamic Programming',
    best: 'O(n · k)',
    average: 'O(n · k)',
    worst: 'O(n · k)',
    space: 'O(n · k)',
    notes: 'Avoids exponential recursion by filling Pascal’s triangle bottom-up.',
    lessonUrl: '/concepts/dynamic-programming/classic-problems#combinations',
    codeUrl: `${JAVA_REPO}/dynamic`,
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
    id: 'river-travel-dp',
    name: 'Cheaper Travel on the River',
    paradigm: 'Dynamic Programming',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(n²)',
    notes: 'All-pairs minimum cost along a DAG of river piers.',
    lessonUrl: '/concepts/dynamic-programming/classic-problems#cheaper-travel-on-the-river',
    codeUrl: `${JAVA_REPO}/dynamic`,
  },
  {
    id: 'lcs-dp',
    name: 'Longest Common Subsequence (LCS)',
    paradigm: 'Dynamic Programming',
    best: 'O(n · m)',
    average: 'O(n · m)',
    worst: 'O(n · m)',
    space: 'O(n · m)',
    notes: '2D table over prefixes of two strings of lengths n and m.',
    lessonUrl: '/concepts/dynamic-programming/classic-problems#longest-common-subsequence-lcs',
    codeUrl: `${JAVA_REPO}/dynamic`,
  },
  {
    id: 'edit-distance-dp',
    name: 'Edit Distance (Levenshtein)',
    paradigm: 'Dynamic Programming',
    best: 'O(n · m)',
    average: 'O(n · m)',
    worst: 'O(n · m)',
    space: 'O(n · m)',
    notes: 'Minimum insertions, deletions, and substitutions between two strings.',
    lessonUrl: '/concepts/dynamic-programming/classic-problems#edit-distance',
    codeUrl: `${JAVA_REPO}/dynamic`,
  },

  // ── Backtracking ──────────────────────────────────────────────────────────
  {
    id: 'permutations-bt',
    name: 'Permutations Generation',
    paradigm: 'Backtracking',
    best: 'O(n!)',
    average: 'O(n!)',
    worst: 'O(n!)',
    space: 'O(n)',
    notes: 'Explores all n! orderings using a state vector and visited flags.',
    lessonUrl: '/concepts/backtracking/classic-problems#permutations',
    codeUrl: `${JAVA_REPO}/backtracking`,
  },
  {
    id: 'subset-sum',
    name: 'Subset Sum (Backtracking)',
    paradigm: 'Backtracking',
    best: 'O(n)',
    average: 'O(2^n)',
    worst: 'O(2^n)',
    space: 'O(n)',
    notes: 'Prunes branches when current sum exceeds target or remaining sum is insufficient.',
    lessonUrl: '/concepts/backtracking/classic-problems#subset-sum',
    codeUrl: `${JAVA_REPO}/backtracking`,
  },
  {
    id: 'n-queens',
    name: 'N-Queens (Backtracking)',
    paradigm: 'Backtracking',
    best: 'O(n!)',
    average: 'O(n!)',
    worst: 'O(n!)',
    space: 'O(n)',
    notes: 'Prunes invalid column/diagonal placements in O(1) per step.',
    lessonUrl: '/concepts/backtracking/classic-problems#n-queens',
    codeUrl: `${JAVA_REPO}/backtracking`,
  },
  {
    id: 'knights-tour-bt',
    name: "Knight's Tour (Backtracking)",
    paradigm: 'Backtracking',
    best: 'O(8^(n²))',
    average: 'O(8^(n²))',
    worst: 'O(8^(n²))',
    space: 'O(n²)',
    notes: 'Finds one or all tours; Warnsdorff ordering dramatically speeds up first solution.',
    lessonUrl: '/concepts/backtracking/classic-problems#knights-tour',
    codeUrl: `${JAVA_REPO}/backtracking`,
  },
  {
    id: 'graph-coloring-bt',
    name: 'Graph Coloring (Backtracking)',
    paradigm: 'Backtracking',
    best: 'O(m^V)',
    average: 'O(m^V)',
    worst: 'O(m^V)',
    space: 'O(V)',
    notes: 'Finds exact k-coloring or chromatic number with m available colors.',
    lessonUrl: '/concepts/backtracking/classic-problems#graph-coloring',
    codeUrl: `${JAVA_REPO}/backtracking`,
  },
  {
    id: 'task-assignment-bt',
    name: 'Task Assignment (Backtracking)',
    paradigm: 'Backtracking',
    best: 'O(n!)',
    average: 'O(n!)',
    worst: 'O(n!)',
    space: 'O(n)',
    notes: 'Exact minimum-cost assignment with bound pruning.',
    lessonUrl: '/concepts/backtracking/classic-problems#task-assignment',
    codeUrl: `${JAVA_REPO}/backtracking`,
  },
  {
    id: 'sudoku-bt',
    name: 'Sudoku Solver (Backtracking)',
    paradigm: 'Backtracking',
    best: 'O(9^k)',
    average: 'O(9^k)',
    worst: 'O(9^k)',
    space: 'O(k)',
    notes: 'k empty cells; row/column/box constraints prune almost all invalid branches.',
    lessonUrl: '/concepts/backtracking/classic-problems#sudoku',
    codeUrl: `${JAVA_REPO}/backtracking`,
  },

  // ── Branch and Bound ──────────────────────────────────────────────────────
  {
    id: 'task-assignment-bnb',
    name: 'Task Assignment (B&B)',
    paradigm: 'Branch & Bound',
    best: 'O(n²)',
    average: 'O(2^n)',
    worst: 'O(n!)',
    space: 'O(n!)',
    notes: 'Best-first search using row-minimum lower bounds.',
    lessonUrl: '/concepts/branch-and-bound/classic-problems#task-assignment',
    codeUrl: `${JAVA_REPO}/branchandbound`,
  },
  {
    id: 'knapsack-bnb',
    name: '0/1 Knapsack (B&B)',
    paradigm: 'Branch & Bound',
    best: 'O(n log n)',
    average: 'O(2^n)',
    worst: 'O(2^n)',
    space: 'O(2^n)',
    notes: 'Uses fractional-knapsack upper bound to prune non-promising subtrees.',
    lessonUrl: '/concepts/branch-and-bound/classic-problems#01-knapsack',
    codeUrl: `${JAVA_REPO}/branchandbound`,
  },
  {
    id: 'sliding-puzzles-bnb',
    name: '8/15-Puzzle (B&B / A*)',
    paradigm: 'Branch & Bound',
    best: 'O(d)',
    average: 'O(b^d)',
    worst: 'O(b^d)',
    space: 'O(b^d)',
    notes: 'Uses admissible Manhattan-distance heuristic g + h; checks parity reachability.',
    lessonUrl: '/concepts/branch-and-bound/classic-problems#sliding-puzzles',
    codeUrl: `${JAVA_REPO}/branchandbound`,
  },
  {
    id: 'tsp-bnb',
    name: 'Traveling Salesman (B&B)',
    paradigm: 'Branch & Bound',
    best: 'O(n²)',
    average: 'O(2^n · n)',
    worst: 'O(n!)',
    space: 'O(n!)',
    notes: 'Priority-queue search guided by lower-bound cost estimates.',
    lessonUrl: '/concepts/branch-and-bound/classic-problems#the-traveling-salesman',
    codeUrl: `${JAVA_REPO}/branchandbound`,
  },

  // ── Parallel Algorithms ───────────────────────────────────────────────────
  {
    id: 'parallel-sum',
    name: 'Parallel Array Sum (Fork/Join)',
    paradigm: 'Parallel',
    best: 'O(n / p + log n)',
    average: 'O(n / p + log n)',
    worst: 'O(n / p + log n)',
    space: 'O(log n)',
    notes: 'Work W(n) = O(n), Span D(n) = O(log n) using sequential threshold.',
    lessonUrl: '/concepts/parallel-algorithms/fork-join-framework#example-2-summing-the-elements-of-an-array',
    codeUrl: `${JAVA_REPO}/parallel`,
  },
  {
    id: 'parallel-quicksort',
    name: 'Parallel Quicksort (Fork/Join)',
    paradigm: 'Parallel',
    best: 'O((n log n) / p)',
    average: 'O((n log n) / p)',
    worst: 'O(n²)',
    space: 'O(log n)',
    notes: 'Forks subarray sorting above threshold; span limited by sequential partition.',
    lessonUrl: '/concepts/parallel-algorithms/fork-join-framework#example-5-parallel-quicksort',
    codeUrl: `${JAVA_REPO}/parallel`,
  },
];

const PARADIGMS = [
  'All',
  'Brute Force',
  'Searching',
  'Sorting',
  'Divide & Conquer',
  'Greedy',
  'Dynamic Programming',
  'Backtracking',
  'Branch & Bound',
  'Parallel',
];

function complexityTier(expr) {
  const s = expr.toLowerCase();
  if (s.includes('2^n') || s.includes('n!') || s.includes('^k') || s.includes('^v') || s.includes('8^(')) {
    return styles.tierExp;
  }
  if (s.includes('n²') || s.includes('^2') || s.includes('n · m') || s.includes('n · w') || s.includes('n · a') || s.includes('n · k') || s.includes('^1.')) {
    return styles.tierSlow;
  }
  if (s.includes('log n') && !s.includes('n log n')) return styles.tierFast;
  if (s === 'o(1)' || s.includes('log b') || s.includes('o(d)') || s.includes('n + k') || s.includes('d(n + k)')) {
    return styles.tierFast;
  }
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
