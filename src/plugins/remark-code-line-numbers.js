/**
 * Adds `showLineNumbers` to Java code blocks with at least MIN_LINES lines,
 * so that long listings show line numbers without annotating every block.
 * A block can opt out by writing `noLineNumbers` in its meta string.
 */
const MIN_LINES = 8;

export default function remarkCodeLineNumbers() {
  const visit = (node) => {
    if (node.type === 'code' && node.lang === 'java') {
      const meta = node.meta || '';
      const lines = (node.value || '').split('\n').length;
      if (lines >= MIN_LINES && !/showLineNumbers|noLineNumbers/.test(meta)) {
        node.meta = (meta + ' showLineNumbers').trim();
      }
    }
    if (node.children) node.children.forEach(visit);
  };
  return (tree) => visit(tree);
}
