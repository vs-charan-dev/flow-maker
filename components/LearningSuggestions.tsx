"use client";

import React from "react";
import { SessionSummaryRecord, TaskSetupData } from "@/lib/types";
import { getLearningSuggestions } from "@/lib/personalization";
import { Lightbulb, ArrowUpRight } from "lucide-react";

export default function LearningSuggestions({ sessions, onChoose }: {
  sessions: SessionSummaryRecord[];
  onChoose: (setup: TaskSetupData) => void;
}) {
  const suggestions = getLearningSuggestions(sessions);
  if (!suggestions.length) return null;

  return (
    <section className="w-full max-w-xl mx-auto mt-10 text-left" aria-labelledby="learning-suggestions-title">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-5 h-5 text-indigo-600" />
        <h2 id="learning-suggestions-title" className="text-lg font-bold text-slate-900">What could you learn next?</h2>
      </div>
      <p className="text-sm text-slate-600 mb-4">Based on your recent sessions and what you said you understood. Choose an idea to fill in a new session.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {suggestions.map((suggestion) => (
          <button key={suggestion.id} type="button" onClick={() => onChoose(suggestion.setup)} className="p-4 min-h-28 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 text-left shadow-sm transition focus-ring">
            <span className="flex items-start justify-between gap-2 text-sm font-semibold text-slate-900">
              <span className="line-clamp-2">{suggestion.title}</span>
              <ArrowUpRight className="w-4 h-4 shrink-0 text-indigo-600" />
            </span>
            <span className="block mt-2 text-xs text-slate-600 line-clamp-2">{suggestion.reason}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
