import { describe, it, expect, vi } from "vitest";
import { POST as adaptRouteHandler } from "../app/api/adapt/route";
import { NextRequest } from "next/server";
import * as OpenRouterModule from "../lib/openrouter";
describe("Phase 5 — Adaptive feedback route", () => {
  it("F5-1: Accepts too_hard, bored, and not_useful feedback with full context", async () => {
    for (const feedback of ["too_hard", "bored", "not_useful"] as const) {
      let capturedPrompt = "";
      const spy = vi.spyOn(OpenRouterModule, "callOpenRouter").mockImplementation(async (params) => {
        capturedPrompt = params.messages[1].content;
        return {
          content: JSON.stringify({
            revisedMissions: [
              { id: "rev-1", title: "Adapted step", minutes: 20, instruction: "Do this simpler", type: "learn" },
            ],
          }),
          raw: {},
        };
      });

      const req = new NextRequest("http://localhost:3000/api/adapt", {
        method: "POST",
        body: JSON.stringify({
          apiKey: "sk-or-test",
          model: "openai/gpt-4o",
          originalGoal: "Master organic chemistry",
          desiredOutcome: "Pass midterm",
          remainingMinutes: 20,
          completedMissions: [
            { id: "m1", title: "Read basics", minutes: 10, instruction: "Read", type: "read" },
          ],
          currentMission: { id: "m2", title: "Solve synthesis", minutes: 20, instruction: "Solve", type: "solve" },
          feedback,
        }),
      });

      const res = await adaptRouteHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.revisedMissions.length).toBe(1);
      expect(data.revisedMissions[0].minutes).toBe(20);
      expect(capturedPrompt).toContain(feedback);
      expect(capturedPrompt).toContain("Master organic chemistry");
      expect(capturedPrompt).toContain("Pass midterm");

      spy.mockRestore();
    }
  });

  it("F5-2: Valid replacement missions match exact remaining budget and unique IDs", async () => {
    const revised = [
      { id: "rev-1", title: "Micro step 1", minutes: 15, instruction: "Step 1", type: "explain" },
      { id: "rev-2", title: "Micro step 2", minutes: 15, instruction: "Step 2", type: "solve" },
    ];

    const spy = vi.spyOn(OpenRouterModule, "callOpenRouter").mockResolvedValue({
      content: JSON.stringify({ revisedMissions: revised }),
      raw: {},
    });

    const req = new NextRequest("http://localhost:3000/api/adapt", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "sk-or-test",
        model: "openai/gpt-4o",
        originalGoal: "Build portfolio website",
        desiredOutcome: "Deploy to production",
        remainingMinutes: 30,
        completedMissions: [
          { id: "m1", title: "Setup repo", minutes: 10, instruction: "Init", type: "execute" },
        ],
        currentMission: { id: "m2", title: "Design homepage", minutes: 30, instruction: "Design", type: "create" },
        feedback: "too_hard",
      }),
    });

    const res = await adaptRouteHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    const sum = data.revisedMissions.reduce((acc: number, m: any) => acc + m.minutes, 0);
    expect(sum).toBe(30); // Exactly matches remainingMinutes budget

    spy.mockRestore();
  });

  it("F5-3: ID collision with completed missions or wrong sum triggers retry, then fails safely", async () => {
    const spy = vi
      .spyOn(OpenRouterModule, "callOpenRouter")
      // Attempt 1: ID collision with completed mission m1
      .mockResolvedValueOnce({
        content: JSON.stringify({
          revisedMissions: [
            { id: "m1", title: "Collision", minutes: 20, instruction: "Bad", type: "read" },
          ],
        }),
        raw: {},
      })
      // Attempt 2: Sum is 25 instead of 20
      .mockResolvedValueOnce({
        content: JSON.stringify({
          revisedMissions: [
            { id: "rev-2", title: "Wrong sum", minutes: 25, instruction: "Bad", type: "read" },
          ],
        }),
        raw: {},
      });

    const req = new NextRequest("http://localhost:3000/api/adapt", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "sk-or-test",
        model: "openai/gpt-4o",
        originalGoal: "Read paper",
        desiredOutcome: "Understand proofs",
        remainingMinutes: 20,
        completedMissions: [
          { id: "m1", title: "Abstract", minutes: 10, instruction: "Read", type: "read" },
        ],
        currentMission: { id: "m2", title: "Proof", minutes: 20, instruction: "Proof", type: "solve" },
        feedback: "too_hard",
      }),
    });

    const res = await adaptRouteHandler(req);
    expect(res.status).toBe(502);
    expect(spy).toHaveBeenCalledTimes(2);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("Failed to adapt");

    spy.mockRestore();
  });
});
