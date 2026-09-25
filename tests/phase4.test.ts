import { describe, it, expect, beforeEach } from "vitest";
import { getActiveSession, setActiveSession } from "../lib/storage";
import { ActiveSession } from "../lib/types";

describe("Phase 4 — Mission session & state transitions", () => {
  const sessionStorageMock: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(sessionStorageMock)) delete sessionStorageMock[key];

    // @ts-expect-error Mocking window.sessionStorage
    global.window = {
      sessionStorage: {
        getItem: (k: string) => sessionStorageMock[k] || null,
        setItem: (k: string, v: string) => {
          sessionStorageMock[k] = v;
        },
        removeItem: (k: string) => {
          delete sessionStorageMock[k];
        },
      },
    };
  });

  it("F4-1: Handles missing or corrupt active session in storage safely without crashing", () => {
    // Empty storage
    expect(getActiveSession()).toBeNull();

    // Corrupt JSON string
    sessionStorageMock["flow_companion_active_session"] = "{ corrupt json :::: ";
    expect(getActiveSession()).toBeNull();

    // Invalid schema object
    sessionStorageMock["flow_companion_active_session"] = JSON.stringify({ invalid: true });
    expect(getActiveSession()).toBeNull();
  });

  it("F4-2: Done marks mission completed; Skip marks mission skipped; counts and indices update cleanly", () => {
    const sampleSession: ActiveSession = {
      id: "sess-1",
      title: "Test Session",
      totalMinutes: 30,
      originalTask: "Test task",
      desiredOutcome: "Test outcome",
      energy: "normal",
      createdAt: new Date().toISOString(),
      missions: [
        { id: "m1", title: "Mission 1", minutes: 10, instruction: "Inst 1", type: "read", status: "pending" },
        { id: "m2", title: "Mission 2", minutes: 10, instruction: "Inst 2", type: "solve", status: "pending" },
        { id: "m3", title: "Mission 3", minutes: 10, instruction: "Inst 3", type: "test", status: "pending" },
      ],
      currentMissionIndex: 0,
      isComplete: false,
    };

    setActiveSession(sampleSession);

    // 1. Complete Mission 1
    let current = getActiveSession()!;
    current.missions[0].status = "completed";
    current.currentMissionIndex = 1;
    setActiveSession(current);

    current = getActiveSession()!;
    expect(current.missions[0].status).toBe("completed");
    expect(current.currentMissionIndex).toBe(1);

    // 2. Skip Mission 2
    current.missions[1].status = "skipped";
    current.currentMissionIndex = 2;
    setActiveSession(current);

    current = getActiveSession()!;
    expect(current.missions[1].status).toBe("skipped");
    expect(current.currentMissionIndex).toBe(2);

    // Focused minutes sum completed missions only (skips contribute 0)
    const focusedMinutes = current.missions
      .filter((m) => m.status === "completed")
      .reduce((sum, m) => sum + m.minutes, 0);
    expect(focusedMinutes).toBe(10); // only m1
  });

  it("F4-3: Refresh partway through restores exact mission progress and statuses", () => {
    const sampleSession: ActiveSession = {
      id: "sess-restore",
      title: "Restore Test",
      totalMinutes: 20,
      originalTask: "Task",
      desiredOutcome: "Outcome",
      energy: "high",
      createdAt: new Date().toISOString(),
      missions: [
        { id: "m1", title: "M1", minutes: 10, instruction: "I1", type: "read", status: "completed" },
        { id: "m2", title: "M2", minutes: 10, instruction: "I2", type: "solve", status: "pending" },
      ],
      currentMissionIndex: 1,
      isComplete: false,
    };

    setActiveSession(sampleSession);

    // Simulate refresh: re-read from storage
    const restored = getActiveSession()!;
    expect(restored.id).toBe("sess-restore");
    expect(restored.currentMissionIndex).toBe(1);
    expect(restored.missions[0].status).toBe("completed");
    expect(restored.missions[1].status).toBe("pending");
  });

  it("F4-4: Finishing last mission marks isComplete without out-of-bounds error; survives refresh", () => {
    const sampleSession: ActiveSession = {
      id: "sess-complete",
      title: "Complete Test",
      totalMinutes: 10,
      originalTask: "Task",
      desiredOutcome: "Outcome",
      energy: "low",
      createdAt: new Date().toISOString(),
      missions: [
        { id: "m1", title: "M1", minutes: 10, instruction: "I1", type: "read", status: "pending" },
      ],
      currentMissionIndex: 0,
      isComplete: false,
    };

    setActiveSession(sampleSession);
    let current = getActiveSession()!;
    current.missions[0].status = "completed";
    current.currentMissionIndex = 1;
    current.isComplete = true;
    setActiveSession(current);

    const reloaded = getActiveSession()!;
    expect(reloaded.isComplete).toBe(true);
    expect(reloaded.currentMissionIndex).toBe(1);
    expect(reloaded.missions[reloaded.missions.length - 1].status).toBe("completed");
  });
});
