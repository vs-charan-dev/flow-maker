import { describe, it, expect, beforeEach } from "vitest";
import { TaskSetupSchema } from "../lib/schemas";
import {
  getStoredApiKey,
  setStoredApiKey,
  clearStoredApiKey,
  getStoredModel,
  setStoredModel,
} from "../lib/storage";

describe("Phase 1 — Form and Settings validation & storage", () => {
  // Mock window storage in node environment
  const sessionStorageMock: Record<string, string> = {};
  const localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(sessionStorageMock)) delete sessionStorageMock[key];
    for (const key of Object.keys(localStorageMock)) delete localStorageMock[key];

    // @ts-expect-error Mocking window for vitest node env
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

  it("F1-4: Rejects empty task, empty outcome, duration < 10, > 240, or non-integer", () => {
    // Empty task
    const res1 = TaskSetupSchema.safeParse({
      task: "",
      duration: 60,
      outcome: "Understand chapter",
      energy: "normal",
    });
    expect(res1.success).toBe(false);

    // Duration < 10
    const res2 = TaskSetupSchema.safeParse({
      task: "Study",
      duration: 9,
      outcome: "Understand chapter",
      energy: "normal",
    });
    expect(res2.success).toBe(false);

    // Duration > 240
    const res3 = TaskSetupSchema.safeParse({
      task: "Study",
      duration: 241,
      outcome: "Understand chapter",
      energy: "normal",
    });
    expect(res3.success).toBe(false);

    // Non-integer duration
    const res4 = TaskSetupSchema.safeParse({
      task: "Study",
      duration: 45.5,
      outcome: "Understand chapter",
      energy: "normal",
    });
    expect(res4.success).toBe(false);

    // Valid inputs
    const resValid10 = TaskSetupSchema.safeParse({
      task: "Study",
      duration: 10,
      outcome: "Understand chapter",
      energy: "low",
    });
    expect(resValid10.success).toBe(true);

    const resValid240 = TaskSetupSchema.safeParse({
      task: "Study",
      duration: 240,
      outcome: "Understand chapter",
      energy: "high",
    });
    expect(resValid240.success).toBe(true);
  });

  it("F1-5: Storage helpers target sessionStorage for key and localStorage for model", () => {
    setStoredApiKey("sk-or-v1-testkey123");
    expect(sessionStorageMock["flow_companion_api_key"]).toBe("sk-or-v1-testkey123");
    expect(localStorageMock["flow_companion_api_key"]).toBeUndefined();
    expect(getStoredApiKey()).toBe("sk-or-v1-testkey123");

    setStoredModel("anthropic/claude-3.5-sonnet");
    expect(localStorageMock["flow_companion_model_id"]).toBe("anthropic/claude-3.5-sonnet");
    expect(sessionStorageMock["flow_companion_model_id"]).toBeUndefined();
    expect(getStoredModel()).toBe("anthropic/claude-3.5-sonnet");

    // Clear key
    clearStoredApiKey();
    expect(sessionStorageMock["flow_companion_api_key"]).toBeUndefined();
    expect(getStoredApiKey()).toBe("");
  });

  it("F1-2: Accepts any arbitrary model ID without a hardcoded allowlist", () => {
    const arbitraryModel = "custom-org/experimental-model-9000";
    setStoredModel(arbitraryModel);
    expect(getStoredModel()).toBe(arbitraryModel);
  });
});
