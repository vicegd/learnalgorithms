import React, {useEffect, useRef, useState} from 'react';
import styles from './ListenButton.module.css';

const RATES = [1, 1.25, 1.5];

/**
 * Convert common LaTeX math expressions from KaTeX annotations into natural spoken English
 * so audio narration reads asymptotic bounds and formulas smoothly instead of skipping them.
 */
export function latexToSpeech(tex) {
  let s = String(tex || '').trim();
  if (!s) return '';
  s = s
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
    .replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1')
    .replace(/([a-zA-Z0-9)])!/g, '$1 factorial')
    .replace(/\\log_2\s*\(([^)]+)\)/g, 'log base 2 of $1')
    .replace(/\\log_2/g, 'log base 2')
    .replace(/\\log\s*\(([^)]+)\)/g, 'log of $1')
    .replace(/\\log/g, 'log')
    .replace(/\\ln\s*\(([^)]+)\)/g, 'natural log of $1')
    .replace(/\\ln/g, 'natural log')
    .replace(/\\Theta\s*\(([^)]+)\)/g, 'theta of $1')
    .replace(/\\Theta/g, 'theta')
    .replace(/\\Omega\s*\(([^)]+)\)/g, 'omega of $1')
    .replace(/\\Omega/g, 'omega')
    .replace(/\bO\s*\(([^)]+)\)/g, 'big O of $1')
    .replace(/\\alpha/g, 'alpha')
    .replace(/\\beta/g, 'beta')
    .replace(/\\varepsilon|\\epsilon/g, 'epsilon')
    .replace(/\\infty/g, 'infinity')
    .replace(/\\sum/g, 'sum')
    .replace(/\\prod/g, 'product')
    .replace(/\\leq|\\le/g, ' less than or equal to ')
    .replace(/\\geq|\\ge/g, ' greater than or equal to ')
    .replace(/\\neq|\\ne/g, ' not equal to ')
    .replace(/\\approx/g, ' approximately ')
    .replace(/\\equiv/g, ' equivalent to ')
    .replace(/\\to|\\rightarrow/g, ' to ')
    .replace(/\\cdot|\\times/g, ' times ')
    .replace(/\\in\b/g, ' is in ')
    .replace(/\\subset/g, ' is a subset of ')
    .replace(/\\lfloor([^\\]+)\\rfloor/g, 'floor of $1')
    .replace(/\\lceil([^\\]+)\\rceil/g, 'ceiling of $1')
    .replace(/\^2\b|\^\{2\}/g, ' squared')
    .replace(/\^3\b|\^\{3\}/g, ' cubed')
    .replace(/\^\{([^}]+)\}/g, ' to the power of $1')
    .replace(/\^([a-zA-Z0-9])/g, ' to the power of $1')
    .replace(/_\{([^}]+)\}/g, ' sub $1')
    .replace(/_([a-zA-Z0-9])/g, ' sub $1')
    .replace(/=/g, ' equals ')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s;
}

function verbalizeUnicodeMath(text) {
  return String(text || '')
    .replace(/([a-zA-Z0-9)])!/g, '$1 factorial')
    .replace(/∈/g, ' is in ')
    .replace(/Θ\s*\(([^)]+)\)/g, 'theta of $1')
    .replace(/Θ/g, 'theta')
    .replace(/Ω\s*\(([^)]+)\)/g, 'omega of $1')
    .replace(/Ω/g, 'omega')
    .replace(/≤/g, ' less than or equal to ')
    .replace(/≥/g, ' greater than or equal to ')
    .replace(/≠/g, ' not equal to ')
    .replace(/≈/g, ' approximately ')
    .replace(/×|·/g, ' times ')
    .replace(/∞/g, ' infinity ')
    .replace(/→/g, ' to ')
    .replace(/²/g, ' squared')
    .replace(/³/g, ' cubed')
    .replace(/\blog\s*\(([^)]+)\)/g, 'log of $1')
    .replace(/\bO\s*\(([^)]+)\)/g, 'big O of $1')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractReadableText() {
  if (typeof document === 'undefined') return '';
  const article = document.querySelector('article .markdown') || document.querySelector('article');
  if (!article) return '';
  const clone = article.cloneNode(true);
  // Verbalize KaTeX formulas from their LaTeX <annotation> before stripping KaTeX markup
  clone.querySelectorAll('.katex').forEach((el) => {
    const ann = el.querySelector('annotation[encoding="application/x-tex"]');
    const spoken = ann ? latexToSpeech(ann.textContent) : '';
    const span = document.createElement('span');
    span.textContent = spoken ? ` ${spoken} ` : ' ';
    el.replaceWith(span);
  });
  // Skip multi-line code blocks, diagrams, buttons, and collapsed solutions (keep inline <code>)
  clone.querySelectorAll('pre, svg, button, details').forEach((el) => el.remove());
  return verbalizeUnicodeMath(clone.textContent || '');
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
