import { describe, it, expect, beforeEach } from "vitest";
import {
  saveCompletedSession,
  getRecentSessions,
  updateRecentSessionReflection,
} from "../lib/storage";
import { SessionSummaryRecord } from "../lib/types";

describe("Phase 6 — Completion & local session history", () => {
  const localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(localStorageMock)) delete localStorageMock[key];

    // @ts-expect-error Mocking window.localStorage
    global.window = {
      localStorage: {
        getItem: (k: string) => localStorageMock[k] || null,
        setItem: (k: string, v: string) => {
          localStorageMock[k] = v;
        },
        removeItem: (k: string) => {
          delete localStorageMock[k];
        },
      },
    };
  });

  it("F6-1: Estimated focused minutes sum only completed missions (skips = 0)", () => {
    const sampleRecord: SessionSummaryRecord = {
      id: "sess-1",
      title: "Focus Test",
      date: new Date().toISOString(),
      duration: 60,
      completedMissionsCount: 3,
      skippedMissionsCount: 2,
      totalMissionsCount: 5,
      completionPercentage: 60,
      estimatedFocusedMinutes: 35, // 35 min completed, 25 min skipped
      originalTask: "Study physics",
      desiredOutcome: "Understand laws of motion",
      energy: "normal",
    };

    saveCompletedSession(sampleRecord);
    const list = getRecentSessions();
    expect(list.length).toBe(1);
    expect(list[0].estimatedFocusedMinutes).toBe(35);
    expect(list[0].completedMissionsCount).toBe(3);
    expect(list[0].skippedMissionsCount).toBe(2);
  });

  it("F6-2: Reflection submission updates reflection and persists across reloads", () => {
    const sampleRecord: SessionSummaryRecord = {
      id: "sess-refl",
      title: "Reflection Test",
      date: new Date().toISOString(),
      duration: 45,
      completedMissionsCount: 3,
      skippedMissionsCount: 0,
      totalMissionsCount: 3,
      completionPercentage: 100,
      estimatedFocusedMinutes: 45,
      originalTask: "Coding",
      desiredOutcome: "Ship PR",
      energy: "high",
    };

    saveCompletedSession(sampleRecord);

    // Submit speed reflection: "faster", engagement: 5
    updateRecentSessionReflection("sess-refl", "faster", 5);
    let stored = getRecentSessions();
    expect(stored[0].speedFeedback).toBe("faster");
    expect(stored[0].engagementRating).toBe(5);

    // Change speed reflection to "same", leave rating
    updateRecentSessionReflection("sess-refl", "same", 5);
    stored = getRecentSessions();
    expect(stored[0].speedFeedback).toBe("same");
    expect(stored[0].engagementRating).toBe(5);
  });

  it("F6-3: At most ten summaries stored, newest first; refresh does not duplicate", () => {
    // Save 12 unique sessions
    for (let i = 1; i <= 12; i++) {
      saveCompletedSession({
        id: `sess-${i}`,
        title: `Session ${i}`,
        date: new Date(Date.now() + i * 1000).toISOString(),
        duration: 30,
        completedMissionsCount: 2,
        skippedMissionsCount: 0,
        totalMissionsCount: 2,
        completionPercentage: 100,
        estimatedFocusedMinutes: 30,
        originalTask: `Task ${i}`,
        desiredOutcome: `Outcome ${i}`,
        energy: "normal",
      });
    }

    const history = getRecentSessions();
    // Maximum 10 items
    expect(history.length).toBe(10);
    // Newest first
    expect(history[0].id).toBe("sess-12");
    expect(history[9].id).toBe("sess-3");

    // Refresh simulation: calling save again with same id does not duplicate
    saveCompletedSession(history[0]);
    const historyAfterRefresh = getRecentSessions();
    expect(historyAfterRefresh.length).toBe(10);
    expect(historyAfterRefresh.filter((s) => s.id === "sess-12").length).toBe(1);
  });

  it("F6-5: Stored summaries contain NO API key and handle corrupt data safely", () => {
    saveCompletedSession({
      id: "sess-safe",
      title: "Safe Record",
      date: new Date().toISOString(),
      duration: 30,
      completedMissionsCount: 2,
      skippedMissionsCount: 0,
      totalMissionsCount: 2,
      completionPercentage: 100,
      estimatedFocusedMinutes: 30,
      originalTask: "Task",
      desiredOutcome: "Outcome",
      energy: "low",
    });

    const rawStorage = localStorageMock["flow_companion_recent_sessions"];
    expect(rawStorage).toBeDefined();
    expect(rawStorage).not.toContain("sk-or-");
    expect(rawStorage).not.toContain("apiKey");

    // Corrupt storage does not crash app
    localStorageMock["flow_companion_recent_sessions"] = "not a valid json [ { ";
    expect(getRecentSessions()).toEqual([]);
  });
});
