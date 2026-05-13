import React from 'react';
import Link from '@docusaurus/Link';
import { usePluginData } from '@docusaurus/useGlobalData';
import CONCEPT_LINKS from '../plugins/concept-links.js';

// Convert a URL slug to a category label: 'design-paradigms' → 'Design Paradigms'
function slugToTitle(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Convert a concept key to a display title: 'brute force' or 'brute-force' → 'Brute Force'
function termToTitle(term) {
  return term
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Build a deduplicated, grouped structure from CONCEPT_LINKS.
// Each URL appears only once; the display name comes from the FIRST key for that URL.
function buildIndex() {
  const seen = new Set();
  const groups = {};

  for (const [term, url] of Object.entries(CONCEPT_LINKS)) {
    if (seen.has(url)) continue;
    seen.add(url);

    // '/concepts/design-paradigms/brute-force' → ['concepts', 'design-paradigms', 'brute-force']
    const parts = url.replace(/^\//, '').split('/');
    const category = parts[1] ?? 'other';

    if (!groups[category]) groups[category] = [];
    groups[category].push({ url, title: termToTitle(term) });
  }

  // Sort categories and entries within each category
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, entries]) => ({
      category,
      label: slugToTitle(category),
      entries: entries.sort((a, b) => a.title.localeCompare(b.title)),
    }));
}

const index = buildIndex();

export default function ConceptIndex() {
  const { crossRef } = usePluginData('docusaurus-plugin-site-data');

  return (
    <div>
      {index.map(({ category, label, entries }) => (
        <div key={category}>
          <h3>{label}</h3>
          {entries.map(({ url, title }) => {
            const usedIn = crossRef[url] ?? [];
            return (
              <div key={url} style={{ marginBottom: '1rem' }}>
                <Link to={url}><strong>{title}</strong></Link>
                {usedIn.length > 0 && (
                  <span style={{ marginLeft: '0.75rem', fontSize: '0.85em', color: 'var(--ifm-color-emphasis-600)' }}>
                    {'— used in: '}
                    {usedIn.map(({ title: algTitle, url: algUrl }, i) => (
                      <span key={algUrl}>
                        {i > 0 && ', '}
                        <Link to={algUrl}>{algTitle}</Link>
                      </span>
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
