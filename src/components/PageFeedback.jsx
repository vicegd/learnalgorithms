import React, {useEffect, useRef, useState} from 'react';
import {normalizePermalink} from '@site/src/utils/studyProgress';
import styles from './PageFeedback.module.css';

const API_URL = 'https://api.learnalgorithms.dev/feedback';
const CLIENT_KEY = 'learnalgorithms:feedback-client:v1';
const MAX_COMMENT = 500;

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

export default function PageFeedback({permalink}) {
  const page = normalizePermalink(permalink);
  const enteredAt = useRef(Date.now());
  const [choice, setChoice] = useState(null); // true | false | null
  const [comment, setComment] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    enteredAt.current = Date.now();
    setChoice(null);
    setComment('');
    setWebsite('');
    setSubmitting(false);
    setStatusMessage('');
    setErrorMessage('');
  }, [page]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (choice === null || submitting) return;
    setSubmitting(true);
    setErrorMessage('');

    const payload = {
      page,
      helpful: choice,
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
      if (resp.status === 201 || resp.status === 202) {
        setStatusMessage('Thanks for your feedback! It helps improve the course.');
      } else if (resp.status === 200) {
        setStatusMessage('You already sent feedback for this lesson today. Thanks!');
      } else {
        setErrorMessage('Could not send feedback right now. Please try again later.');
      }
    } catch {
      setErrorMessage('Could not reach the feedback service. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  }

  if (statusMessage) {
    return (
      <div className={styles.box} role="status" aria-live="polite">
        <p className={styles.status}>{statusMessage}</p>
      </div>
    );
  }

  return (
    <section className={styles.box} aria-label="Lesson feedback">
      <div className={styles.row}>
        <span className={styles.prompt}>Was this lesson helpful?</span>
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => setChoice(true)}
            className={`${styles.voteBtn} ${choice === true ? styles.voteBtnActive : ''}`}
            aria-pressed={choice === true}>
            <span aria-hidden="true">👍</span> Yes
          </button>
          <button
            type="button"
            onClick={() => setChoice(false)}
            className={`${styles.voteBtn} ${choice === false ? styles.voteBtnActive : ''}`}
            aria-pressed={choice === false}>
            <span aria-hidden="true">👎</span> No
          </button>
        </div>
      </div>

      {choice !== null && (
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
          <textarea
            className={styles.textarea}
            maxLength={MAX_COMMENT}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              choice
                ? 'Optional: what helped you most in this lesson?'
                : 'Optional: what was unclear or could be improved?'
            }
            aria-label="Optional anonymous comment"
          />
          <div className={styles.formFooter}>
            <span className={styles.charCount}>
              Anonymous · {comment.length}/{MAX_COMMENT}
            </span>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Sending…' : 'Send feedback'}
            </button>
          </div>
          {errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}
        </form>
      )}
    </section>
  );
}
