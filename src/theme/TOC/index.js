import React, {useEffect, useState} from 'react';
import TOC from '@theme-original/TOC';
import styles from './styles.module.css';

const STORAGE_KEY = 'learnalgorithms:toc-hidden:v1';

/** Same double-chevron icon Docusaurus uses for the left sidebar collapse/expand button. */
function DoubleChevron({direction}) {
  return (
    <svg
      width="20"
      height="20"
      aria-hidden="true"
      className={direction === 'right' ? styles.chevronRight : styles.chevronLeft}>
      <g fill="#7a7a7a">
        <path d="M9.992 10.585l5.657-5.657a1 1 0 00-1.414-1.414l-6.364 6.364a1 1 0 000 1.414l6.364 6.364a1 1 0 001.414-1.414l-5.657-5.657z" />
        <path d="M4.335 10.585l5.657-5.657a1 1 0 00-1.414-1.414L2.214 9.878a1 1 0 000 1.414l6.364 6.364a1 1 0 001.414-1.414l-5.657-5.657z" />
      </g>
    </svg>
  );
}

export default function TOCWrapper(props) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) === 'true';
      setHidden(saved);
      document.documentElement.dataset.tocHidden = saved ? 'true' : 'false';
    } catch {
      // Ignore storage errors
    }
    return () => {
      delete document.documentElement.dataset.tocHidden;
    };
  }, []);

  function toggleHidden() {
    const next = !hidden;
    setHidden(next);
    document.documentElement.dataset.tocHidden = next ? 'true' : 'false';
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Ignore storage errors
    }
  }

  if (hidden) {
    return (
      <button
        type="button"
        onClick={toggleHidden}
        className={styles.expandStrip}
        aria-label="Expand table of contents"
        title="Expand table of contents"
        aria-expanded="false">
        <DoubleChevron direction="left" />
      </button>
    );
  }

  return (
    <div className={styles.tocWrapper}>
      <div className={styles.tocBody}>
        <TOC {...props} />
      </div>
      <button
        type="button"
        onClick={toggleHidden}
        className={`button button--secondary button--outline ${styles.collapseButton}`}
        aria-label="Collapse table of contents"
        title="Collapse table of contents"
        aria-expanded="true">
        <DoubleChevron direction="right" />
      </button>
    </div>
  );
}
