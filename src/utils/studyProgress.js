import {useCallback, useEffect, useState} from 'react';

const STORAGE_KEY = 'learnalgorithms:completed-lessons:v1';
const CHANGE_EVENT = 'learnalgorithms:progress-changed';

export function normalizePermalink(permalink) {
  if (!permalink) return '';
  const withoutHash = permalink.split('#')[0];
  return withoutHash.length > 1 && withoutHash.endsWith('/')
    ? withoutHash.slice(0, -1)
    : withoutHash;
}

export function readCompletedSet() {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map(normalizePermalink).filter(Boolean));
  } catch {
    return new Set();
  }
}

function writeCompletedSet(set) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export function useStudyProgress() {
  const [completed, setCompleted] = useState(() => new Set());

  useEffect(() => {
    setCompleted(readCompletedSet());

    const sync = () => setCompleted(readCompletedSet());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const isCompleted = useCallback(
    (permalink) => completed.has(normalizePermalink(permalink)),
    [completed],
  );

  const toggleCompleted = useCallback((permalink) => {
    const key = normalizePermalink(permalink);
    if (!key) return;
    const next = readCompletedSet();
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    writeCompletedSet(next);
    setCompleted(next);
  }, []);

  const resetProgress = useCallback(() => {
    writeCompletedSet(new Set());
    setCompleted(new Set());
  }, []);

  return {
    completed,
    isCompleted,
    toggleCompleted,
    resetProgress,
  };
}
