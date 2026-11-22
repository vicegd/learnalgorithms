import React, {useEffect, useRef, useState} from 'react';
import styles from './ListenButton.module.css';

const RATES = [1, 1.25, 1.5];

function extractReadableText() {
  if (typeof document === 'undefined') return '';
  const article = document.querySelector('article .markdown') || document.querySelector('article');
  if (!article) return '';
  const clone = article.cloneNode(true);
  // Skip code blocks, math markup noise, nav buttons, and collapsed solutions
  clone.querySelectorAll('pre, code, .katex-mathml, .katex-html, svg, button, details').forEach((el) => el.remove());
  return (clone.textContent || '').replace(/\s+/g, ' ').trim();
}

export default function ListenButton() {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | playing | paused
  const [rateIdx, setRateIdx] = useState(0);
  const textRef = useRef('');

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported) return null;

  function speakFromStart(rate) {
    const synth = window.speechSynthesis;
    synth.cancel();
    const text = extractReadableText();
    if (!text) return;
    textRef.current = text;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = rate;
    utter.onend = () => setStatus('idle');
    utter.onerror = () => setStatus('idle');
    setStatus('playing');
    synth.speak(utter);
  }

  function handleTogglePlay() {
    const synth = window.speechSynthesis;
    if (status === 'idle') {
      speakFromStart(RATES[rateIdx]);
    } else if (status === 'playing') {
      synth.pause();
      setStatus('paused');
    } else if (status === 'paused') {
      synth.resume();
      setStatus('playing');
    }
  }

  function handleStop() {
    window.speechSynthesis.cancel();
    setStatus('idle');
  }

  function handleCycleRate() {
    const nextIdx = (rateIdx + 1) % RATES.length;
    setRateIdx(nextIdx);
    if (status !== 'idle') {
      speakFromStart(RATES[nextIdx]);
    }
  }

  return (
    <div className={styles.bar} role="region" aria-label="Audio narration controls">
      <button
        type="button"
        className={styles.btn}
        onClick={handleTogglePlay}
        aria-pressed={status === 'playing'}>
        {status === 'playing' ? '⏸ Pause audio' : status === 'paused' ? '▶ Resume audio' : '🔊 Listen to lesson'}
      </button>
      {status !== 'idle' && (
        <>
          <button type="button" className={styles.btnSecondary} onClick={handleCycleRate} title="Playback speed">
            {RATES[rateIdx]}×
          </button>
          <button type="button" className={styles.btnSecondary} onClick={handleStop}>
            ⏹ Stop
          </button>
        </>
      )}
    </div>
  );
}
