import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

/**
 * A highlighted link from the explanation of an algorithm to its proof.
 *
 *   <ProofLink to="/concepts/sorting/proofs#insertion-sort-is-correct"
 *              title="Insertion sort is correct" />
 */
export default function ProofLink({ to, title, children }) {
  return (
    <Link to={to} className={styles.box}>
      <span className={styles.mark} aria-hidden="true">∴</span>
      <span className={styles.text}>
        <span className={styles.label}>Proof</span>
        <span className={styles.title}>{title ?? children}</span>
      </span>
      <span className={styles.arrow} aria-hidden="true">→</span>
    </Link>
  );
}
