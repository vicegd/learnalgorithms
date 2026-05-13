/**
 * docusaurus-plugin-site-data.js
 *
 * Build-time plugin that scans the algorithms/ and concepts/ directories,
 * extracts metadata from each MDX file, and exposes a single global data
 * object consumed by AlgorithmIndex, Roadmap, Glossary, and Stats pages.
 *
 * Exposed via: usePluginData('docusaurus-plugin-site-data')
 * Shape: { algorithms, concepts, crossRef, stats }
 */

import fs from 'fs';
import path from 'path';
import CONCEPT_LINKS from './concept-links.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** '06-dynamic-programming' → 'Dynamic Programming' */
function toLabel(name) {
  return name
    .replace(/^\d+-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** 'Dynamic Programming' → 'dynamic-programming' */
function toSlug(label) {
  return label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/** Extract page title from MDX content (frontmatter → first heading → filename). */
function extractTitle(content, fallbackSlug) {
  const fm = content.match(/^---[\s\S]*?\ntitle:\s*['"]?(.+?)['"]?\s*(\n|$)/m);
  if (fm) return fm[1].trim();

  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].replace(/\*\*|__/g, '').trim();

  return fallbackSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function isComingSoon(content) {
  return /\*Coming soon\.\*/i.test(content);
}

function hasVisualizer(content) {
  return /<\w*[Vv]isualizer/.test(content);
}

// ---------------------------------------------------------------------------
// Build cross-reference: conceptUrl → list of algorithms that mention it
// ---------------------------------------------------------------------------
function buildCrossRef(algorithmEntries) {
  const sortedTerms = Object.keys(CONCEPT_LINKS).sort((a, b) => b.length - a.length);
  const termRegex = new RegExp(
    `\\b(${sortedTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'gi'
  );

  // Map: conceptUrl → Set of algorithm titles+urls
  const map = {};

  for (const { title, url, content } of algorithmEntries) {
    termRegex.lastIndex = 0;
    const matchedUrls = new Set();
    let m;

    const regex = new RegExp(termRegex.source, 'gi');
    while ((m = regex.exec(content)) !== null) {
      const term = m[0];
      const key = Object.keys(CONCEPT_LINKS).find(
        (k) => k.toLowerCase() === term.toLowerCase()
      );
      if (key) matchedUrls.add(CONCEPT_LINKS[key]);
    }

    for (const conceptUrl of matchedUrls) {
      if (!map[conceptUrl]) map[conceptUrl] = [];
      map[conceptUrl].push({ title, url });
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------
export default function pluginSiteData(context) {
  const { siteDir } = context;

  return {
    name: 'docusaurus-plugin-site-data',

    async loadContent() {
      const algorithmEntries = []; // includes raw content for cross-ref
      const concepts = [];

      // ── Algorithms ─────────────────────────────────────────────────────────
      const algDir = path.join(siteDir, 'algorithms');

      function scanAlgorithms(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanAlgorithms(fullPath);
          } else if (entry.name.endsWith('.mdx') && entry.name !== 'index.mdx') {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const slug = path.basename(entry.name, '.mdx');
            const parentDir = path.dirname(fullPath);
            const isTopLevel = parentDir === algDir;
            const folderName = isTopLevel ? null : path.basename(parentDir);
            const category = folderName ? toLabel(folderName) : 'Other';
            const categorySlug = folderName ? toSlug(toLabel(folderName)) : null;
            const url = categorySlug
              ? `/algorithms/${categorySlug}/${slug}`
              : `/algorithms/${slug}`;

            algorithmEntries.push({
              title: extractTitle(content, slug),
              category,
              url,
              hasVisualizer: hasVisualizer(content),
              content, // kept temporarily for cross-ref, stripped below
            });
          }
        }
      }

      if (fs.existsSync(algDir)) scanAlgorithms(algDir);

      // ── Concepts ───────────────────────────────────────────────────────────
      const conDir = path.join(siteDir, 'concepts');
      const SKIP = new Set(['index.mdx', 'glossary.mdx', 'roadmap.mdx']);

      function scanConcepts(dir, category) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanConcepts(fullPath, toLabel(entry.name));
          } else if (entry.name.endsWith('.mdx') && !SKIP.has(entry.name)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const slug = path.basename(entry.name, '.mdx');
            const categorySlug = category ? toSlug(category) : null;
            const url = categorySlug
              ? `/concepts/${categorySlug}/${slug}`
              : `/concepts/${slug}`;

            concepts.push({
              title: extractTitle(content, slug),
              category: category || 'Other',
              url,
              comingSoon: isComingSoon(content),
            });
          }
        }
      }

      if (fs.existsSync(conDir)) scanConcepts(conDir, null);

      // ── Cross-reference ────────────────────────────────────────────────────
      const crossRef = buildCrossRef(algorithmEntries);

      // Strip raw content before exposing (not needed in the browser)
      const algorithms = algorithmEntries.map(({ content: _c, ...rest }) => rest);

      // ── Stats ──────────────────────────────────────────────────────────────
      const stats = {
        algorithms: algorithms.length,
        concepts: concepts.length,
        comingSoon: concepts.filter((c) => c.comingSoon).length,
        withVisualizer: algorithms.filter((a) => a.hasVisualizer).length,
        linkedConceptTerms: [...new Set(Object.values(CONCEPT_LINKS))].length,
      };

      return { algorithms, concepts, crossRef, stats };
    },

    async contentLoaded({ content, actions }) {
      actions.setGlobalData(content);
    },
  };
}
