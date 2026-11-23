import React, {useEffect, useState} from 'react';
import Link from '@docusaurus/Link';
import {useStudyProgress} from '@site/src/utils/studyProgress';
import styles from './SurveyPrompt.module.css';

const DISMISS_KEY = 'la.surveyPromptDismissed';
const SUBMITTED_KEY = 'la.surveySubmitted';
const MIN_LESSONS = 3;

export default function SurveyPrompt() {
  const {completed} = useStudyProgress();
  const [visible, setVisible] = useState(false);

  const count = completed?.size || 0;

  useEffect(() => {
    if (count < MIN_LESSONS) {
      setVisible(false);
      return;
    }
    try {
      const dismissed = window.localStorage.getItem(DISMISS_KEY) === '1';
      const submitted = window.localStorage.getItem(SUBMITTED_KEY) === '1';
      setVisible(!dismissed && !submitted);
    } catch {
      setVisible(false);
    }
  }, [count]);

  if (!visible) return null;

  function handleDismiss() {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore storage errors
    }
  }

  return (
    <aside className={styles.banner} aria-label="Course satisfaction survey invitation">
      <div className={styles.text}>
        <strong className={styles.title}>
          You have completed {count} lessons!
        </strong>
        <span className={styles.subtitle}>
          Have 60 seconds to rate <strong>learnalgorithms.dev</strong>? Your anonymous feedback helps improve the course.
        </span>
      </div>
      <div className={styles.actions}>
        <Link to="/survey" className={styles.cta}>
          Take 1-min survey →
        </Link>
        <button
          type="button"
          className={styles.dismiss}
          onClick={handleDismiss}
          aria-label="Dismiss survey invitation">
          Dismiss
        </button>
      </div>
    </aside>
  );
}
