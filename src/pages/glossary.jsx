import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import CONCEPT_LINKS from '../plugins/concept-links.js';

function slugToTitle(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function termToTitle(term) {
  return term
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildIndex() {
  const seen = new Set();
  const groups = {};

  for (const [term, url] of Object.entries(CONCEPT_LINKS)) {
    if (seen.has(url)) continue;
    seen.add(url);

    const parts = url.replace(/^\//, '').split('/');
    const category = parts[1] ?? 'other';

    if (!groups[category]) groups[category] = [];
    groups[category].push({ url, title: termToTitle(term) });
  }

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, entries]) => ({
      category,
      label: slugToTitle(category),
      entries: entries.sort((a, b) => a.title.localeCompare(b.title)),
    }));
}

const index = buildIndex();

export default function Glossary() {
  return (
    <Layout title="Glossary" description="Index of all algorithm and CS concepts defined on this site">
      <main className="container margin-vert--lg">
        <h1>Glossary</h1>
        <p>
          All concepts defined on this site, grouped by category. Each entry links
          to its full explanation page.
        </p>
        {index.map(({ category, label, entries }) => (
          <section key={category} style={{ marginBottom: '2rem' }}>
            <h2>{label}</h2>
            <table>
              <tbody>
                {entries.map(({ url, title }) => (
                  <tr key={url}>
                    <td>
                      <Link to={url}>{title}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </main>
    </Layout>
  );
}
