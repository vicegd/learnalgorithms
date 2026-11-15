import React from 'react';
import styles from './styles.module.css';

const id = (n) => String(n).replace(/\./g, '-');

/** Link from the end of an exercise statement to its solution. */
export function ToSolution({ n }) {
  return (
    <p className={styles.row}>
      <a className={styles.pill} href={`#sol-${id(n)}`}>
        Solution to {n} <span aria-hidden="true">↓</span>
      </a>
    </p>
  );
}

/** Link from the end of a solution back to its statement. */
export function ToStatement({ n }) {
  return (
    <p className={styles.row}>
      <a className={`${styles.pill} ${styles.back}`} href={`#ex-${id(n)}`}>
        <span aria-hidden="true">↑</span> Back to exercise {n}
      </a>
    </p>
  );
}
