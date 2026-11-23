import React, {useRef, useState} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './survey.module.css';

const API_URL = 'https://api.learnalgorithms.dev/survey';
const CLIENT_KEY = 'learnalgorithms:feedback-client:v1';
const MAX_COMMENT = 500;

const QUESTIONS = [
  {
    key: 'clarity',
    label: '1. Clarity of explanations and examples',
    hint: 'Are the lessons, proofs, and worked examples easy to follow?',
  },
  {
    key: 'usefulness',
    label: '2. Usefulness for studying the course',
    hint: 'Does learnalgorithms.dev help you prepare for classes, labs, and exams?',
  },
  {
    key: 'tools',
    label: '3. Interactive study tools',
    hint: 'Big-O Cheat Sheet, Knowledge Graph, progress tracker, search, and audio narration.',
  },
  {
    key: 'overall',
    label: '4. Overall satisfaction with the platform',
    hint: 'Your general rating of learnalgorithms.dev.',
  },
];

function getClientId() {
  if (typeof window === 'undefined') return null;
  try {
    let id = window.localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c === 'x' ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            });
      window.localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export default function CourseSurveyPage() {
  const enteredAt = useRef(Date.now());
  const [scores, setScores] = useState({clarity: 0, usefulness: 0, tools: 0, overall: 0});
  const [comment, setComment] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const allRated =
    scores.clarity >= 1 && scores.usefulness >= 1 && scores.tools >= 1 && scores.overall >= 1;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!allRated || submitting) return;
    setSubmitting(true);
    setError('');

    const payload = {
      ...scores,
      comment: comment.trim() || null,
      elapsed: Math.max(0, Date.now() - enteredAt.current),
      website,
    };
    const client = getClientId();
    if (client) payload.client = client;

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
        mode: 'cors',
      });
      if (resp.status === 201 || resp.status === 202 || resp.status === 200) {
        setSubmitted(true);
      } else {
        setError('Could not save your response right now. Please try again later.');
      }
    } catch {
      setError('Could not reach the survey service. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout
      title="Course Satisfaction Survey"
      description="Anonymous 1-minute student satisfaction survey for learnalgorithms.dev.">
      <main className={styles.main}>
        <p className={styles.eyebrow}>Anonymous Student Feedback</p>
        <h1 className={styles.title}>Course Satisfaction Survey</h1>
        <p className={styles.intro}>
          Takes less than a minute. Completely anonymous (no account, no IP stored) — your ratings
          help evaluate and improve <strong>learnalgorithms.dev</strong> for future cohorts.
        </p>

        {submitted ? (
          <div className={styles.thanksBox} role="status" aria-live="polite">
            <h2>Thank you for your feedback!</h2>
            <p>Your anonymous satisfaction ratings have been recorded.</p>
            <Link to="/" className={styles.backLink}>
              ← Back to the course
            </Link>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className={styles.honeypot}
            />

            {QUESTIONS.map((q) => (
              <fieldset key={q.key} className={styles.question}>
                <legend className={styles.qLabel}>{q.label}</legend>
                <p className={styles.qHint}>{q.hint}</p>
                <div className={styles.scaleRow} role="radiogroup" aria-label={q.label}>
                  <span className={styles.scaleEnd}>1 (Poor)</span>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={scores[q.key] === n}
                      onClick={() => setScores((prev) => ({...prev, [q.key]: n}))}
                      className={`${styles.scoreBtn} ${
                        scores[q.key] === n ? styles.scoreBtnActive : ''
                      }`}>
                      {n}
                    </button>
                  ))}
                  <span className={styles.scaleEnd}>5 (Excellent)</span>
                </div>
              </fieldset>
            ))}

            <div className={styles.question}>
              <label htmlFor="survey-comment" className={styles.qLabel}>
                5. Optional comment (suggestions, favorite feature, or what to improve)
              </label>
              <textarea
                id="survey-comment"
                className={styles.textarea}
                maxLength={MAX_COMMENT}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional anonymous comment (please do not include personal data)..."
              />
              <div className={styles.charCount}>
                Anonymous · {comment.length}/{MAX_COMMENT}
              </div>
            </div>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={!allRated || submitting}>
              {submitting ? 'Submitting…' : 'Submit anonymous survey'}
            </button>
          </form>
        )}
      </main>
    </Layout>
  );
}
