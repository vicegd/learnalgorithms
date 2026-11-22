import {useCallback, useEffect, useState} from 'react';

const STORAGE_KEY = 'learnalgorithms:completed-lessons:v1';
const DAYS_KEY = 'learnalgorithms:study-days:v1';
const CHANGE_EVENT = 'learnalgorithms:progress-changed';

export function normalizePermalink(permalink) {
  if (!permalink) return '';
  const withoutHash = permalink.split('#')[0];
  return withoutHash.length > 1 && withoutHash.endsWith('/')
    ? withoutHash.slice(0, -1)
    : withoutHash;
}

function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeStreak(daysList, referenceIso = todayIso()) {
  if (!Array.isArray(daysList) || daysList.length === 0) return 0;
  const set = new Set(daysList);
  const ref = new Date(`${referenceIso}T00:00:00`);
  const format = (dt) => {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Start counting from today if active today, otherwise from yesterday
  if (!set.has(format(ref))) {
    ref.setDate(ref.getDate() - 1);
    if (!set.has(format(ref))) return 0;
  }

  let streak = 0;
  while (set.has(format(ref))) {
    streak += 1;
    ref.setDate(ref.getDate() - 1);
  }
  return streak;
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

function readStudyDays() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DAYS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((d) => typeof d === 'string') : [];
  } catch {
    return [];
  }
}

function writeState(completedSet, studyDays = null) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedSet]));
    if (studyDays !== null) {
      window.localStorage.setItem(DAYS_KEY, JSON.stringify([...new Set(studyDays)]));
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export function useStudyProgress() {
  const [completed, setCompleted] = useState(() => new Set());
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const sync = () => {
      setCompleted(readCompletedSet());
      setStreak(computeStreak(readStudyDays()));
    };
    sync();

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
    let days = readStudyDays();
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
      days = [...days, todayIso()];
    }
    writeState(next, days);
    setCompleted(next);
    setStreak(computeStreak(days));
  }, []);

  const resetProgress = useCallback(() => {
    writeState(new Set(), []);
    setCompleted(new Set());
    setStreak(0);
  }, []);

  return {
    completed,
    streak,
    isCompleted,
    toggleCompleted,
    resetProgress,
  };
}
