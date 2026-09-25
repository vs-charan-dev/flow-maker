export interface OpenRouterCallParams {
  apiKey: string;
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  responseFormat?: { type: "json_object" };
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

export interface OpenRouterError {
  status: number;
  code: "INVALID_KEY" | "MODEL_NOT_FOUND" | "RATE_LIMIT" | "NETWORK_ERROR" | "TIMEOUT" | "PROVIDER_ERROR";
  message: string;
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Makes a server-side request to OpenRouter.
 * Never logs or persists secrets.
 */
export async function callOpenRouter({
  apiKey,
  model,
  messages,
  responseFormat,
  maxTokens,
  temperature,
  timeoutMs = 25000,
  fetchFn = fetch,
}: OpenRouterCallParams): Promise<{ content: string; raw: unknown }> {
  if (!apiKey || !apiKey.trim()) {
    throw {
      status: 400,
      code: "INVALID_KEY",
      message: "OpenRouter API key is required.",
    } as OpenRouterError;
  }

  if (!model || !model.trim()) {
    throw {
      status: 400,
      code: "MODEL_NOT_FOUND",
      message: "OpenRouter model ID is required.",
    } as OpenRouterError;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const payload: Record<string, unknown> = {
    model: model.trim(),
    messages,
  };

  if (responseFormat) {
    payload.response_format = responseFormat;
  }

  if (typeof maxTokens === "number") {
    payload.max_tokens = maxTokens;
  }

  if (typeof temperature === "number") {
    payload.temperature = temperature;
  }

  let response: Response;
  try {
    response = await fetchFn(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Flow Companion",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw {
        status: 504,
        code: "TIMEOUT",
        message: "The request to OpenRouter timed out. Please try again.",
      } as OpenRouterError;
    }
    throw {
      status: 502,
      code: "NETWORK_ERROR",
      message: "OpenRouter network request failed. Check your connection.",
    } as OpenRouterError;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorDetails: { message?: string; code?: unknown } = {};
    try {
      const errBody = await response.json();
      if (errBody?.error && typeof errBody.error === "object") {
        errorDetails = errBody.error;
      }
    } catch {
      // ignore response json parsing failure on error
    }

    if (response.status === 401 || response.status === 403) {
      throw {
        status: 401,
        code: "INVALID_KEY",
        message: "OpenRouter rejected this API key. Please check your key in Settings.",
      } as OpenRouterError;
    }

    if (
      response.status === 404 ||
      errorDetails.code === 404 ||
      (typeof errorDetails.message === "string" &&
        /not found|no such model|unknown model|invalid model/i.test(errorDetails.message))
    ) {
      throw {
        status: 404,
        code: "MODEL_NOT_FOUND",
        message: "The selected OpenRouter model could not be found or is inaccessible with this key.",
      } as OpenRouterError;
    }

    if (response.status === 429) {
      throw {
        status: 429,
        code: "RATE_LIMIT",
        message: "The selected model is currently rate limited. Try again shortly or choose another model.",
      } as OpenRouterError;
    }

    throw {
      status: response.status >= 500 ? 502 : 400,
      code: "PROVIDER_ERROR",
      message: "OpenRouter request failed. Please check the model ID or try again.",
    } as OpenRouterError;
  }

  let data: { choices?: Array<{ message?: { content?: string } }> } | null = null;
  try {
    data = await response.json();
  } catch {
    throw {
      status: 502,
      code: "PROVIDER_ERROR",
      message: "OpenRouter returned an unparseable response.",
    } as OpenRouterError;
  }

  const choice = data?.choices?.[0];
  const messageContent = choice?.message?.content;

  return {
    content: typeof messageContent === "string" ? messageContent : "",
    raw: data,
  };
}

/**
 * Extracts JSON object or array from LLM text responses,
 * handling markdown code fences (```json ... ```) or freeform text.
 */
export function extractJsonFromResponse(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Empty AI response");
  }

  // Check for ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    return JSON.parse(fenceMatch[1].trim());
  }

  // If text starts with '{' or '[', attempt direct parse
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }

  // Try finding the first '{' and last '}'
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  throw new Error("No JSON structure found in response");
}
