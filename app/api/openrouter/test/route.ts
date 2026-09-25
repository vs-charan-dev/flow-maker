import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callOpenRouter, OpenRouterError } from "@/lib/openrouter";

const TestRequestSchema = z.object({
  apiKey: z.string().trim().min(1, "OpenRouter API key cannot be blank."),
  model: z.string().trim().min(1, "OpenRouter model ID cannot be blank."),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  const parseResult = TestRequestSchema.safeParse(body);
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0]?.message || "Invalid request.";
    return NextResponse.json({ ok: false, error: firstIssue }, { status: 400 });
  }

  const { apiKey, model } = parseResult.data;

  try {
    await callOpenRouter({
      apiKey,
      model,
      messages: [{ role: "user", content: "ping" }],
      maxTokens: 1,
      timeoutMs: 15000,
    });

    return NextResponse.json({
      ok: true,
      message: "Connected ✓",
    });
  } catch (err: unknown) {
    const opError = err as OpenRouterError;
    const status = opError.status || 500;
    const message = opError.message || "OpenRouter connection test failed.";

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
