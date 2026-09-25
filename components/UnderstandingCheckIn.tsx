"use client";

import React from "react";
import { SessionSummaryRecord, UnderstandingLevel } from "@/lib/types";

export default function UnderstandingCheckIn({ session, onAnswer }: {
  session?: SessionSummaryRecord;
  onAnswer: (answer: UnderstandingLevel) => void;
}) {
  if (!session || session.understanding) return null;
  return (
    <section className="w-full max-w-xl mx-auto mt-8 text-left rounded-xl border border-indigo-200 bg-indigo-50 p-5" aria-labelledby="check-in-title">
      <h2 id="check-in-title" className="text-base font-bold text-indigo-950">Did your last session make sense?</h2>
      <p className="mt-1 text-sm text-indigo-800 line-clamp-2">{session.originalTask}</p>
      <p className="mt-2 text-xs text-indigo-700">Your answer helps shape the next session. Finishing does not mean you have to understand everything yet.</p>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {([
          { id: "clear", label: "I get it" },
          { id: "partial", label: "Some parts" },
          { id: "stuck", label: "Still stuck" },
        ] as const).map((option) => (
          <button key={option.id} type="button" onClick={() => onAnswer(option.id)} className="rounded-lg border border-indigo-200 bg-white hover:bg-indigo-100 px-2 py-2 text-xs font-semibold text-indigo-900 focus-ring">{option.label}</button>
        ))}
      </div>
    </section>
  );
}
