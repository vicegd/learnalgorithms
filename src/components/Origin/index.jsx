import React from 'react';
import styles from './styles.module.css';

/**
 * Where an algorithm comes from: its creator and the original publication.
 *
 *   <Origin who="C. A. R. Hoare" year="1961" title="Algorithm 64: Quicksort"
 *           venue="Communications of the ACM 4(7)" url="https://doi.org/..." />
 *
 * `url` is optional (some origins are books or manuscripts with no stable
 * link); the children, if any, are a short note shown under the reference.
 */
export default function Origin({ who, year, title, venue, url, children }) {
  const work = title && (url
    ? <a href={url} target="_blank" rel="noopener noreferrer" className={styles.work}>{title}</a>
    : <span className={styles.work}>{title}</span>);
  return (
    <aside className={styles.box}>
      <span className={styles.mark} aria-hidden="true">✦</span>
      <span className={styles.text}>
        <span className={styles.label}>Origin</span>
        <span className={styles.ref}>
          <strong>{who}</strong>{year && <> ({year})</>}
          {work && <>. {work}</>}
          {venue && <span className={styles.venue}>. {venue}</span>}
          {url && <span aria-hidden="true" className={styles.ext}> ↗</span>}
        </span>
        {children && <span className={styles.note}>{children}</span>}
      </span>
    </aside>
  );
}
