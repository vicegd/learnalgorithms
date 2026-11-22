import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import CONCEPT_LINKS from '../src/plugins/concept-links.js';
import pluginSiteData from '../src/plugins/docusaurus-plugin-site-data.js';
import {computeStreak, normalizePermalink} from '../src/utils/studyProgress.js';
import {recommendNextLessons} from '../src/utils/recommender.js';
import {createProgressBadge, renderBadgeSvg, verifyProgressBadge} from '../src/utils/progressBadge.js';
import {buildTfIdfSimilarity, computeReadability, levenshtein} from '../src/utils/nlp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

test('concept-links maps non-empty terms to /concepts/ URLs', () => {
  assert.equal(typeof CONCEPT_LINKS, 'object');
  assert.notEqual(CONCEPT_LINKS, null);
  for (const [term, url] of Object.entries(CONCEPT_LINKS)) {
    assert.ok(term.trim().length > 0, 'Concept term should not be blank');
    assert.ok(
      typeof url === 'string' && url.startsWith('/concepts/'),
      `Expected /concepts/ URL for "${term}", got "${url}"`,
    );
  }
});

test('normalizePermalink strips hashes and trailing slashes', () => {
  assert.equal(normalizePermalink('/concepts/sorting/quicksort/'), '/concepts/sorting/quicksort');
  assert.equal(normalizePermalink('/concepts/sorting/quicksort#analysis'), '/concepts/sorting/quicksort');
  assert.equal(normalizePermalink('/concepts/sorting/quicksort/#analysis'), '/concepts/sorting/quicksort');
  assert.equal(normalizePermalink('/'), '/');
  assert.equal(normalizePermalink(''), '');
  assert.equal(normalizePermalink(null), '');
});

test('computeStreak counts consecutive active days up to today or yesterday', () => {
  assert.equal(computeStreak([], '2026-11-22'), 0);
  assert.equal(computeStreak(['2026-11-20', '2026-11-21', '2026-11-22'], '2026-11-22'), 3);
  assert.equal(computeStreak(['2026-11-20', '2026-11-21'], '2026-11-22'), 2);
  assert.equal(computeStreak(['2026-11-18', '2026-11-19'], '2026-11-22'), 0);
});

test('recommendNextLessons suggests unlocked lessons ranked by downstream impact', () => {
  const concepts = [
    {title: 'A', url: '/concepts/ch1/a', prerequisites: []},
    {title: 'B', url: '/concepts/ch1/b', prerequisites: ['/concepts/ch1/a']},
    {title: 'C', url: '/concepts/ch1/c', prerequisites: ['/concepts/ch1/b']},
    {title: 'D', url: '/concepts/ch1/d', prerequisites: ['/concepts/ch1/a']},
  ];
  const recs = recommendNextLessons(concepts, new Set(['/concepts/ch1/a']), 3);
  assert.equal(recs.length, 2);
  assert.equal(recs[0].url, '/concepts/ch1/b'); // unlocks C
  assert.match(recs[0].reason, /Prerequisite completed \(A\)/);
  assert.match(recs[0].reason, /unlocks 1 topic/);
});

test('createProgressBadge, verifyProgressBadge, and renderBadgeSvg work end-to-end', async () => {
  const badge = await createProgressBadge({
    completedLessons: ['/concepts/sorting/quicksort'],
    totalLessons: 36,
    masteredChapters: 0,
    streakDays: 2,
  });
  assert.equal(await verifyProgressBadge(badge), true);
  const svg = renderBadgeSvg(badge);
  assert.match(svg, /^<svg /);
  assert.match(svg, /1 \/ 36 lessons/);
  assert.match(svg, /SHA-256:/);
  const tampered = {...badge, payload: {...badge.payload, completedCount: 36}};
  assert.equal(await verifyProgressBadge(tampered), false);
});

test('NLP utilities compute Levenshtein distance, readability, and TF-IDF cosine similarity', () => {
  assert.equal(levenshtein('dijkstra', 'dijktra'), 1);
  assert.equal(levenshtein('quicksort', 'quiksort'), 1);
  assert.equal(levenshtein('knapsack', 'knapsak'), 1);

  const rd = computeReadability(
    'Dynamic programming solves optimization problems by breaking them into overlapping subproblems. Memoization stores intermediate results.',
  );
  assert.ok(rd.words >= 15);
  assert.equal(rd.sentences, 2);
  assert.ok(rd.ttr > 0 && rd.ttr <= 1);

  const sim = buildTfIdfSimilarity([
    {url: '/a', title: 'Quicksort', prose: 'quicksort partition pivot divide conquer recursion array'},
    {url: '/b', title: 'Mergesort', prose: 'mergesort divide conquer recursion array sorting'},
    {url: '/c', title: 'Dijkstra', prose: 'dijkstra shortest path priority queue graph edges'},
  ]);
  assert.equal(sim.get('/a').related[0].url, '/b');
  assert.ok(sim.get('/a').keywords.length > 0);
});

test('docusaurus-plugin-site-data scans concepts without coming-soon placeholders', async () => {
  const plugin = pluginSiteData({siteDir: ROOT}, {includeAlgorithms: false});
  const data = await plugin.loadContent();
  assert.ok(data.concepts.length >= 30, `Expected >= 30 concept pages, got ${data.concepts.length}`);
  assert.equal(data.stats.comingSoon, 0, 'No concept page should be marked Coming soon');
  for (const c of data.concepts) {
    assert.ok(c.title && c.title.length > 0, `Missing title for ${c.url}`);
    assert.ok(c.url.startsWith('/concepts/'), `Unexpected URL ${c.url}`);
  }
});

test('all numbered lessons have frontmatter title, description, objectives, practice, and no TODOs', () => {
  const conceptsDir = path.join(ROOT, 'concepts');
  const chapters = fs.readdirSync(conceptsDir, {withFileTypes: true}).filter((d) => d.isDirectory());
  let checked = 0;

  for (const chapter of chapters) {
    const dir = path.join(conceptsDir, chapter.name);
    for (const file of fs.readdirSync(dir)) {
      if (!/^\d{2}-.*\.mdx$/.test(file) || /exercises|index/.test(file)) continue;
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      assert.match(content, /^---[\s\S]*?\ntitle:\s*.+/m, `Missing frontmatter title in ${chapter.name}/${file}`);
      assert.match(content, /^---[\s\S]*?\ndescription:\s*.+/m, `Missing frontmatter description in ${chapter.name}/${file}`);
      assert.match(content, /What you will learn/, `Missing learning objectives box in ${chapter.name}/${file}`);
      assert.match(content, /^## (Practice|Self-check)/m, `Missing Practice/Self-check section in ${chapter.name}/${file}`);
      assert.doesNotMatch(content, /\b(TODO|FIXME|TBD)\b/, `Found placeholder in ${chapter.name}/${file}`);
      checked += 1;
    }
  }
  assert.ok(checked >= 35, `Expected >= 35 numbered lessons, checked ${checked}`);
});
