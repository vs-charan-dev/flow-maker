import { describe, expect, it } from "vitest";
import { getLearningSuggestions, learningHistoryFromSessions } from "../lib/personalization";
import { SessionSummaryRecord } from "../lib/types";

const makeSession = (overrides: Partial<SessionSummaryRecord>): SessionSummaryRecord => ({
  id: "first",
  title: "Fractions",
  date: "2026-01-01T00:00:00.000Z",
  duration: 30,
  completedMissionsCount: 3,
  skippedMissionsCount: 0,
  totalMissionsCount: 3,
  completionPercentage: 100,
  estimatedFocusedMinutes: 30,
  originalTask: "Fractions",
  desiredOutcome: "Solve fraction problems",
  energy: "normal",
  ...overrides,
});

describe("Learning personalization", () => {
  it("prioritizes an unclear topic and offers four distinct next sessions", () => {
    const sessions = [
      makeSession({ id: "latest", originalTask: "Geometry", understanding: "clear" }),
      makeSession({ id: "stuck", originalTask: "Fractions", understanding: "stuck", unclearNote: "common denominators" }),
    ];
    const suggestions = getLearningSuggestions(sessions);
    expect(suggestions).toHaveLength(4);
    expect(suggestions[0].title).toContain("Fractions");
    expect(suggestions[0].setup.task).toContain("common denominators");
    expect(suggestions[3].title).toContain("Geometry");
  });

  it("uses reported understanding in the bounded learning history", () => {
    const sessions = Array.from({ length: 12 }, (_, index) => makeSession({ id: String(index), understanding: index === 0 ? "stuck" : "clear" }));
    const history = learningHistoryFromSessions(sessions);
    expect(history).toHaveLength(10);
    expect(history[0].understanding).toBe("stuck");
    expect(history[0].completionPercentage).toBe(100);
  });
});
