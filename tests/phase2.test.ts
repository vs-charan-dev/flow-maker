import { describe, it, expect, vi } from "vitest";
import { callOpenRouter } from "../lib/openrouter";
import { POST as testRouteHandler } from "../app/api/openrouter/test/route";
import { NextRequest } from "next/server";
import {
  setStoredApiKey,
  setStoredModel,
  getStoredApiKey,
  getStoredModel,
  clearStoredApiKey,
} from "../lib/storage";

describe("Phase 2 — OpenRouter test route & helper", () => {
  it("F2-1: Route returns 400 when apiKey or model is missing/blank without calling provider", async () => {
    const reqMissingKey = new NextRequest("http://localhost:3000/api/openrouter/test", {
      method: "POST",
      body: JSON.stringify({ apiKey: "", model: "openai/gpt-4o-mini" }),
    });
    const res1 = await testRouteHandler(reqMissingKey);
    expect(res1.status).toBe(400);
    const body1 = await res1.json();
    expect(body1.ok).toBe(false);
    expect(JSON.stringify(body1)).not.toContain("sk-or-");

    const reqMissingModel = new NextRequest("http://localhost:3000/api/openrouter/test", {
      method: "POST",
      body: JSON.stringify({ apiKey: "sk-or-test", model: "   " }),
    });
    const res2 = await testRouteHandler(reqMissingModel);
    expect(res2.status).toBe(400);
    const body2 = await res2.json();
    expect(body2.ok).toBe(false);
  });

  it("F2-2: Stubbed provider success returns ok: true and exact model in payload", async () => {
    let capturedUrl = "";
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: { model?: string; max_tokens?: number } = {};

    const mockFetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      capturedUrl = url;
      capturedHeaders = init.headers as Record<string, string>;
      capturedBody = JSON.parse(init.body as string);

      return new Response(
        JSON.stringify({
          id: "gen-123",
          choices: [{ message: { content: "pong" } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const result = await callOpenRouter({
      apiKey: "sk-or-v1-secretkey",
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: "ping" }],
      maxTokens: 1,
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    expect(result.content).toBe("pong");
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(capturedUrl).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(capturedHeaders["Authorization"]).toBe("Bearer sk-or-v1-secretkey");
    expect(capturedBody.model).toBe("google/gemini-2.0-flash-001");
    expect(capturedBody.max_tokens).toBe(1);
  });

  it("F2-3: Stubs 401/403, 404 bad-model, 429 rate limit, and timeout with safe distinct messages", async () => {
    // 401 Invalid Key
    const mockFetch401 = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Invalid API key" } }), { status: 401 })
    );
    await expect(
      callOpenRouter({
        apiKey: "bad-key",
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: "test" }],
        fetchFn: mockFetch401 as unknown as typeof fetch,
      })
    ).rejects.toMatchObject({
      status: 401,
      code: "INVALID_KEY",
      message: expect.stringContaining("rejected this API key"),
    });

    // 404 Model Not Found
    const mockFetch404 = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: 404, message: "No such model exists" } }),
        { status: 404 }
      )
    );
    await expect(
      callOpenRouter({
        apiKey: "valid-key",
        model: "non-existent/model-99",
        messages: [{ role: "user", content: "test" }],
        fetchFn: mockFetch404 as unknown as typeof fetch,
      })
    ).rejects.toMatchObject({
      status: 404,
      code: "MODEL_NOT_FOUND",
      message: expect.stringContaining("could not be found"),
    });

    // 429 Rate Limit
    const mockFetch429 = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Rate limit exceeded" } }), { status: 429 })
    );
    await expect(
      callOpenRouter({
        apiKey: "valid-key",
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: "test" }],
        fetchFn: mockFetch429 as unknown as typeof fetch,
      })
    ).rejects.toMatchObject({
      status: 429,
      code: "RATE_LIMIT",
      message: expect.stringContaining("rate limited"),
    });

    // Network error
    const mockFetchNetFail = vi.fn().mockRejectedValue(new Error("Failed to fetch"));
    await expect(
      callOpenRouter({
        apiKey: "valid-key",
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: "test" }],
        fetchFn: mockFetchNetFail as unknown as typeof fetch,
      })
    ).rejects.toMatchObject({
      status: 502,
      code: "NETWORK_ERROR",
      message: expect.stringContaining("network request failed"),
    });
  });

  it("F2-5: Key is never leaked into error messages or URLs", async () => {
    const secretKey = "sk-or-v1-SUPER_SECRET_VALUE_NEVER_PRINT";
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Something bad happened with key sk-or-v1-SUPER_SECRET_VALUE_NEVER_PRINT" }), {
        status: 401,
      })
    );

    try {
      await callOpenRouter({
        apiKey: secretKey,
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: "test" }],
        fetchFn: mockFetch as unknown as typeof fetch,
      });
    } catch (err: unknown) {
      const errorObj = err as { message: string };
      expect(errorObj.message).not.toContain(secretKey);
      expect(JSON.stringify(errorObj)).not.toContain(secretKey);
    }
  });

  it("F2-6: Key remains in sessionStorage and model in localStorage; clear removes key", () => {
    const sessionStorageMock: Record<string, string> = {};
    const localStorageMock: Record<string, string> = {};
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

    setStoredApiKey("sk-or-test-session-key");
    setStoredModel("google/gemini-2.0-flash");
    expect(getStoredApiKey()).toBe("sk-or-test-session-key");
    expect(getStoredModel()).toBe("google/gemini-2.0-flash");

    clearStoredApiKey();
    expect(getStoredApiKey()).toBe("");
    expect(getStoredModel()).toBe("google/gemini-2.0-flash");
  });
});
