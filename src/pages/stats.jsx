import React from 'react';
import Layout from '@theme/Layout';
import { usePluginData } from '@docusaurus/useGlobalData';

function StatCard({ value, label }) {
  return (
    <div style={{
      border: '1px solid var(--ifm-color-emphasis-300)',
      borderRadius: '8px',
      padding: '1.5rem 2rem',
      textAlign: 'center',
      minWidth: '140px',
    }}>
      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--ifm-color-primary)' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--ifm-color-emphasis-700)', marginTop: '0.25rem' }}>
        {label}
      </div>
    </div>
  );
}

export default function Stats() {
  const { stats } = usePluginData('docusaurus-plugin-site-data');

  return (
    <Layout title="Site Stats" description="Live statistics about the learning content on this site">
      <main className="container margin-vert--lg">
        <h1>Site Stats</h1>
        <p>Auto-generated from the current content — updates with every build.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem' }}>
          <StatCard value={stats.algorithms} label="Algorithms documented" />
          <StatCard value={stats.withVisualizer} label="With interactive visualizer" />
          <StatCard value={stats.concepts} label="Concept pages" />
          <StatCard value={stats.comingSoon} label="Coming soon" />
          <StatCard value={stats.linkedConceptTerms} label="Linked concept terms" />
        </div>
      </main>
    </Layout>
  );
}
