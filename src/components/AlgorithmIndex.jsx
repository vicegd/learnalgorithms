import React from 'react';
import Link from '@docusaurus/Link';
import { usePluginData } from '@docusaurus/useGlobalData';

function groupByCategory(algorithms) {
  const groups = {};
  for (const alg of algorithms) {
    if (!groups[alg.category]) groups[alg.category] = [];
    groups[alg.category].push(alg);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, entries]) => ({
      category,
      entries: entries.sort((a, b) => a.title.localeCompare(b.title)),
    }));
}

export default function AlgorithmIndex() {
  const { algorithms } = usePluginData('docusaurus-plugin-site-data');
  const groups = groupByCategory(algorithms);

  return (
    <div className="no-numbering">
      {groups.map(({ category, entries }) => (
        <div key={category}>
          <h3>{category}</h3>
          <ul>
            {entries.map(({ title, url, hasVisualizer, comingSoon }) => (
              <li key={url}>
                <Link to={url}>{title}</Link>
                {comingSoon && (
                  <span
                    title="Coming soon"
                    style={{
                      marginLeft: '0.5rem',
                      fontSize: '0.7em',
                      fontWeight: 600,
                      color: 'var(--ifm-color-warning-dark)',
                      border: '1px solid var(--ifm-color-warning)',
                      borderRadius: '4px',
                      padding: '1px 6px',
                      verticalAlign: 'middle',
                    }}
                  >
                    coming soon
                  </span>
                )}
                {hasVisualizer && (
                  <span
                    title="Has interactive visualizer"
                    style={{ marginLeft: '0.5rem', fontSize: '0.8em' }}
                  >
                    🎛
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
