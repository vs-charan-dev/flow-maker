import { LearningHistoryItem, SessionSummaryRecord, TaskSetupData } from "./types";

export interface LearningSuggestion {
  id: string;
  title: string;
  reason: string;
  setup: TaskSetupData;
}

export function learningHistoryFromSessions(sessions: SessionSummaryRecord[]): LearningHistoryItem[] {
  return sessions.slice(0, 10).map((session) => ({
    task: session.originalTask.slice(0, 500),
    outcome: session.desiredOutcome.slice(0, 500),
    understanding: session.understanding,
    unclearNote: session.unclearNote?.slice(0, 300),
    completionPercentage: session.completionPercentage,
    engagementRating: session.engagementRating,
  }));
}

export function getLearningSuggestions(sessions: SessionSummaryRecord[]): LearningSuggestion[] {
  if (sessions.length === 0) return [];
  const priority = sessions.find((session) => session.understanding === "stuck" || session.understanding === "partial") ?? sessions[0];
  const topic = priority.originalTask.trim();
  const note = priority.unclearNote?.trim();
  const reason = note ? `You mentioned: “${note}”` : priority.understanding === "stuck" ? "You said this did not click yet." : "Based on your recent session.";
  const duration = Math.min(45, Math.max(15, priority.duration));
  const base = { duration, energy: priority.energy };
  const suggestions: LearningSuggestion[] = [
    { id: "basics", title: `Revisit the basics: ${topic}`, reason, setup: { ...base, task: `Teach me the foundations of ${topic}${note ? `, especially ${note}` : ""}. Start from what I need to know first.`, outcome: `Explain the core ideas of ${topic} in my own words.` } },
    { id: "example", title: `Work through an example: ${topic}`, reason: "See the idea applied before trying it alone.", setup: { ...base, task: `Show me a clear worked example related to ${topic}${note ? ` and ${note}` : ""}, then guide me through a similar one.`, outcome: `Understand how to apply ${topic} to a concrete example.` } },
    { id: "practice", title: `Practice: ${topic}`, reason: "A small exercise can reveal what still needs explanation.", setup: { ...base, task: `Give me a few progressively harder practice exercises for ${topic}, with feedback after each one.`, outcome: `Solve one exercise about ${topic} without help.` } },
  ];
  const other = sessions.find((session) => session.id !== priority.id && session.originalTask.trim().toLowerCase() !== topic.toLowerCase());
  if (other) {
    suggestions.push({ id: "other", title: `Continue: ${other.originalTask}`, reason: "Pick up another recent topic.", setup: { duration: Math.min(45, Math.max(15, other.duration)), energy: other.energy, task: `Continue learning ${other.originalTask}. Start with a brief recap, then take the next useful step.`, outcome: other.desiredOutcome } });
  } else {
    suggestions.push({ id: "recall", title: `Check what you remember: ${topic}`, reason: "A quick recall check shows what is solid and what needs another pass.", setup: { ...base, task: `Quiz me on ${topic}, identify any gaps, and explain what I missed.`, outcome: `Identify and correct gaps in my understanding of ${topic}.` } });
  }
  return suggestions;
}
