import React, {useEffect, useState} from 'react';
import Link from '@docusaurus/Link';
import {useStudyProgress} from '@site/src/utils/studyProgress';
import {getAbVariant, trackAbConversion, trackAbExposure} from '@site/src/utils/abTest';
import styles from './SurveyPrompt.module.css';

const DISMISS_KEY = 'la.surveyPromptDismissed';
const SUBMITTED_KEY = 'la.surveySubmitted';
const EXPERIMENT_ID = 'survey_prompt_cta';
const MIN_LESSONS = 3;

export default function SurveyPrompt() {
  const {completed} = useStudyProgress();
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState('A');

  const count = completed?.size || 0;

  useEffect(() => {
    if (count < MIN_LESSONS) {
      setVisible(false);
      return;
    }
    try {
      const dismissed = window.localStorage.getItem(DISMISS_KEY) === '1';
      const submitted = window.localStorage.getItem(SUBMITTED_KEY) === '1';
      if (!dismissed && !submitted) {
        const v = getAbVariant(EXPERIMENT_ID);
        setVariant(v);
        setVisible(true);
        trackAbExposure(EXPERIMENT_ID, v);
      } else {
        setVisible(false);
      }
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
        <Link
          to="/survey"
          className={styles.cta}
          onClick={() => trackAbConversion(EXPERIMENT_ID, variant)}>
          {variant === 'B' ? 'Rate this course (60s) →' : 'Take 1-min survey →'}
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
