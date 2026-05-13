/**
 * remark-autolink-concepts.js
 *
 * Automatically links the FIRST occurrence of each known concept term
 * in algorithm pages to its definition in the Concepts section.
 *
 * To add a new concept, add an entry to CONCEPT_LINKS:
 *   key   → term to search for (case-insensitive exact string)
 *   value → URL of the concept page
 *
 * Terms that share the same URL are treated as aliases: only one link
 * is inserted per URL per page (whichever alias appears first).
 *
 * Safe zones — the plugin NEVER inserts links inside:
 *   • code blocks / inline code
 *   • existing links / link references
 *   • headings
 *   • images
 *   • raw HTML / MDX JSX elements / MDX expressions
 */

// ---------------------------------------------------------------------------
// Dictionary: term (case-insensitive) → concept URL
// ---------------------------------------------------------------------------
const CONCEPT_LINKS = {
  'brute force':  '/concepts/design-paradigms/brute-force',
  'brute-force':  '/concepts/design-paradigms/brute-force',
};

// ---------------------------------------------------------------------------
// Internal: build regex and sorted term list
// ---------------------------------------------------------------------------
const SORTED_TERMS = Object.keys(CONCEPT_LINKS).sort((a, b) => b.length - a.length);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const TERM_PATTERN = new RegExp(
  `\\b(${SORTED_TERMS.map(escapeRegex).join('|')})\\b`,
  'gi'
);

// Node types where we stop descending (safe zones)
const SKIP_TYPES = new Set([
  'code',
  'inlineCode',
  'link',
  'linkReference',
  'image',
  'imageReference',
  'heading',
  'html',
  'mdxJsxFlowElement',
  'mdxJsxTextElement',
  'mdxFlowExpression',
  'mdxTextExpression',
]);

// ---------------------------------------------------------------------------
// Plugin factory
// ---------------------------------------------------------------------------
export default function remarkAutolinkConcepts() {
  return (tree) => {
    // Per-page set of already-linked URLs (prevents duplicate links)
    const linkedUrls = new Set();

    processNode(tree, null, linkedUrls);
  };
}

// ---------------------------------------------------------------------------
// Recursive tree processor
// ---------------------------------------------------------------------------
function processNode(node, parentType, linkedUrls) {
  if (!node || !node.type) return;

  // Do not descend into safe-zone nodes
  if (SKIP_TYPES.has(node.type)) return;

  if (!Array.isArray(node.children)) return;

  const newChildren = [];
  let changed = false;

  for (const child of node.children) {
    // Safe zones: keep as-is, do not recurse
    if (SKIP_TYPES.has(child.type)) {
      newChildren.push(child);
      continue;
    }

    // Text node: attempt to replace first unlinked term
    if (child.type === 'text') {
      const parts = splitTextNode(child.value, linkedUrls);
      if (parts) {
        newChildren.push(...parts);
        changed = true;
      } else {
        newChildren.push(child);
      }
      continue;
    }

    // Any other node: recurse into its children
    processNode(child, node.type, linkedUrls);
    newChildren.push(child);
  }

  if (changed) {
    node.children = newChildren;
  }
}

// ---------------------------------------------------------------------------
// Splits a text string into mdast text + link nodes.
// Returns null when nothing needs to change.
// ---------------------------------------------------------------------------
function splitTextNode(text, linkedUrls) {
  const regex = new RegExp(TERM_PATTERN.source, 'gi');
  let match;
  let lastIndex = 0;
  const parts = [];
  let anyChange = false;

  while ((match = regex.exec(text)) !== null) {
    const matchedText = match[0];
    const normKey = SORTED_TERMS.find(
      (t) => t.toLowerCase() === matchedText.toLowerCase()
    );
    const url = normKey ? CONCEPT_LINKS[normKey] : null;

    // Skip if URL not found or already linked on this page
    if (!url || linkedUrls.has(url)) continue;

    anyChange = true;
    linkedUrls.add(url);

    // Text before the match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    // Link node wrapping the matched term
    parts.push({
      type: 'link',
      url,
      title: null,
      children: [{ type: 'text', value: matchedText }],
    });

    lastIndex = match.index + matchedText.length;
  }

  if (!anyChange) return null;

  // Remaining text after the last match
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}
