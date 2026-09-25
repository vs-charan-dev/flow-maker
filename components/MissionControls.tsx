"use client";
import React from "react";
import { Check, FastForward, Sparkles, AlertTriangle, HelpCircle } from "lucide-react";
import { FeedbackType } from "@/lib/types";

interface MissionControlsProps {
  onDone: () => void;
  onSkip: () => void;
  onFeedback?: (feedback: FeedbackType) => void;
  isAdapting?: boolean;
  phase?: number;
}

export default function MissionControls({
  onDone,
  onSkip,
  onFeedback,
  isAdapting = false,
  phase = 4,
}: MissionControlsProps) {
  const isAdaptEnabled = phase >= 5 && !!onFeedback;

  return (
    <div className="w-full space-y-4">
      {/* Primary Action Button: DONE */}
      <button
        type="button"
        onClick={onDone}
        disabled={isAdapting}
        className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-lg transition shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center gap-2.5 disabled:opacity-50"
        aria-label="Mark mission as done and proceed"
      >
        <Check className="w-5 h-5 stroke-[2.5]" />
        <span>Done</span>
      </button>

      {/* Secondary Controls: Feedback + Skip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Too Hard */}
        <button
          type="button"
          onClick={() => isAdaptEnabled && onFeedback?.("too_hard")}
          disabled={!isAdaptEnabled || isAdapting}
          className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
          title={!isAdaptEnabled ? "Adaptation enabled in Phase 5" : "Break into smaller, easier steps"}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Too Hard</span>
        </button>

        {/* I'm Bored */}
        <button
          type="button"
          onClick={() => isAdaptEnabled && onFeedback?.("bored")}
          disabled={!isAdaptEnabled || isAdapting}
          className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
          title={!isAdaptEnabled ? "Adaptation enabled in Phase 5" : "Change format or challenge style"}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>I&apos;m Bored</span>
        </button>

        {/* Not Useful */}
        <button
          type="button"
          onClick={() => isAdaptEnabled && onFeedback?.("not_useful")}
          disabled={!isAdaptEnabled || isAdapting}
          className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
          title={!isAdaptEnabled ? "Adaptation enabled in Phase 5" : "Replace with direct goal-focused action"}
        >
          <HelpCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>Not Useful</span>
        </button>

        {/* Skip */}
        <button
          type="button"
          onClick={onSkip}
          disabled={isAdapting}
          className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
          title="Skip this mission without AI adaptation"
        >
          <FastForward className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Skip</span>
        </button>
      </div>
    </div>
  );
}
