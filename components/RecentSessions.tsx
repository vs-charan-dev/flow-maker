"use client";
import React from "react";
import { SessionSummaryRecord } from "@/lib/types";
import { History, RotateCcw, Clock, Target, Calendar } from "lucide-react";

interface RecentSessionsProps {
  sessions: SessionSummaryRecord[];
  onRepeat: (session: SessionSummaryRecord) => void;
}

export default function RecentSessions({ sessions, onRepeat }: RecentSessionsProps) {
  if (!sessions || sessions.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto mt-12 space-y-4 text-left">
      <div className="flex items-center gap-2 text-slate-800 font-bold text-base border-b border-slate-200 pb-3">
        <History className="w-4 h-4 text-indigo-600" />
        <h2>Recent Sessions</h2>
        <span className="text-xs font-normal text-slate-400">({sessions.length})</span>
      </div>

      <div className="space-y-3">
        {sessions.map((item) => {
          const dateStr = new Date(item.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={item.id}
              className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition flex items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900 text-sm truncate">{item.title}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.completionPercentage >= 80
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.completionPercentage}% Done
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {dateStr}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {item.duration} min
                  </span>
                  <span className="text-indigo-600 font-semibold">
                    ~{item.estimatedFocusedMinutes}m focused
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-1 flex items-center gap-1">
                  <Target className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{item.desiredOutcome}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => onRepeat(item)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label={`Repeat ${item.title}`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Repeat</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
