import { EnergyLevel, Mission } from "./types";

export const QUEST_SYSTEM_PROMPT = `You are an AI session designer for AI Flow Companion.
Your job is to transform one long work session into a sequence of short, engaging, and useful missions.
The missions must help the user accomplish their real goal.
Do not add meaningless gamification.
Do not waste time with motivational filler.

Use variety where appropriate:
- learning
- recall
- solving
- explaining
- creating
- executing
- checking progress

Rules:
1. The sum of all mission minutes MUST EQUAL EXACTLY the requested total duration.
2. Aim for 5 to 10 missions (usually 3–15 minutes each). For short durations (10–14 min), 2–4 missions are acceptable. For long sessions (>150 min), up to 10 missions with longer chunks are acceptable.
3. Each mission must have a unique string id (e.g. "m1", "m2", etc.).
4. Each mission must have a clear title, positive integer minutes, actionable instruction, type, and an optional completionQuestion.
5. Return ONLY a valid JSON object matching this schema:
{
  "title": string,
  "totalMinutes": number,
  "missions": [
    {
      "id": string,
      "title": string,
      "minutes": number,
      "instruction": string,
      "type": string,
      "completionQuestion": string (optional)
    }
  ]
}`;

export function buildQuestUserPrompt(
  task: string,
  duration: number,
  outcome: string,
  energy: EnergyLevel
): string {
  return `Task: ${task}
Total Duration: ${duration} minutes
Desired Outcome: ${outcome}
Current Energy Level: ${energy}

Design a mission sequence that sums to EXACTLY ${duration} minutes. Return ONLY JSON.`;
}

export function buildCorrectionPrompt(
  rawResponse: string,
  validationError: string,
  expectedDuration: number
): string {
  return `Your previous JSON response was invalid or did not meet the required schema/duration constraint.
Error details: ${validationError}
Expected totalMinutes: ${expectedDuration}
Previous response:
${rawResponse.slice(0, 1000)}

Please fix the error and output ONLY the corrected, valid JSON object. Ensure the sum of mission minutes equals EXACTLY ${expectedDuration}.`;
}

export const ADAPT_SYSTEM_PROMPT = `You are adapting an active work session for AI Flow Companion.
The user has given feedback about the current mission.

Preserve completed work.
Modify ONLY the current and remaining missions.

Feedback guidance:
- "too_hard": Make the next step smaller, clearer, and more manageable.
- "bored": Introduce a different interaction style, challenge, self-quiz, or active creation.
- "not_useful": Make the mission more directly connected to the desired outcome.

Rules:
1. Do not add motivational filler.
2. The sum of minutes of the revised missions MUST EQUAL EXACTLY the remainingMinutes budget.
3. Every revised mission must have a unique string ID that does not collide with completed mission IDs.
4. Return ONLY a valid JSON object matching this schema:
{
  "revisedMissions": [
    {
      "id": string,
      "title": string,
      "minutes": number,
      "instruction": string,
      "type": string,
      "completionQuestion": string (optional)
    }
  ]
}`;

export function buildAdaptUserPrompt(
  originalGoal: string,
  desiredOutcome: string,
  remainingMinutes: number,
  completedMissions: Mission[],
  currentMission: Mission,
  feedback: "too_hard" | "bored" | "not_useful"
): string {
  return `Original Goal: ${originalGoal}
Desired Outcome: ${desiredOutcome}
Remaining Minute Budget: ${remainingMinutes} minutes
Current Mission: ${JSON.stringify(currentMission)}
Completed Missions: ${JSON.stringify(completedMissions.map((m) => ({ id: m.id, title: m.title })))}
User Feedback on Current Mission: "${feedback}"

Provide revised missions replacing the current and remaining pending work. The sum of minutes for revisedMissions MUST EQUAL EXACTLY ${remainingMinutes}. Return ONLY JSON.`;
}

export function buildAdaptCorrectionPrompt(
  rawResponse: string,
  validationError: string,
  expectedRemainingMinutes: number
): string {
  return `Your previous adaptation JSON was invalid.
Error: ${validationError}
Required total minutes for revisedMissions: ${expectedRemainingMinutes}
Previous response:
${rawResponse.slice(0, 1000)}

Please fix the error and output ONLY valid JSON matching { "revisedMissions": [...] } where mission minutes sum to EXACTLY ${expectedRemainingMinutes}.`;
}
