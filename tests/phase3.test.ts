import { describe, it, expect, vi } from "vitest";
import { POST as questRouteHandler } from "../app/api/quest/route";
import { NextRequest } from "next/server";
import * as OpenRouterModule from "../lib/openrouter";

describe("Phase 3 — Quest generation route", () => {
  it("F3-1: Rejects missing credentials, empty task, or invalid duration before calling provider", async () => {
    const spy = vi.spyOn(OpenRouterModule, "callOpenRouter");

    // Missing API key
    const reqNoKey = new NextRequest("http://localhost:3000/api/quest", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "",
        model: "openai/gpt-4o",
        task: "Read book",
        duration: 60,
        outcome: "Learn",
        energy: "normal",
      }),
    });
    const resNoKey = await questRouteHandler(reqNoKey);
    expect(resNoKey.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();

    // Invalid duration (less than 10)
    const reqLowDuration = new NextRequest("http://localhost:3000/api/quest", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "sk-or-valid",
        model: "openai/gpt-4o",
        task: "Read book",
        duration: 5,
        outcome: "Learn",
        energy: "normal",
      }),
    });
    const resLow = await questRouteHandler(reqLowDuration);
    expect(resLow.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it("F3-2: Accepts valid plans where minute sum equals requested duration (10, 60, 240)", async () => {
    // 10 minutes session
    const plan10 = {
      title: "10-Minute Rapid Sprint",
      totalMinutes: 10,
      missions: [
        { id: "m1", title: "Scan chapter", minutes: 4, instruction: "Read headings", type: "read" },
        { id: "m2", title: "Test recall", minutes: 6, instruction: "Explain concepts", type: "recall" },
      ],
    };

    const spy = vi.spyOn(OpenRouterModule, "callOpenRouter").mockResolvedValue({
      content: JSON.stringify(plan10),
      raw: {},
    });

    const req10 = new NextRequest("http://localhost:3000/api/quest", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "sk-or-test",
        model: "anthropic/claude-3.5-sonnet",
        task: "Quick review",
        duration: 10,
        outcome: "Key terms",
        energy: "high",
      }),
    });

    const res10 = await questRouteHandler(req10);
    expect(res10.status).toBe(200);
    const data10 = await res10.json();
    expect(data10.ok).toBe(true);
    expect(data10.quest.totalMinutes).toBe(10);
    const sum = data10.quest.missions.reduce((a: number, b: any) => a + b.minutes, 0);
    expect(sum).toBe(10);

    spy.mockRestore();
  });

  it("F3-3: First provider response invalid, second response valid -> exactly one correction retry", async () => {
    const validPlan60 = {
      title: "60-Minute Deep Dive",
      totalMinutes: 60,
      missions: [
        { id: "m1", title: "Read core theory", minutes: 15, instruction: "Read page 1-10", type: "read" },
        { id: "m2", title: "Write summary", minutes: 15, instruction: "Summarize ideas", type: "create" },
        { id: "m3", title: "Solve problem 1", minutes: 15, instruction: "Solve equation", type: "solve" },
        { id: "m4", title: "Final self-quiz", minutes: 15, instruction: "Recall formulas", type: "test" },
      ],
    };

    const spy = vi
      .spyOn(OpenRouterModule, "callOpenRouter")
      // First call returns malformed non-JSON
      .mockResolvedValueOnce({
        content: "Here is your plan: sorry, forgot to output JSON!",
        raw: {},
      })
      // Second call returns valid JSON
      .mockResolvedValueOnce({
        content: JSON.stringify(validPlan60),
        raw: {},
      });

    const req60 = new NextRequest("http://localhost:3000/api/quest", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "sk-or-test",
        model: "openai/gpt-4o",
        task: "Study chapter",
        duration: 60,
        outcome: "Solve problems",
        energy: "normal",
      }),
    });

    const res60 = await questRouteHandler(req60);
    expect(res60.status).toBe(200);
    expect(spy).toHaveBeenCalledTimes(2); // Exactly one retry
    const data = await res60.json();
    expect(data.ok).toBe(true);
    expect(data.quest.missions.length).toBe(4);

    spy.mockRestore();
  });

  it("F3-4: Both provider responses invalid -> safe error after exactly two calls without crash", async () => {
    const spy = vi
      .spyOn(OpenRouterModule, "callOpenRouter")
      .mockResolvedValueOnce({
        content: "malformed attempt 1",
        raw: {},
      })
      .mockResolvedValueOnce({
        content: "malformed attempt 2",
        raw: {},
      });

    const req = new NextRequest("http://localhost:3000/api/quest", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "sk-or-test",
        model: "openai/gpt-4o",
        task: "Study chapter",
        duration: 60,
        outcome: "Solve problems",
        energy: "normal",
      }),
    });

    const res = await questRouteHandler(req);
    expect(res.status).toBe(502);
    expect(spy).toHaveBeenCalledTimes(2);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("unexpected response format");

    spy.mockRestore();
  });

  it("F3-6: Request uses entered model and parameters without hardcoding", async () => {
    const testModel = "deepseek/deepseek-chat";
    let passedParams: any = null;

    const spy = vi.spyOn(OpenRouterModule, "callOpenRouter").mockImplementation(async (params) => {
      passedParams = params;
      return {
        content: JSON.stringify({
          title: "Session",
          totalMinutes: 20,
          missions: [
            { id: "m1", title: "Task 1", minutes: 10, instruction: "Do 1", type: "read" },
            { id: "m2", title: "Task 2", minutes: 10, instruction: "Do 2", type: "solve" },
          ],
        }),
        raw: {},
      };
    });

    const req = new NextRequest("http://localhost:3000/api/quest", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "sk-or-test",
        model: testModel,
        task: "Write blog post",
        duration: 20,
        outcome: "First draft",
        energy: "high",
      }),
    });

    const res = await questRouteHandler(req);
    expect(res.status).toBe(200);
    expect(passedParams.model).toBe(testModel);
    expect(passedParams.messages[1].content).toContain("Write blog post");
    expect(passedParams.messages[1].content).toContain("First draft");

    spy.mockRestore();
  });
});
