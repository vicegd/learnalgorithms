import React from 'react';
import Link from '@docusaurus/Link';
import { usePluginData } from '@docusaurus/useGlobalData';

export default function Roadmap() {
  const { concepts } = usePluginData('docusaurus-plugin-site-data');
  const pending = concepts
    .filter((c) => c.comingSoon)
    .sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));

  if (pending.length === 0) {
    return <p>🎉 All concept pages are complete!</p>;
  }

  const groups = {};
  for (const c of pending) {
    if (!groups[c.category]) groups[c.category] = [];
    groups[c.category].push(c);
  }

  return (
    <div>
      {Object.entries(groups).map(([category, entries]) => (
        <div key={category}>
          <h3>{category}</h3>
          <ul>
            {entries.map(({ title, url }) => (
              <li key={url}>
                <Link to={url}>{title}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
