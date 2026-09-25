export type EnergyLevel = "low" | "normal" | "high";
export type UnderstandingLevel = "clear" | "partial" | "stuck";

export interface UserProfile {
  goal: "learn" | "create" | "finish";
  experience: "beginner" | "some" | "confident";
  approach: "examples" | "practice" | "steps";
  pace: "short" | "steady" | "deep";
}

export interface TaskSetupData {
  task: string;
  duration: number; // 10 to 240 minutes
  outcome: string;
  energy: EnergyLevel;
}

export type MissionType =
  | "explore"
  | "learn"
  | "explain"
  | "solve"
  | "recall"
  | "create"
  | "compare"
  | "test"
  | "summarize"
  | "organize"
  | "decide"
  | "execute"
  | string;

export type MissionStatus = "pending" | "completed" | "skipped";

export interface Mission {
  id: string;
  title: string;
  minutes: number;
  instruction: string;
  type: MissionType;
  completionQuestion?: string;
}

export interface SessionMission extends Mission {
  status: MissionStatus;
  completedAt?: string;
}

export interface ActiveSession {
  id: string;
  title: string;
  totalMinutes: number;
  originalTask: string;
  desiredOutcome: string;
  energy: EnergyLevel;
  createdAt: string;
  missions: SessionMission[];
  currentMissionIndex: number;
  isComplete: boolean;
  reflection?: {
    speedFeedback?: "faster" | "same" | "slower";
    engagementRating?: number; // 1-5
    understanding?: UnderstandingLevel;
    unclearNote?: string;
  };
}

export interface SessionSummaryRecord {
  id: string;
  title: string;
  date: string;
  duration: number;
  completedMissionsCount: number;
  skippedMissionsCount: number;
  totalMissionsCount: number;
  completionPercentage: number;
  estimatedFocusedMinutes: number;
  originalTask: string;
  desiredOutcome: string;
  energy: EnergyLevel;
  speedFeedback?: "faster" | "same" | "slower";
  engagementRating?: number;
  understanding?: UnderstandingLevel;
  unclearNote?: string;
}

export interface LearningHistoryItem {
  task: string;
  outcome: string;
  understanding?: UnderstandingLevel;
  unclearNote?: string;
  completionPercentage: number;
  engagementRating?: number;
}

export type FeedbackType = "too_hard" | "bored" | "not_useful";
