import { z } from "zod";

export const EnergySchema = z.enum(["low", "normal", "high"]);

export const UserProfileSchema = z.object({
  goal: z.enum(["learn", "create", "finish"]),
  experience: z.enum(["beginner", "some", "confident"]),
  approach: z.enum(["examples", "practice", "steps"]),
  pace: z.enum(["short", "steady", "deep"]),
});

export const LearningHistorySchema = z.array(z.object({
  task: z.string().max(500),
  outcome: z.string().max(500),
  understanding: z.enum(["clear", "partial", "stuck"]).optional(),
  unclearNote: z.string().max(300).optional(),
  completionPercentage: z.number().min(0).max(100),
  engagementRating: z.number().int().min(1).max(5).optional(),
})).max(10);

export const TaskSetupSchema = z.object({
  task: z.string().trim().min(1, "Please enter what you need to do."),
  duration: z
    .number({ invalid_type_error: "Duration must be a number." })
    .int("Duration must be a whole number.")
    .min(10, "Duration must be at least 10 minutes.")
    .max(240, "Duration cannot exceed 240 minutes."),
  outcome: z.string().trim().min(1, "Please enter what you want to achieve."),
  energy: EnergySchema.default("normal"),
});

export const QuestRequestSchema = z.object({
  apiKey: z.string().trim().min(1, "OpenRouter API key is required."),
  model: z.string().trim().min(1, "OpenRouter model ID is required."),
  task: z.string().trim().min(1, "Task description is required."),
  duration: z.number().int().min(10, "Duration must be at least 10 minutes.").max(240, "Duration cannot exceed 240 minutes."),
  outcome: z.string().trim().min(1, "Desired outcome is required."),
  energy: EnergySchema.default("normal"),
  profile: UserProfileSchema.optional(),
  learningHistory: LearningHistorySchema.optional(),
});

export const MissionSchema = z.object({
  id: z.string().min(1, "Mission ID cannot be empty"),
  title: z.string().min(1, "Mission title cannot be empty"),
  minutes: z.number().int("Minutes must be an integer").min(1, "Mission duration must be at least 1 minute"),
  instruction: z.string().min(1, "Instruction cannot be empty"),
  type: z.string().min(1, "Mission type cannot be empty"),
  completionQuestion: z.string().optional(),
});

export const QuestSchema = z.object({
  title: z.string().min(1, "Quest title cannot be empty"),
  totalMinutes: z.number().int().min(10).max(240),
  missions: z.array(MissionSchema).min(1, "At least one mission is required"),
});

export const AdaptRequestSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  model: z.string().min(1, "Model ID is required"),
  originalGoal: z.string().min(1, "Original goal is required"),
  desiredOutcome: z.string().min(1, "Desired outcome is required"),
  remainingMinutes: z.number().int().min(1, "Remaining minutes must be positive"),
  completedMissions: z.array(MissionSchema),
  currentMission: MissionSchema,
  feedback: z.enum(["too_hard", "bored", "not_useful"]),
  profile: UserProfileSchema.optional(),
  learningHistory: LearningHistorySchema.optional(),
});

export const AdaptResponseSchema = z.object({
  revisedMissions: z.array(MissionSchema).min(1, "At least one revised mission is required"),
});
