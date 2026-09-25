import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/quest/route";
import * as OpenRouter from "../lib/openrouter";

describe("Profile-aware session generation", () => {
  it("passes validated profile preferences into the mission prompt", async () => {
    let prompt = "";
    const spy = vi.spyOn(OpenRouter, "callOpenRouter").mockImplementation(async (params) => {
      prompt = params.messages[1].content;
      return {
        content: JSON.stringify({
          title: "Learn fractions",
          totalMinutes: 10,
          missions: [{ id: "m1", title: "Try fractions", minutes: 10, instruction: "Work through an example", type: "practice" }],
        }),
        raw: {},
      };
    });
    try {
      const response = await POST(new NextRequest("http://localhost/api/quest", {
        method: "POST",
        body: JSON.stringify({
          apiKey: "test-key",
          model: "test-model",
          task: "Learn fractions",
          duration: 10,
          outcome: "Solve a fraction problem",
          energy: "normal",
          profile: { goal: "learn", experience: "beginner", approach: "practice", pace: "short" },
          learningHistory: [{ task: "Fractions", outcome: "Solve alone", understanding: "stuck", unclearNote: "denominators", completionPercentage: 100 }],
        }),
      }));
      expect(response.status).toBe(200);
      expect(prompt).toContain('"experience":"beginner"');
      expect(prompt).toContain('"approach":"practice"');
      expect(prompt).toContain("Solve a fraction problem");
      expect(prompt).toContain('"understanding":"stuck"');
      expect(prompt).toContain("completing missions means the user mastered");
    } finally {
      spy.mockRestore();
    }
  });
});
