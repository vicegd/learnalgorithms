import React from 'react';
import Link from '@docusaurus/Link';
import Footer from '@theme-original/DocItem/Footer';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {usePluginData} from '@docusaurus/useGlobalData';
import {normalizePermalink, useStudyProgress} from '@site/src/utils/studyProgress';
import {trackEvent} from '@site/src/telemetry';
import PageFeedback from '@site/src/components/PageFeedback';
import SurveyPrompt from '@site/src/components/SurveyPrompt';
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
  const siteData = usePluginData('docusaurus-plugin-site-data');
  const {isCompleted, toggleCompleted} = useStudyProgress();
  const pageUrl = `${siteConfig.url}${metadata.permalink}`;
  const title = metadata.title;
  const trackable = isTrackableLesson(metadata.permalink);
  const completed = trackable && isCompleted(metadata.permalink);
  const currentNorm = normalizePermalink(metadata.permalink);
  const conceptMeta = (siteData?.concepts || []).find(
    (c) => normalizePermalink(c.url) === currentNorm,
  );
  const relatedLessons = conceptMeta?.relatedLessons || [];

  return (
    <>
      {trackable && (
        <div className={styles.progressBar}>
          <button
            type="button"
            onClick={() => {
              toggleCompleted(metadata.permalink);
              trackEvent(
                completed ? 'lesson_uncomplete' : 'lesson_complete',
                null,
                metadata.permalink,
              );
            }}
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
      {trackable && <SurveyPrompt />}
      {relatedLessons.length > 0 && (
        <aside className={styles.relatedBox} aria-label="Related lessons by content similarity">
          <div className={styles.relatedTitle}>Related lessons (content similarity · TF-IDF)</div>
          <div className={styles.relatedList}>
            {relatedLessons.map((rel) => (
              <Link key={rel.url} to={rel.url} className={styles.relatedPill}>
                <span>{rel.title}</span>
                <span className={styles.relatedScore}>{Math.round(rel.score * 100)}%</span>
              </Link>
            ))}
          </div>
        </aside>
      )}
      {trackable && <PageFeedback permalink={metadata.permalink} />}
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
