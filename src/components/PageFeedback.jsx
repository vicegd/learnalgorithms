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
  const [voteSaved, setVoteSaved] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [comment, setComment] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [commentSent, setCommentSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    enteredAt.current = Date.now();
    setChoice(null);
    setVoteSaved(false);
    setAlreadyVoted(false);
    setComment('');
    setWebsite('');
    setSubmitting(false);
    setCommentSent(false);
    setErrorMessage('');
  }, [page]);

  async function sendPayload(helpfulVal, commentText) {
    const payload = {
      page,
      helpful: helpfulVal,
      comment: commentText || null,
      elapsed: Math.max(0, Date.now() - enteredAt.current),
      website,
    };
    const client = getClientId();
    if (client) payload.client = client;

    return fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
      mode: 'cors',
    });
  }

  async function handleVote(helpfulVal) {
    if (submitting || choice === helpfulVal) return;
    const wasVoted = voteSaved;
    setChoice(helpfulVal);
    setSubmitting(true);
    setErrorMessage('');
    try {
      const resp = await sendPayload(helpfulVal, null);
      if (resp.status === 201 || resp.status === 202) {
        setVoteSaved(true);
        setAlreadyVoted(false);
      } else if (resp.status === 200) {
        setVoteSaved(true);
        setAlreadyVoted(!wasVoted);
      } else {
        setErrorMessage('Could not record your vote right now. Please try again later.');
      }
    } catch {
      setErrorMessage('Could not reach the feedback service. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendComment(e) {
    e.preventDefault();
    const cleaned = comment.trim();
    if (choice === null || !cleaned || submitting) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const resp = await sendPayload(choice, cleaned);
      if (resp.status === 201 || resp.status === 202) {
        setCommentSent(true);
      } else if (resp.status === 200) {
        setCommentSent(true);
      } else {
        setErrorMessage('Could not send comment right now. Please try again later.');
      }
    } catch {
      setErrorMessage('Could not reach the feedback service. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  }

  if (commentSent) {
    return (
      <div className={styles.box} role="status" aria-live="polite">
        <p className={styles.status}>Thanks! Your vote and comment have been saved.</p>
      </div>
    );
  }

  return (
    <section className={styles.box} aria-label="Lesson feedback">
      <div className={styles.row}>
        <span className={styles.prompt}>
          {voteSaved
            ? alreadyVoted
              ? 'You already voted for this lesson today — thanks!'
              : '✓ Vote recorded! Want to add an optional comment?'
            : 'Was this lesson helpful?'}
        </span>
        <div className={styles.actions}>
          <button
            type="button"
            disabled={submitting || choice === true}
            onClick={() => handleVote(true)}
            className={`${styles.voteBtn} ${choice === true ? styles.voteBtnActive : ''}`}
            aria-pressed={choice === true}>
            <span aria-hidden="true">👍</span> Yes
          </button>
          <button
            type="button"
            disabled={submitting || choice === false}
            onClick={() => handleVote(false)}
            className={`${styles.voteBtn} ${choice === false ? styles.voteBtnActive : ''}`}
            aria-pressed={choice === false}>
            <span aria-hidden="true">👎</span> No
          </button>
        </div>
      </div>

      {voteSaved && (
        <form className={styles.form} onSubmit={handleSendComment}>
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
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || comment.trim().length === 0}>
              {submitting ? 'Sending…' : 'Send comment'}
            </button>
          </div>
          {errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}
        </form>
      )}
      {!voteSaved && errorMessage && <p className={styles.error} role="alert">{errorMessage}</p>}
    </section>
  );
}
