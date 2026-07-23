import React, {useState} from 'react';
import TOC from '@theme-original/TOC';
import styles from './styles.module.css';

export default function TOCWrapper(props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.tocWrapper}>
      <button
        className={styles.tocToggle}
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Show table of contents' : 'Hide table of contents'}
        title={collapsed ? 'Show table of contents' : 'Hide table of contents'}
      >
        <span className={styles.tocToggleLabel}>On this page</span>
        <span className={`${styles.tocToggleIcon} ${collapsed ? styles.tocToggleIconCollapsed : ''}`}>
          ›
        </span>
      </button>
      {!collapsed && <TOC {...props} />}
    </div>
  );
}
