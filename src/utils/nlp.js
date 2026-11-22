/**
 * Pure-JavaScript Natural Language Processing (NLP) utilities for learnalgorithms.dev:
 *  - MDX-to-prose extraction
 *  - Readability metrics (Flesch Reading Ease, Flesch-Kincaid Grade, Type-Token Ratio)
 *  - TF-IDF vectorization & Cosine Similarity for related-lesson recommendations
 *  - Levenshtein edit distance for typo-tolerant fuzzy search
 */

const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'have', 'has', 'had', 'was', 'were',
  'are', 'but', 'not', 'you', 'your', 'very', 'more', 'most', 'some', 'into', 'about',
  'just', 'like', 'what', 'when', 'where', 'which', 'how', 'can', 'could', 'would', 'should',
  'there', 'their', 'they', 'them', 'then', 'than', 'also', 'only', 'each', 'every', 'other',
  'such', 'will', 'does', 'done', 'being', 'been', 'here', 'over', 'under', 'between', 'after',
  'before', 'through', 'during', 'without', 'within', 'using', 'used', 'uses', 'make', 'made',
  'take', 'takes', 'give', 'gives', 'given', 'show', 'shows', 'note', 'example', 'problem',
  'algorithm', 'algorithms', 'step', 'steps', 'time', 'value', 'values', 'case', 'cases',
  'first', 'second', 'next', 'last', 'same', 'different', 'because', 'since', 'while', 'both',
]);

export function stripMdxToProse(mdx) {
  return String(mdx || '')
    .replace(/^---[\s\S]*?^---/m, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\$[^$\n]+\$/g, ' ')
    .replace(/import\s+.+?from\s+.+?;?\s*$/gm, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(text) {
  return (String(text || '').toLowerCase().match(/[a-z]{3,}/g) || []).filter(
    (w) => !STOPWORDS.has(w),
  );
}

function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

/**
 * Compute Flesch Reading Ease, Flesch-Kincaid Grade Level, and Type-Token Ratio (TTR).
 */
export function computeReadability(prose) {
  const clean = String(prose || '').trim();
  const words = clean.match(/[A-Za-z]+/g) || [];
  if (words.length === 0) {
    return {
      words: 0,
      sentences: 0,
      avgSentenceLength: 0,
      fleschEase: 0,
      fkGrade: 0,
      ttr: 0,
    };
  }
  const sentences = Math.max(1, (clean.match(/[.!?]+(?:\s|$)/g) || []).length);
  let syllables = 0;
  const unique = new Set();
  for (const w of words) {
    syllables += countSyllables(w);
    unique.add(w.toLowerCase());
  }
  const wps = words.length / sentences;
  const spw = syllables / words.length;
  const fleschEase = Math.round((206.835 - 1.015 * wps - 84.6 * spw) * 10) / 10;
  const fkGrade = Math.round((0.39 * wps + 11.8 * spw - 15.59) * 10) / 10;
  const ttr = Math.round((unique.size / words.length) * 1000) / 1000;
  return {
    words: words.length,
    sentences,
    avgSentenceLength: Math.round(wps * 10) / 10,
    fleschEase,
    fkGrade,
    ttr,
  };
}

/**
 * Build TF-IDF vectors and compute pairwise cosine similarity across lessons.
 * docs: [{ url, title, prose }]
 * Returns Map<url, { keywords: string[], related: Array<{ url, title, score }> }>
 */
export function buildTfIdfSimilarity(docs, topK = 3) {
  const N = docs.length;
  if (N === 0) return new Map();

  const df = new Map();
  const docTfs = docs.map((d) => {
    const tokens = tokenize(d.prose);
    const tf = new Map();
    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1);
    }
    const len = tokens.length || 1;
    for (const t of tf.keys()) {
      df.set(t, (df.get(t) || 0) + 1);
      tf.set(t, tf.get(t) / len);
    }
    return tf;
  });

  const vectors = docTfs.map((tf) => {
    const vec = new Map();
    let normSq = 0;
    for (const [term, freq] of tf.entries()) {
      const idf = Math.log((N + 1) / ((df.get(term) || 0) + 1)) + 1;
      const w = freq * idf;
      vec.set(term, w);
      normSq += w * w;
    }
    return {vec, norm: Math.sqrt(normSq) || 1};
  });

  const out = new Map();
  for (let i = 0; i < N; i++) {
    const {vec: vi, norm: ni} = vectors[i];
    const keywords = [...vi.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term]) => term);

    const sims = [];
    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const {vec: vj, norm: nj} = vectors[j];
      let dot = 0;
      const [small, big] = vi.size <= vj.size ? [vi, vj] : [vj, vi];
      for (const [term, w] of small.entries()) {
        const w2 = big.get(term);
        if (w2) dot += w * w2;
      }
      const score = dot / (ni * nj);
      if (score > 0.05) {
        sims.push({
          url: docs[j].url,
          title: docs[j].title,
          score: Math.round(score * 100) / 100,
        });
      }
    }
    sims.sort((a, b) => b.score - a.score);
    out.set(docs[i].url, {keywords, related: sims.slice(0, topK)});
  }
  return out;
}

/**
 * Levenshtein edit distance (dynamic programming, O(|a|*|b|) time, O(min(|a|,|b|)) space).
 */
export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (a.length > b.length) [a, b] = [b, a];
  let prev = Array.from({length: a.length + 1}, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    const curr = [j];
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[i] = Math.min(prev[i] + 1, curr[i - 1] + 1, prev[i - 1] + cost);
    }
    prev = curr;
  }
  return prev[a.length];
}
