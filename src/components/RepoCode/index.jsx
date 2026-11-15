import React from 'react';
import styles from './styles.module.css';

const REPO = 'https://github.com/vicegd/algorithms';
const BASE = `${REPO}/blob/master/src/topics/`;

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" width="22" height="22" aria-hidden="true" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/**
 * A highlighted box that links the explanation of an algorithm to its Java
 * implementation in the course repository.
 *
 *   <RepoCode files={['sorting/bubble/Bubble.java', 'sorting/bubble/BubbleSentinel.java']} />
 *
 * Paths are relative to src/topics/ in vicegd/algorithms.
 */
export default function RepoCode({ files = [], title = 'Java implementation in the course repository' }) {
  const packages = [...new Set(files.map((f) => f.split('/').slice(0, -1).join('.')))];
  const subtitle =
    packages.length === 1 ? `vicegd/algorithms · package topics.${packages[0]}` : 'vicegd/algorithms';
  return (
    <aside className={styles.box}>
      <div className={styles.header}>
        <span className={styles.mark}>
          <GitHubMark />
        </span>
        <div>
          <p className={styles.title}>{title}</p>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>
      <ul className={styles.files}>
        {files.map((f) => {
          const name = f.split('/').pop();
          return (
            <li key={f}>
              <a className={styles.file} href={BASE + f} target="_blank" rel="noopener noreferrer">
                <span className={styles.java}>J</span>
                <span className={styles.fileName}>{name}</span>
                <span className={styles.arrow} aria-hidden="true">↗</span>
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
