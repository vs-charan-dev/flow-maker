import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callOpenRouter, extractJsonFromResponse, OpenRouterError } from "@/lib/openrouter";
import { AdaptRequestSchema, AdaptResponseSchema, MissionSchema } from "@/lib/schemas";
import { ADAPT_SYSTEM_PROMPT, buildAdaptUserPrompt, buildAdaptCorrectionPrompt } from "@/lib/prompts";

function validateAdaptSemantics(
  revisedMissions: Array<z.infer<typeof MissionSchema>>,
  expectedRemainingMinutes: number,
  completedMissionIds: Set<string>
): string | null {
  const ids = new Set<string>();
  for (const m of revisedMissions) {
    if (ids.has(m.id)) {
      return `Duplicate revised mission ID found: ${m.id}`;
    }
    if (completedMissionIds.has(m.id)) {
      return `Revised mission ID collides with completed mission ID: ${m.id}`;
    }
    ids.add(m.id);
  }

  const sumMinutes = revisedMissions.reduce((acc, m) => acc + m.minutes, 0);
  if (sumMinutes !== expectedRemainingMinutes) {
    return `Sum of revised mission minutes (${sumMinutes}) does not equal remaining minutes budget (${expectedRemainingMinutes}).`;
  }

  return null;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON in request body." }, { status: 400 });
  }

  const parseResult = AdaptRequestSchema.safeParse(body);
  if (!parseResult.success) {
    const firstMsg = parseResult.error.issues[0]?.message || "Invalid adaptation parameters.";
    return NextResponse.json({ ok: false, error: firstMsg }, { status: 400 });
  }

  const {
    apiKey,
    model,
    originalGoal,
    desiredOutcome,
    remainingMinutes,
    completedMissions,
    currentMission,
    feedback,
    profile,
    learningHistory,
  } = parseResult.data;

  const completedIds = new Set(completedMissions.map((m) => m.id));
  const userPrompt = buildAdaptUserPrompt(
    originalGoal,
    desiredOutcome,
    remainingMinutes,
    completedMissions,
    currentMission,
    feedback,
    profile,
    learningHistory
  );

  let rawContent = "";
  try {
    // Attempt 1
    const firstResponse = await callOpenRouter({
      apiKey,
      model,
      messages: [
        { role: "system", content: ADAPT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      responseFormat: { type: "json_object" },
      temperature: 0.7,
      timeoutMs: 30000,
    });
    rawContent = firstResponse.content;

    try {
      const parsedJson = extractJsonFromResponse(rawContent);
      const adaptData = AdaptResponseSchema.parse(parsedJson);
      const semanticErr = validateAdaptSemantics(adaptData.revisedMissions, remainingMinutes, completedIds);
      if (!semanticErr) {
        return NextResponse.json({ ok: true, revisedMissions: adaptData.revisedMissions });
      }
      throw new Error(semanticErr);
    } catch (parseOrValError: unknown) {
      const errMessage = parseOrValError instanceof Error ? parseOrValError.message : "Validation error";

      // Attempt 2: Exactly ONE correction retry
      const correctionPrompt = buildAdaptCorrectionPrompt(rawContent, errMessage, remainingMinutes);
      const retryResponse = await callOpenRouter({
        apiKey,
        model,
        messages: [
          { role: "system", content: ADAPT_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
          { role: "assistant", content: rawContent },
          { role: "user", content: correctionPrompt },
        ],
        responseFormat: { type: "json_object" },
        temperature: 0.5,
        timeoutMs: 30000,
      });

      const retryJson = extractJsonFromResponse(retryResponse.content);
      const retryAdaptData = AdaptResponseSchema.parse(retryJson);
      const retrySemanticErr = validateAdaptSemantics(
        retryAdaptData.revisedMissions,
        remainingMinutes,
        completedIds
      );
      if (retrySemanticErr) {
        throw new Error(retrySemanticErr);
      }

      return NextResponse.json({ ok: true, revisedMissions: retryAdaptData.revisedMissions });
    }
  } catch (err: unknown) {
    const opError = err as OpenRouterError;
    if (opError.status && opError.message) {
      return NextResponse.json({ ok: false, error: opError.message }, { status: opError.status });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to adapt remaining missions. The original plan has been kept.",
      },
      { status: 502 }
    );
  }
}
