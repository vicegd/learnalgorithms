import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import CONCEPT_LINKS from '../src/plugins/concept-links.js';
import pluginSiteData from '../src/plugins/docusaurus-plugin-site-data.js';
import {normalizePermalink} from '../src/utils/studyProgress.js';

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
