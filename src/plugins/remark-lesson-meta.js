/**
 * Adds a <LessonMeta> line under the title of every lesson in concepts/:
 * the estimated reading time and, when the front matter lists them, the
 * lessons to read first.
 *
 *   ---
 *   title: Quicksort
 *   prerequisites:
 *     - /concepts/sorting/the-sorting-problem
 *     - /concepts/mathematical-background/induction-and-recurrences
 *   ---
 *
 * Prerequisites are written as permalinks; the plugin resolves each one to the
 * title of its lesson and fails the build if a permalink does not exist, so a
 * renamed lesson cannot leave a broken prerequisite behind.
 *
 * Exercises, proofs, references, indexes and the glossary get no meta line.
 */
import fs from 'fs';
import path from 'path';

const WORDS_PER_MINUTE = 200;
const LESSON_FILE = /[\\/]concepts[\\/]\d+-[^\\/]+[\\/]\d+-[^\\/]+\.mdx?$/;
const SKIP_FILE = /exercises\.mdx?$/;

const stripPrefix = (name) => name.replace(/^\d+-/, '').replace(/\.mdx?$/, '');

function readFrontMatter(file) {
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : '';
}

function titleOf(frontMatter) {
  const m = frontMatter.match(/^title:\s*(.+)$/m);
  return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : null;
}

function prerequisitesOf(frontMatter) {
  const m = frontMatter.match(/^prerequisites:\s*\r?\n((?:[ \t]+-[^\n]*\r?\n?)+)/m);
  if (!m) return [];
  return m[1]
    .split('\n')
    .map((l) => l.replace(/^[ \t]+-\s*/, '').trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

/** permalink → title of every lesson in concepts/ (built once per build). */
let INDEX = null;
function lessonIndex(conceptsDir) {
  if (INDEX) return INDEX;
  INDEX = new Map();
  for (const chapter of fs.readdirSync(conceptsDir)) {
    const chapterDir = path.join(conceptsDir, chapter);
    if (!/^\d+-/.test(chapter) || !fs.statSync(chapterDir).isDirectory()) continue;
    for (const file of fs.readdirSync(chapterDir)) {
      if (!/^\d+-.*\.mdx?$/.test(file)) continue;
      const fm = readFrontMatter(path.join(chapterDir, file));
      const permalink = `/concepts/${stripPrefix(chapter)}/${stripPrefix(file)}`;
      INDEX.set(permalink, titleOf(fm) || stripPrefix(file));
    }
  }
  return INDEX;
}

function countWords(node) {
  if (node.type === 'mdxjsEsm' || node.type === 'mdxFlowExpression') return 0;
  let words = 0;
  if (typeof node.value === 'string' && node.type !== 'html') {
    words += (node.value.match(/\S+/g) || []).length;
  }
  if (node.children) for (const child of node.children) words += countWords(child);
  return words;
}

export default function remarkLessonMeta() {
  return (tree, file) => {
    const filePath = file.path || (file.history && file.history[0]) || '';
    if (!LESSON_FILE.test(filePath) || SKIP_FILE.test(filePath)) return;

    const conceptsDir = path.resolve(path.dirname(filePath), '..');
    const index = lessonIndex(conceptsDir);
    const prerequisites = prerequisitesOf(readFrontMatter(filePath)).map((to) => {
      const clean = to.replace(/\/$/, '').split('#')[0];
      if (!index.has(clean)) {
        throw new Error(`[remark-lesson-meta] ${path.basename(filePath)}: unknown prerequisite "${to}"`);
      }
      return {title: index.get(clean), to};
    });

    const minutes = Math.max(1, Math.round(countWords(tree) / WORDS_PER_MINUTE));
    const element = {
      type: 'mdxJsxFlowElement',
      name: 'LessonMeta',
      attributes: [
        {type: 'mdxJsxAttribute', name: 'minutes', value: String(minutes)},
        {type: 'mdxJsxAttribute', name: 'prerequisites', value: JSON.stringify(prerequisites)},
      ],
      children: [],
    };

    // Docusaurus wraps the leading h1 in a <header> element before this plugin runs.
    const isTitle = (n) =>
      (n.type === 'heading' && n.depth === 1) ||
      (n.type === 'mdxJsxFlowElement' && n.name === 'header');
    const h1 = tree.children.findIndex(isTitle);
    tree.children.splice(h1 + 1, 0, element);
  };
}
