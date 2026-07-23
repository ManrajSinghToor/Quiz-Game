import { SUBJECTS_DATA, getSubjectByName } from "./subjectsData";

/**
 * Get formatted local date string (YYYY-MM-DD)
 */
export const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Get human-readable date string (e.g. "Thursday, July 23")
 */
export const getFormattedTodayDate = () => {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
};

/**
 * Deterministic hash function for date string to pick a daily subject
 */
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Get today's featured Daily Challenge subject
 */
export const getTodayDailySubject = () => {
  const dateStr = getTodayDateString();
  const hash = simpleHash(dateStr);
  const index = hash % SUBJECTS_DATA.length;
  return SUBJECTS_DATA[index];
};

/**
 * Compute time remaining until midnight local time (returns HH:MM:SS)
 */
export const getTimeUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  const diffMs = midnight - now;
  if (diffMs <= 0) return { hours: 0, minutes: 0, seconds: 0, formatted: "00:00:00" };

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const formatted = [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0")
  ].join(":");

  return { hours, minutes, seconds, formatted };
};

/**
 * Check if a specific user has completed today's daily challenge
 * @param {object|string} user - User object or user ID/email string
 */
export const getDailyChallengeCompletionState = (user) => {
  const dateStr = getTodayDateString();

  // 1. Check MongoDB User record first if user object passed
  if (user && typeof user === "object") {
    if (user.lastDailyQuizDate === dateStr && user.lastDailyQuizResult) {
      return user.lastDailyQuizResult;
    }
  }

  // 2. Check user-scoped localStorage key
  const userKey = typeof user === "object" ? (user.id || user.email) : user;
  if (!userKey) return null;

  const key = `daily_challenge_result_${userKey}_${dateStr}`;
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
};

/**
 * Save completion result for today's daily challenge for a specific user
 * @param {number} score 
 * @param {number} accuracy 
 * @param {number} timeTaken 
 * @param {string} userKey 
 */
export const saveDailyChallengeCompletionState = (score, accuracy, timeTaken, userKey) => {
  if (!userKey) return;
  const dateStr = getTodayDateString();
  const key = `daily_challenge_result_${userKey}_${dateStr}`;
  const record = {
    date: dateStr,
    userKey,
    score,
    accuracy,
    timeTaken,
    completedAt: new Date().toISOString()
  };
  localStorage.setItem(key, JSON.stringify(record));
};
