import React from 'react';
import Footer from '@theme-original/DocItem/Footer';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {normalizePermalink, useStudyProgress} from '@site/src/utils/studyProgress';
import styles from './styles.module.css';

const REPO = 'https://github.com/vicegd/learnalgorithms';

/** Link to a GitHub issue form with the current page already filled in. */
function issueUrl(template, prefix, title, pageUrl) {
  const params = new URLSearchParams({
    template,
    title: `${prefix} ${title}`,
    page: pageUrl,
  });
  return `${REPO}/issues/new?${params.toString()}`;
}

function isTrackableLesson(permalink) {
  const normalized = normalizePermalink(permalink);
  if (!normalized.startsWith('/concepts/')) return false;
  return normalized !== '/concepts/glossary';
}

export default function FooterWrapper(props) {
  const {metadata} = useDoc();
  const {siteConfig} = useDocusaurusContext();
  const {isCompleted, toggleCompleted} = useStudyProgress();
  const pageUrl = `${siteConfig.url}${metadata.permalink}`;
  const title = metadata.title;
  const trackable = isTrackableLesson(metadata.permalink);
  const completed = trackable && isCompleted(metadata.permalink);

  return (
    <>
      {trackable && (
        <div className={styles.progressBar}>
          <button
            type="button"
            onClick={() => toggleCompleted(metadata.permalink)}
            className={`${styles.progressBtn} ${completed ? styles.progressBtnDone : ''}`}
            aria-pressed={completed}>
            <span className={styles.progressIcon} aria-hidden="true">
              {completed ? '✓' : '○'}
            </span>
            <span>{completed ? 'Lesson completed' : 'Mark lesson as completed'}</span>
          </button>
          <span className={styles.progressHint}>
            Saved locally in your browser
          </span>
        </div>
      )}
      <div className={styles.feedback}>
        <span className={styles.label}>Feedback on this page:</span>
        <a href={issueUrl('1-report-error.yml', '[Error]', title, pageUrl)}
           target="_blank" rel="noopener noreferrer">🐞 Report an error</a>
        <a href={issueUrl('2-suggest-improvement.yml', '[Suggestion]', title, pageUrl)}
           target="_blank" rel="noopener noreferrer">💡 Suggest an improvement</a>
        <a href={issueUrl('3-ask-question.yml', '[Question]', title, pageUrl)}
           target="_blank" rel="noopener noreferrer">❓ Ask a question</a>
      </div>
      <Footer {...props} />
    </>
  );
}
