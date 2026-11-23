import React from 'react';
import styles from './MarkdownView.module.css';

function renderInline(text, keyPrefix = 'in') {
  if (!text) return null;
  const parts = [];
  // Matches: `code`, **bold**, *italic*, [label](url)
  const tokenRe = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\((?:https?:\/\/|\/)[^)\s]+\))/g;
  let lastIndex = 0;
  let match;
  let idx = 0;

  while ((match = tokenRe.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const tok = match[0];
    const key = `${keyPrefix}-${idx++}`;
    if (tok.startsWith('`') && tok.endsWith('`')) {
      parts.push(<code key={key}>{tok.slice(1, -1)}</code>);
    } else if (tok.startsWith('**') && tok.endsWith('**')) {
      parts.push(<strong key={key}>{renderInline(tok.slice(2, -2), `${key}-b`)}</strong>);
    } else if (tok.startsWith('*') && tok.endsWith('*')) {
      parts.push(<em key={key}>{tok.slice(1, -1)}</em>);
    } else if (tok.startsWith('[')) {
      const m = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) {
        const external = m[2].startsWith('http');
        parts.push(
          <a
            key={key}
            href={m[2]}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}>
            {m[1]}
          </a>,
        );
      } else {
        parts.push(tok);
      }
    }
    lastIndex = tokenRe.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isTableSeparator(line) {
  return /^\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?$/.test(line.trim());
}

/**
 * Lightweight, XSS-safe Markdown renderer (pure React elements, no dangerouslySetInnerHTML).
 * Supports headings, tables, ordered/unordered lists, blockquotes, horizontal rules, and inline formatting.
 */
export default function MarkdownView({content, className = ''}) {
  if (!content) return null;

  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  let keyIdx = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push(<hr key={`b-${keyIdx++}`} className={styles.hr} />);
      i += 1;
      continue;
    }

    // Headings (# .. ####)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const Tag = `h${Math.min(level + 1, 5)}`;
      blocks.push(
        <Tag key={`b-${keyIdx++}`} className={styles[`h${level}`]}>
          {renderInline(text, `h-${keyIdx}`)}
        </Tag>,
      );
      i += 1;
      continue;
    }

    // Markdown table
    if (trimmed.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = splitTableRow(trimmed);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().includes('|') && lines[i].trim() !== '') {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      blocks.push(
        <div key={`b-${keyIdx++}`} className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {headers.map((h, hi) => (
                  <th key={hi} scope="col">{renderInline(h, `th-${keyIdx}-${hi}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {headers.map((_, ci) => (
                    <td key={ci}>{renderInline(row[ci] ?? '', `td-${keyIdx}-${ri}-${ci}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push(
        <blockquote key={`b-${keyIdx++}`} className={styles.blockquote}>
          {renderInline(quoteLines.join(' '), `q-${keyIdx}`)}
        </blockquote>,
      );
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ul key={`b-${keyIdx++}`} className={styles.list}>
          {items.map((item, li) => (
            <li key={li}>{renderInline(item, `ul-${keyIdx}-${li}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ol key={`b-${keyIdx++}`} className={styles.list}>
          {items.map((item, li) => (
            <li key={li}>{renderInline(item, `ol-${keyIdx}-${li}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph (collect consecutive plain lines)
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,4}\s+|[-*+]\s+|\d+\.\s+|>\s?|-{3,}|\*{3,}|_{3,})/.test(lines[i].trim()) &&
      !(lines[i].includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
    ) {
      paraLines.push(lines[i].trim());
      i += 1;
    }
    blocks.push(
      <p key={`b-${keyIdx++}`} className={styles.p}>
        {renderInline(paraLines.join(' '), `p-${keyIdx}`)}
      </p>,
    );
  }

  return <div className={`${styles.markdown} ${className}`}>{blocks}</div>;
}
