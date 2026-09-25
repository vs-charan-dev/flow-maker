import { ActiveSession, SessionSummaryRecord } from "./types";

const API_KEY_STORAGE_KEY = "flow_companion_api_key";
const MODEL_STORAGE_KEY = "flow_companion_model_id";
const ACTIVE_SESSION_STORAGE_KEY = "flow_companion_active_session";
const RECENT_SESSIONS_STORAGE_KEY = "flow_companion_recent_sessions";

const DEFAULT_MODEL = "openai/gpt-4o-mini";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * API Key is stored ONLY in sessionStorage (per PRD & decision in PHASES.md).
 * Disappears when browser tab/session closes. Never stored server-side.
 */
export function getStoredApiKey(): string {
  if (!isBrowser()) return "";
  try {
    return window.sessionStorage.getItem(API_KEY_STORAGE_KEY) || "";
  } catch (err) {
    console.warn("Unable to read apiKey from sessionStorage", err);
    return "";
  }
}

export function setStoredApiKey(key: string): void {
  if (!isBrowser()) return;
  try {
    if (!key.trim()) {
      window.sessionStorage.removeItem(API_KEY_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    }
  } catch (err) {
    console.warn("Unable to write apiKey to sessionStorage", err);
  }
}

export function clearStoredApiKey(): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch (err) {
    console.warn("Unable to clear apiKey from sessionStorage", err);
  }
}

/**
 * Model ID is stored in localStorage so user's preferred model persists across visits.
 */
export function getStoredModel(): string {
  if (!isBrowser()) return DEFAULT_MODEL;
  try {
    const model = window.localStorage.getItem(MODEL_STORAGE_KEY);
    return model && model.trim() ? model.trim() : DEFAULT_MODEL;
  } catch (err) {
    console.warn("Unable to read model from localStorage", err);
    return DEFAULT_MODEL;
  }
}

export function setStoredModel(model: string): void {
  if (!isBrowser()) return;
  try {
    if (!model.trim()) {
      window.localStorage.removeItem(MODEL_STORAGE_KEY);
    } else {
      window.localStorage.setItem(MODEL_STORAGE_KEY, model.trim());
    }
  } catch (err) {
    console.warn("Unable to write model to localStorage", err);
  }
}

/**
 * Active session is stored in sessionStorage to survive page refreshes.
 */
export function getActiveSession(): ActiveSession | null {
  if (!isBrowser()) return null;
  try {
    const data = window.sessionStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (!parsed || !Array.isArray(parsed.missions) || typeof parsed.currentMissionIndex !== "number") {
      return null;
    }
    return parsed as ActiveSession;
  } catch (err) {
    console.warn("Unable to read active session or corrupted JSON in sessionStorage", err);
    return null;
  }
}

export function setActiveSession(session: ActiveSession | null): void {
  if (!isBrowser()) return;
  try {
    if (!session) {
      window.sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  } catch (err) {
    console.warn("Unable to write active session to sessionStorage", err);
  }
}

/**
 * Recent completed sessions stored in localStorage (max 10).
 */
export function getRecentSessions(): SessionSummaryRecord[] {
  if (!isBrowser()) return [];
  try {
    const data = window.localStorage.getItem(RECENT_SESSIONS_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed as SessionSummaryRecord[];
  } catch (err) {
    console.warn("Unable to read recent sessions from localStorage", err);
    return [];
  }
}

export function saveCompletedSession(summary: SessionSummaryRecord): void {
  if (!isBrowser()) return;
  try {
    const current = getRecentSessions();
    // Avoid duplicating session if already exists with same id
    const filtered = current.filter((s) => s.id !== summary.id);
    const updated = [summary, ...filtered].slice(0, 10);
    window.localStorage.setItem(RECENT_SESSIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Unable to save completed session to localStorage", err);
  }
}

export function updateRecentSessionReflection(
  sessionId: string,
  speedFeedback?: "faster" | "same" | "slower",
  engagementRating?: number
): void {
  if (!isBrowser()) return;
  try {
    const current = getRecentSessions();
    const updated = current.map((s) => {
      if (s.id === sessionId) {
        return { ...s, speedFeedback, engagementRating };
      }
      return s;
    });
    window.localStorage.setItem(RECENT_SESSIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Unable to update session reflection in localStorage", err);
  }
}
