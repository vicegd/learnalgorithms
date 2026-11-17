import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useHistory} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

/**
 * Site search. The index (build/search-index.json) is produced at build time
 * by src/plugins/docusaurus-plugin-local-search.js and downloaded the first
 * time the search box gets the focus. Shortcut: Ctrl/Cmd + K or "/".
 */

const MAX_RESULTS = 8;

const normalize = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function search(index, query) {
  const terms = normalize(query).split(/\s+/).filter((t) => t.length > 1);
  if (terms.length === 0) return [];
  const results = [];
  for (const page of index) {
    const title = normalize(page.t);
    for (const sec of page.s) {
      const heading = normalize(sec.h);
      const text = normalize(sec.x);
      let score = 0;
      let all = true;
      for (const t of terms) {
        const inTitle = title.includes(t);
        const inHeading = heading.includes(t);
        const count = text.split(t).length - 1;
        if (!inTitle && !inHeading && count === 0) {
          all = false;
          break;
        }
        score += (inTitle ? 8 : 0) + (inHeading ? 12 : 0) + Math.min(count, 5);
      }
      if (all) results.push({page, sec, score, terms});
    }
  }
  results.sort((a, b) => b.score - a.score);
  // At most two sections of the same page, so that one long page does not fill the list.
  const perPage = new Map();
  return results
    .filter((r) => {
      const n = perPage.get(r.page.u) || 0;
      perPage.set(r.page.u, n + 1);
      return n < 2;
    })
    .slice(0, MAX_RESULTS);
}

function snippet(text, terms) {
  const norm = normalize(text);
  let pos = -1;
  for (const t of terms) {
    const p = norm.indexOf(t);
    if (p >= 0 && (pos < 0 || p < pos)) pos = p;
  }
  const start = Math.max(0, pos - 50);
  let s = text.slice(start, start + 150);
  if (start > 0) s = '…' + s;
  if (start + 150 < text.length) s += '…';
  return s;
}

function Highlight({text, terms}) {
  const norm = normalize(text);
  const marks = [];
  for (const t of terms) {
    let i = norm.indexOf(t);
    while (i >= 0) {
      marks.push([i, i + t.length]);
      i = norm.indexOf(t, i + t.length);
    }
  }
  marks.sort((a, b) => a[0] - b[0]);
  const out = [];
  let last = 0;
  for (const [a, b] of marks) {
    if (a < last) continue;
    out.push(text.slice(last, a));
    out.push(<mark key={a}>{text.slice(a, b)}</mark>);
    last = b;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}

export default function SearchBar() {
  const indexUrl = useBaseUrl('/search-index.json');
  const history = useHistory();
  const [index, setIndex] = useState(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const loading = useRef(false);

  const load = useCallback(() => {
    if (index || loading.current) return;
    loading.current = true;
    fetch(indexUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setIndex)
      .catch(() => setFailed(true));
  }, [index, indexUrl]);

  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const results = index && query.trim().length > 1 ? search(index, query) : [];
  const urlOf = (r) => (r.sec.a ? `${r.page.u}#${r.sec.a}` : r.page.u);

  const go = (r) => {
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
    history.push(urlOf(r));
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={styles.search}>
      <input
        ref={inputRef}
        type="search"
        className={styles.input}
        placeholder="Search"
        aria-label="Search the lessons"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && results.length > 0}
        aria-controls="search-results"
        aria-activedescendant={open && results[active] ? `search-result-${active}` : undefined}
        value={query}
        onFocus={() => {
          load();
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {open && query.trim().length > 1 && (
        <div className={styles.panel} role="listbox" id="search-results" aria-label="Search results">
          {failed && <div className={styles.empty}>The search index could not be loaded.</div>}
          {!failed && !index && <div className={styles.empty}>Loading…</div>}
          {index && results.length === 0 && <div className={styles.empty}>No results for “{query}”.</div>}
          {results.map((r, i) => (
            <a
              key={urlOf(r)}
              id={`search-result-${i}`}
              href={urlOf(r)}
              role="option"
              aria-selected={i === active}
              className={i === active ? `${styles.result} ${styles.active}` : styles.result}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                go(r);
              }}>
              <span className={styles.page}>{r.page.t}</span>
              {r.sec.h && (
                <span className={styles.heading}>
                  <Highlight text={r.sec.h} terms={r.terms} />
                </span>
              )}
              <span className={styles.snippet}>
                <Highlight text={snippet(r.sec.x, r.terms)} terms={r.terms} />
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
