import React, {useEffect, useState} from 'react';
import TOC from '@theme-original/TOC';
import styles from './styles.module.css';

const STORAGE_KEY = 'learnalgorithms:toc-hidden:v1';

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
        className={styles.restoreBtn}
        aria-expanded="false"
        title="Show table of contents">
        <span aria-hidden="true">◂</span> On this page
      </button>
    );
  }

  return (
    <div className={styles.tocWrapper}>
      <div className={styles.tocHeader}>
        <span className={styles.tocTitle}>On this page</span>
        <button
          type="button"
          onClick={toggleHidden}
          className={styles.hideBtn}
          aria-expanded="true"
          title="Hide table of contents">
          Hide <span aria-hidden="true">▸</span>
        </button>
      </div>
      <TOC {...props} />
    </div>
  );
}
