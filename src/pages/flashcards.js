import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {ALGORITHMS} from './cheat-sheet';
import styles from './flashcards.module.css';

const STORAGE_KEY = 'la.flashcards.mastered:v1';

const THEORY_CARDS = [
  {
    id: 'theory-asymptotic',
    paradigm: 'Core Theory',
    front: 'What is the difference between O(g(n)), Ω(g(n)), and Θ(g(n))?',
    answer:
      'O(g(n)) is an asymptotic upper bound (at most), Ω(g(n)) is an asymptotic lower bound (at least), and Θ(g(n)) is a tight bound meaning f(n) ∈ O(g(n)) AND f(n) ∈ Ω(g(n)).',
    lessonUrl: '/concepts/principles-of-algorithmics/asymptotic-notation',
  },
  {
    id: 'theory-master-theorem',
    paradigm: 'Core Theory',
    front: 'For T(n) = a·T(n/b) + Θ(n^d), what are the 3 cases of the Master Theorem?',
    answer:
      'Compare d with log_b(a): (1) if d < log_b(a) → Θ(n^(log_b a)); (2) if d = log_b(a) → Θ(n^d log n); (3) if d > log_b(a) → Θ(n^d).',
    lessonUrl: '/concepts/divide-and-conquer/analysis',
  },
  {
    id: 'theory-comparison-sort-lb',
    paradigm: 'Core Theory',
    front: 'Why is Ω(n log n) the lower bound for comparison-based sorting?',
    answer:
      'Any comparison sort corresponds to a binary decision tree with at least n! leaves (one per permutation). Its minimum height is ⌈log₂(n!)⌉ = Ω(n log n) by Stirling’s approximation.',
    lessonUrl: '/concepts/sorting/efficient-sorting',
  },
  {
    id: 'theory-greedy-properties',
    paradigm: 'Core Theory',
    front: 'What two properties guarantee that a Greedy algorithm finds the global optimum?',
    answer:
      '1) Greedy-choice property: a locally optimal choice can always be extended to a globally optimal solution. 2) Optimal substructure: an optimal solution contains optimal solutions to its subproblems.',
    lessonUrl: '/concepts/greedy-algorithms/greedy-method',
  },
  {
    id: 'theory-dp-vs-dc',
    paradigm: 'Core Theory',
    front: 'When should you use Dynamic Programming instead of Divide & Conquer?',
    answer:
      'When subproblems overlap (the same subproblems are solved repeatedly) and the problem has optimal substructure. Divide & Conquer assumes independent subproblems.',
    lessonUrl: '/concepts/dynamic-programming/dynamic-programming-method',
  },
  {
    id: 'theory-memo-vs-tab',
    paradigm: 'Core Theory',
    front: 'Memoization (top-down) vs. Tabulation (bottom-up) in Dynamic Programming?',
    answer:
      'Memoization uses recursion + cache and only computes reachable subproblems. Tabulation fills a table iteratively in topological order, avoiding recursion stack overhead and enabling space optimization.',
    lessonUrl: '/concepts/dynamic-programming/dynamic-programming-method',
  },
  {
    id: 'theory-knapsack-01-vs-frac',
    paradigm: 'Core Theory',
    front: 'Why does Greedy solve Fractional Knapsack optimally but fails on 0/1 Knapsack?',
    answer:
      'In Fractional Knapsack you can take any fraction of the highest value/weight item without wasting capacity. In 0/1 Knapsack indivisible items can leave unused capacity where a different combination yields higher total value.',
    lessonUrl: '/concepts/greedy-algorithms/classic-problems',
  },
  {
    id: 'theory-backtracking-pruning',
    paradigm: 'Core Theory',
    front: 'What makes Backtracking faster than naive Exhaustive Search?',
    answer:
      'Feasibility pruning: partial candidate solutions are checked as soon as a choice is made; whenever a constraint is violated, the entire subtree rooted at that partial state is pruned immediately.',
    lessonUrl: '/concepts/backtracking/backtracking-scheme',
  },
  {
    id: 'theory-bt-vs-bb',
    paradigm: 'Core Theory',
    front: 'How does Branch & Bound differ from Backtracking?',
    answer:
      'Backtracking uses DFS and prunes infeasible branches. Branch & Bound solves optimization problems using Best-First Search (priority queue) and prunes subtrees whose optimistic bound cannot beat the best incumbent solution.',
    lessonUrl: '/concepts/branch-and-bound/branch-and-bound-scheme',
  },
  {
    id: 'theory-admissible-heuristic',
    paradigm: 'Core Theory',
    front: 'What is an admissible heuristic in A* / Branch & Bound?',
    answer:
      'A bound function h(n) that never overestimates the true remaining cost (for minimization) — or never underestimates it (for maximization). Admissibility guarantees optimality of the first goal node expanded.',
    lessonUrl: '/concepts/branch-and-bound/branch-and-bound-scheme',
  },
  {
    id: 'theory-amdahl',
    paradigm: 'Core Theory',
    front: 'What does Amdahl’s Law state about parallel speedup?',
    answer:
      'If a fraction s of a program is strictly sequential, the maximum speedup on p processors is S(p) = 1 / (s + (1 − s)/p) ≤ 1/s. Even with infinite cores, the sequential portion caps total speedup.',
    lessonUrl: '/concepts/parallel-algorithms/parallel-performance',
  },
  {
    id: 'theory-p-np',
    paradigm: 'Core Theory',
    front: 'What distinguishes P, NP, NP-Hard, and NP-Complete?',
    answer:
      'P: solvable in polynomial time. NP: verifiable in polynomial time. NP-Hard: at least as hard as every problem in NP (via polynomial reduction). NP-Complete: in both NP and NP-Hard.',
    lessonUrl: '/concepts/synthesis/choosing-a-technique',
  },
];

function renderMathText(text, keyPrefix = 'm') {
  if (!text) return null;
  const parts = [];
  // Matches: ^(group), ^token, _(group), _token
  const re = /(\^\([^)]+\)|\^[A-Za-z0-9]+|_\([^)]+\)|_[A-Za-z0-9]+)/g;
  let last = 0;
  let m;
  let idx = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyPrefix}-${idx++}`;
    if (tok.startsWith('^(')) {
      parts.push(<sup key={key}>{renderMathText(tok.slice(2, -1), `${key}-s`)}</sup>);
    } else if (tok.startsWith('^')) {
      parts.push(<sup key={key}>{tok.slice(1)}</sup>);
    } else if (tok.startsWith('_(')) {
      parts.push(<sub key={key}>{renderMathText(tok.slice(2, -1), `${key}-b`)}</sub>);
    } else if (tok.startsWith('_')) {
      parts.push(<sub key={key}>{tok.slice(1)}</sub>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function buildDeck() {
  const algoCards = ALGORITHMS.map((alg) => ({
    id: `alg-${alg.id}`,
    paradigm: alg.paradigm,
    front: `What are the time & space complexities and key properties of ${alg.name}?`,
    complexities: {
      best: alg.best,
      average: alg.average,
      worst: alg.worst,
      space: alg.space,
    },
    props: alg.props || [],
    notes: alg.notes || '',
    lessonUrl: alg.lessonUrl,
  }));
  return [...THEORY_CARDS, ...algoCards];
}

function loadMastered() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export default function FlashcardsPage() {
  const allCards = useMemo(() => buildDeck(), []);
  const paradigms = useMemo(() => {
    const set = new Set(allCards.map((c) => c.paradigm));
    return ['All', ...set];
  }, [allCards]);

  const [selectedParadigm, setSelectedParadigm] = useState('All');
  const [reviewOnly, setReviewOnly] = useState(false);
  const [mastered, setMastered] = useState(() => new Set());
  const [order, setOrder] = useState(() => allCards.map((c) => c.id));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setMastered(loadMastered());
  }, []);

  const persistMastered = useCallback((nextSet) => {
    setMastered(nextSet);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...nextSet]));
    } catch {
      // ignore storage errors
    }
  }, []);

  const cardById = useMemo(() => {
    const map = new Map();
    for (const c of allCards) map.set(c.id, c);
    return map;
  }, [allCards]);

  const visibleCards = useMemo(() => {
    return order
      .map((id) => cardById.get(id))
      .filter(Boolean)
      .filter((c) => selectedParadigm === 'All' || c.paradigm === selectedParadigm)
      .filter((c) => !reviewOnly || !mastered.has(c.id));
  }, [order, cardById, selectedParadigm, reviewOnly, mastered]);

  const safeIndex = visibleCards.length > 0 ? Math.min(index, visibleCards.length - 1) : 0;
  const currentCard = visibleCards[safeIndex] || null;

  const goNext = useCallback(() => {
    if (visibleCards.length === 0) return;
    setFlipped(false);
    setIndex((i) => (i + 1) % visibleCards.length);
  }, [visibleCards.length]);

  const goPrev = useCallback(() => {
    if (visibleCards.length === 0) return;
    setFlipped(false);
    setIndex((i) => (i - 1 + visibleCards.length) % visibleCards.length);
  }, [visibleCards.length]);

  const markStatus = useCallback(
    (isMastered) => {
      if (!currentCard) return;
      const next = new Set(mastered);
      if (isMastered) next.add(currentCard.id);
      else next.delete(currentCard.id);
      persistMastered(next);
      setFlipped(false);
      if (!reviewOnly && visibleCards.length > 1) {
        setIndex((i) => (i + 1) % visibleCards.length);
      }
    },
    [currentCard, mastered, persistMastered, reviewOnly, visibleCards.length],
  );

  function handleShuffle() {
    const arr = [...order];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOrder(arr);
    setIndex(0);
    setFlipped(false);
  }

  function handleResetProgress() {
    persistMastered(new Set());
    setIndex(0);
    setFlipped(false);
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key.toLowerCase() === 'm') {
        markStatus(true);
      } else if (e.key.toLowerCase() === 'r') {
        markStatus(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, markStatus]);

  const totalCount = allCards.length;
  const masteredCount = mastered.size;
  const pct = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  return (
    <Layout
      title="Flashcards"
      description="Interactive study flashcards for algorithms, complexities, and core theory — saved locally in your browser.">
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Active Recall Study Mode</p>
            <h1 className={styles.title}>Algorithm Flashcards</h1>
            <p className={styles.subtitle}>
              Test yourself on complexities, trade-offs, and core theorems before the exam.
              Progress is stored privately in your browser (<code>localStorage</code>).
            </p>
          </div>
          <div className={styles.progressBox}>
            <div className={styles.progressMeta}>
              <span>
                Mastered <strong>{masteredCount}</strong> / {totalCount}
              </span>
              <span>{pct}%</span>
            </div>
            <div className={styles.progressTrack} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className={styles.progressFill} style={{width: `${pct}%`}} />
            </div>
          </div>
        </header>

        <section className={styles.controls} aria-label="Deck filters">
          <div className={styles.pills}>
            {paradigms.map((p) => (
              <button
                key={p}
                type="button"
                className={`${styles.pill} ${selectedParadigm === p ? styles.pillActive : ''}`}
                onClick={() => {
                  setSelectedParadigm(p);
                  setIndex(0);
                  setFlipped(false);
                }}>
                {p}
              </button>
            ))}
          </div>
          <div className={styles.toolRow}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={reviewOnly}
                onChange={(e) => {
                  setReviewOnly(e.target.checked);
                  setIndex(0);
                  setFlipped(false);
                }}
              />
              Review only (hide mastered)
            </label>
            <button type="button" className={styles.secondaryBtn} onClick={handleShuffle}>
              🔀 Shuffle
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={handleResetProgress}>
              Reset progress
            </button>
          </div>
        </section>

        {!currentCard ? (
          <div className={styles.emptyBox} role="status">
            <h2>All caught up! 🎉</h2>
            <p>You have mastered every card in this filter. Switch off &ldquo;Review only&rdquo; or pick another topic.</p>
          </div>
        ) : (
          <>
            <div className={styles.cardCounter}>
              <span>
                Card <strong>{safeIndex + 1}</strong> of <strong>{visibleCards.length}</strong>
              </span>
              {mastered.has(currentCard.id) && (
                <span className={styles.masteredTag}>✓ Mastered</span>
              )}
            </div>

            <div
              role="button"
              tabIndex={0}
              className={`${styles.card} ${flipped ? styles.cardFlipped : ''} ${mastered.has(currentCard.id) ? styles.cardMastered : ''}`}
              onClick={() => setFlipped((f) => !f)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setFlipped((f) => !f);
                }
              }}
              aria-pressed={flipped}
              aria-label={flipped ? 'Card answer shown. Click to flip back.' : 'Card question shown. Click to reveal answer.'}>
              <div className={styles.cardTop}>
                <span className={styles.badge}>{currentCard.paradigm}</span>
                <span className={styles.sideLabel}>{flipped ? 'Answer' : 'Question'}</span>
              </div>

              {!flipped ? (
                <div className={styles.cardBody}>
                  <p className={styles.question}>{renderMathText(currentCard.front, 'q')}</p>
                  <span className={styles.flipHint}>Click card or press Space to reveal answer</span>
                </div>
              ) : (
                <div className={styles.cardBody}>
                  {currentCard.complexities ? (
                    <div className={styles.complexityGrid}>
                      <div className={styles.complexityCell}>
                        <span className={styles.complexityLabel}>Best</span>
                        <span className={styles.complexityVal}>{renderMathText(currentCard.complexities.best, 'cb')}</span>
                      </div>
                      <div className={styles.complexityCell}>
                        <span className={styles.complexityLabel}>Average</span>
                        <span className={styles.complexityVal}>{renderMathText(currentCard.complexities.average, 'ca')}</span>
                      </div>
                      <div className={styles.complexityCell}>
                        <span className={styles.complexityLabel}>Worst</span>
                        <span className={styles.complexityVal}>{renderMathText(currentCard.complexities.worst, 'cw')}</span>
                      </div>
                      <div className={styles.complexityCell}>
                        <span className={styles.complexityLabel}>Space</span>
                        <span className={styles.complexityVal}>{renderMathText(currentCard.complexities.space, 'cs')}</span>
                      </div>
                    </div>
                  ) : (
                    <p className={styles.answer}>{renderMathText(currentCard.answer, 'a')}</p>
                  )}
                  {currentCard.props && currentCard.props.length > 0 && (
                    <div className={styles.propRow}>
                      {currentCard.props.map((pr) => (
                        <span key={pr} className={styles.propTag}>{pr}</span>
                      ))}
                    </div>
                  )}
                  {currentCard.notes && <p className={styles.notes}>{renderMathText(currentCard.notes, 'n')}</p>}
                  {currentCard.lessonUrl && (
                    <Link
                      to={currentCard.lessonUrl}
                      className={styles.lessonLink}
                      onClick={(e) => e.stopPropagation()}>
                      Open lesson →
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className={styles.actionBar}>
              <button type="button" className={styles.secondaryBtn} onClick={goPrev}>
                ← Prev
              </button>
              <div className={styles.gradeBtns}>
                <button
                  type="button"
                  className={styles.reviewBtn}
                  onClick={() => markStatus(false)}>
                  ↻ Needs review (R)
                </button>
                <button
                  type="button"
                  className={styles.masterBtn}
                  onClick={() => markStatus(true)}>
                  ✓ Mastered (M)
                </button>
              </div>
              <button type="button" className={styles.secondaryBtn} onClick={goNext}>
                Next →
              </button>
            </div>

            <p className={styles.kbdHint}>
              Shortcuts: <kbd>Space</kbd> flip · <kbd>←</kbd>/<kbd>→</kbd> prev/next · <kbd>M</kbd> mastered · <kbd>R</kbd> review
            </p>
          </>
        )}
      </main>
    </Layout>
  );
}
