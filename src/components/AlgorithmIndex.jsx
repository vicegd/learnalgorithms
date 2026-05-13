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
    <div>
      {groups.map(({ category, entries }) => (
        <div key={category}>
          <h3>{category}</h3>
          <ul>
            {entries.map(({ title, url, hasVisualizer }) => (
              <li key={url}>
                <Link to={url}>{title}</Link>
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
