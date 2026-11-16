/**
 * docusaurus-plugin-local-search.js
 *
 * Builds a small full-text search index without any external service or
 * dependency. After the build, it reads the generated HTML of every page
 * under /concepts, splits it into sections at each h2/h3, and writes
 * build/search-index.json:
 *
 *   [{ t: page title, u: page url, s: [{ h: heading, a: anchor id, x: text }] }]
 *
 * The SearchBar component (src/theme/SearchBar) downloads that file the first
 * time the search box gets the focus and searches it in the browser.
 */
import fs from 'fs';
import path from 'path';

const ENTITIES = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", '#x27': "'"};

function decode(text) {
  return text
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
      const k = e.toLowerCase();
      if (ENTITIES[k] !== undefined) return ENTITIES[k];
      if (k.startsWith('#x')) return String.fromCodePoint(parseInt(k.slice(2), 16));
      if (k.startsWith('#')) return String.fromCodePoint(parseInt(k.slice(1), 10));
      return m;
    });
}

/** Index of the end of the element that opens at `start` (balanced on `tag`). */
function elementEnd(html, start, tag) {
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'gi');
  re.lastIndex = start;
  let depth = 0;
  let m;
  while ((m = re.exec(html))) {
    if (m[0][1] === '/') {
      depth -= 1;
      if (depth === 0) return m.index + m[0].length;
    } else {
      depth += 1;
    }
  }
  return html.length;
}

/** Removes every element whose opening tag matches `open` (e.g. /<svg\b/). */
function removeElements(html, open, tag) {
  let out = '';
  let i = 0;
  const re = new RegExp(open.source, 'gi');
  let m;
  while ((m = re.exec(html))) {
    if (m.index < i) continue;
    out += html.slice(i, m.index);
    i = elementEnd(html, m.index, tag);
    re.lastIndex = i;
  }
  return out + html.slice(i);
}

function toText(html) {
  return decode(
    html
      .replace(/<math[\s\S]*?<annotation[^>]*>([\s\S]*?)<\/annotation>[\s\S]*?<\/math>/gi, ' $1 ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/​/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extracts the title and the sections of one built page. */
export function extractPage(html) {
  const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const start = html.search(/<div class="theme-doc-markdown markdown"/i);
  if (start < 0) return null;
  let body = html.slice(start, elementEnd(html, start, 'div'));

  body = removeElements(body, /<svg\b/, 'svg');
  body = removeElements(body, /<span class="katex-html"/, 'span');
  body = removeElements(body, /<script\b/, 'script');
  body = removeElements(body, /<style\b/, 'style');
  body = body.replace(/<a[^>]*class="hash-link"[^>]*>[\s\S]*?<\/a>/gi, '');

  const title = titleMatch ? toText(titleMatch[1].replace(/<a[^>]*class="hash-link"[^>]*>[\s\S]*?<\/a>/gi, '')) : '';
  const sections = [];
  const headingRe = /<h([23])[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;
  let last = {h: '', a: '', from: 0};
  let m;
  const push = (end) => {
    const x = toText(body.slice(last.from, end).replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, ''));
    if (x || last.h) sections.push({h: last.h, a: last.a, x});
  };
  while ((m = headingRe.exec(body))) {
    push(m.index);
    last = {h: toText(m[3]), a: m[2], from: m.index + m[0].length};
  }
  push(body.length);
  return {title, sections};
}

function htmlFileFor(outDir, route) {
  const clean = route.replace(/\/$/, '');
  const candidates = [path.join(outDir, `${clean}.html`), path.join(outDir, clean, 'index.html')];
  return candidates.find((f) => fs.existsSync(f));
}

export default function pluginLocalSearch() {
  return {
    name: 'docusaurus-plugin-local-search',
    async postBuild({outDir, routesPaths, baseUrl}) {
      const prefix = `${baseUrl.replace(/\/$/, '')}/concepts`;
      const index = [];
      for (const route of [...new Set(routesPaths)].sort()) {
        if (!route.startsWith(prefix) || route.includes('/tags')) continue;
        const file = htmlFileFor(outDir, route);
        if (!file) continue;
        const page = extractPage(fs.readFileSync(file, 'utf8'));
        if (!page || !page.title) continue;
        index.push({t: page.title, u: route, s: page.sections});
      }
      fs.writeFileSync(path.join(outDir, 'search-index.json'), JSON.stringify(index));
      console.log(`[local-search] indexed ${index.length} pages`);
    },
  };
}
