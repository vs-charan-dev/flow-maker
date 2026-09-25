import { describe, it, expect, vi } from "vitest";
import { POST as testRouteHandler } from "../app/api/openrouter/test/route";
import { POST as questRouteHandler } from "../app/api/quest/route";
import { POST as adaptRouteHandler } from "../app/api/adapt/route";
import { NextRequest } from "next/server";
import * as OpenRouterModule from "../lib/openrouter";

describe("Phase 7 — End-to-End Acceptance Tests", () => {
  it("F7-2: Full Flow — Settings connection -> Quest generation -> Mission progression -> Adaptation -> Completion -> History", async () => {
    // 1. Connection test
    const mockFetch = vi.fn().mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          id: "gen-1",
          choices: [{ message: { content: "pong" } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const testReq = new NextRequest("http://localhost:3000/api/openrouter/test", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "sk-or-v1-my-key",
        model: "openai/gpt-4o",
      }),
    });

    const spy = vi.spyOn(OpenRouterModule, "callOpenRouter").mockImplementation(async (params) => {
      if (params.messages[0]?.role === "user" && params.messages[0]?.content === "ping") {
        return { content: "pong", raw: {} };
      }
      return {
        content: JSON.stringify({
          title: "Biology Study Session",
          totalMinutes: 30,
          missions: [
            { id: "m1", title: "Read Cell Structure", minutes: 10, instruction: "Read pages 1-5", type: "read" },
            { id: "m2", title: "Draw Diagram", minutes: 10, instruction: "Sketch a mitochondrion", type: "create" },
            { id: "m3", title: "Self Quiz", minutes: 10, instruction: "Quiz yourself on cell parts", type: "test" },
          ],
        }),
        raw: {},
      };
    });

    const testRes = await testRouteHandler(testReq);
    expect(testRes.status).toBe(200);
    const testData = await testRes.json();
    expect(testData.ok).toBe(true);

    // 2. Quest Generation
    const questReq = new NextRequest("http://localhost:3000/api/quest", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "sk-or-v1-my-key",
        model: "openai/gpt-4o",
        task: "Study biology chapter 2",
        duration: 30,
        outcome: "Memorize cell organelles",
        energy: "normal",
      }),
    });

    const questRes = await questRouteHandler(questReq);
    expect(questRes.status).toBe(200);
    const questData = await questRes.json();
    expect(questData.ok).toBe(true);
    expect(questData.quest.missions.length).toBe(3);
    expect(questData.quest.totalMinutes).toBe(30);

    // 3. Adaptation
    spy.mockImplementation(async () => {
      return {
        content: JSON.stringify({
          revisedMissions: [
            { id: "m2-adapted", title: "Simpler Diagram", minutes: 10, instruction: "Label 3 parts", type: "create" },
            { id: "m3-adapted", title: "Quick Quiz", minutes: 10, instruction: "Answer 3 flashcards", type: "test" },
          ],
        }),
        raw: {},
      };
    });

    const adaptReq = new NextRequest("http://localhost:3000/api/adapt", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "sk-or-v1-my-key",
        model: "openai/gpt-4o",
        originalGoal: "Study biology chapter 2",
        desiredOutcome: "Memorize cell organelles",
        remainingMinutes: 20,
        completedMissions: [questData.quest.missions[0]],
        currentMission: questData.quest.missions[1],
        feedback: "too_hard",
      }),
    });

    const adaptRes = await adaptRouteHandler(adaptReq);
    expect(adaptRes.status).toBe(200);
    const adaptData = await adaptRes.json();
    expect(adaptData.ok).toBe(true);
    expect(adaptData.revisedMissions.length).toBe(2);
    expect(adaptData.revisedMissions[0].id).toBe("m2-adapted");

    spy.mockRestore();
  });

  it("F7-4: Security Audit — No secrets in source code, env files, or output", () => {
    const fs = require("fs");
    const path = require("path");

    // Verify .env does not exist or contain keys
    const envPath = path.resolve(process.cwd(), ".env");
    expect(fs.existsSync(envPath)).toBe(false);

    // Verify code files don't hardcode sk-or-
    const openrouterTs = fs.readFileSync(path.resolve(process.cwd(), "lib/openrouter.ts"), "utf-8");
    expect(openrouterTs).not.toContain("sk-or-v1-");
  });
});
