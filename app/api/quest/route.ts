import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callOpenRouter, extractJsonFromResponse, OpenRouterError } from "@/lib/openrouter";
import { QuestSchema, QuestRequestSchema } from "@/lib/schemas";
import { QUEST_SYSTEM_PROMPT, buildQuestUserPrompt, buildCorrectionPrompt } from "@/lib/prompts";

function validateQuestSemantics(quest: z.infer<typeof QuestSchema>, expectedDuration: number): string | null {
  const ids = new Set<string>();
  for (const m of quest.missions) {
    if (ids.has(m.id)) {
      return `Duplicate mission ID found: ${m.id}`;
    }
    ids.add(m.id);
  }

  const sumMinutes = quest.missions.reduce((acc, m) => acc + m.minutes, 0);
  if (sumMinutes !== expectedDuration) {
    return `Sum of mission minutes (${sumMinutes}) does not equal requested duration (${expectedDuration}).`;
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

  const parseResult = QuestRequestSchema.safeParse(body);
  if (!parseResult.success) {
    const firstMsg = parseResult.error.issues[0]?.message || "Invalid quest parameters.";
    return NextResponse.json({ ok: false, error: firstMsg }, { status: 400 });
  }

  const { apiKey, model, task, duration, outcome, energy, profile, learningHistory } = parseResult.data;
  const userPrompt = buildQuestUserPrompt(task, duration, outcome, energy, profile, learningHistory);

  let rawContent = "";
  try {
    // Attempt 1
    const firstResponse = await callOpenRouter({
      apiKey,
      model,
      messages: [
        { role: "system", content: QUEST_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      responseFormat: { type: "json_object" },
      temperature: 0.7,
      timeoutMs: 30000,
    });
    rawContent = firstResponse.content;

    try {
      const parsedJson = extractJsonFromResponse(rawContent);
      const quest = QuestSchema.parse(parsedJson);
      const semanticErr = validateQuestSemantics(quest, duration);
      if (!semanticErr) {
        return NextResponse.json({ ok: true, quest });
      }
      throw new Error(semanticErr);
    } catch (parseOrValidationError: unknown) {
      const errMessage = parseOrValidationError instanceof Error ? parseOrValidationError.message : "Validation error";

      // Attempt 2: Exactly ONE correction retry
      const correctionPrompt = buildCorrectionPrompt(rawContent, errMessage, duration);
      const retryResponse = await callOpenRouter({
        apiKey,
        model,
        messages: [
          { role: "system", content: QUEST_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
          { role: "assistant", content: rawContent },
          { role: "user", content: correctionPrompt },
        ],
        responseFormat: { type: "json_object" },
        temperature: 0.5,
        timeoutMs: 30000,
      });

      const retryJson = extractJsonFromResponse(retryResponse.content);
      const retryQuest = QuestSchema.parse(retryJson);
      const retrySemanticErr = validateQuestSemantics(retryQuest, duration);
      if (retrySemanticErr) {
        throw new Error(retrySemanticErr);
      }

      return NextResponse.json({ ok: true, quest: retryQuest });
    }
  } catch (err: unknown) {
    const opError = err as OpenRouterError;
    if (opError.status && opError.message) {
      return NextResponse.json({ ok: false, error: opError.message }, { status: opError.status });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "The model returned an unexpected response format. Try again or choose another model in Settings.",
      },
      { status: 502 }
    );
  }
}
