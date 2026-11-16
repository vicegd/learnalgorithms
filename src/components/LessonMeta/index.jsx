import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

/**
 * Reading time and prerequisites shown under the title of a lesson.
 * Inserted automatically by src/plugins/remark-lesson-meta.js.
 */
export default function LessonMeta({minutes, prerequisites}) {
  let prereqs = [];
  try {
    prereqs = typeof prerequisites === 'string' ? JSON.parse(prerequisites) : prerequisites || [];
  } catch (e) {
    prereqs = [];
  }
  return (
    <div className={styles.meta}>
      <span className={styles.item}>
        <span aria-hidden="true">⏱</span> {minutes} min read
      </span>
      {prereqs.length > 0 && (
        <span className={styles.item}>
          <span className={styles.label}>Read first:</span>{' '}
          {prereqs.map((p, i) => (
            <React.Fragment key={p.to}>
              {i > 0 && ' · '}
              <Link to={p.to}>{p.title}</Link>
            </React.Fragment>
          ))}
        </span>
      )}
    </div>
  );
}
