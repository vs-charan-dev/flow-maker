"use client";
import React from "react";
import { SessionMission } from "@/lib/types";
import { Clock, HelpCircle } from "lucide-react";

interface MissionCardProps {
  mission: SessionMission;
  missionIndex: number;
  totalMissions: number;
}

export default function MissionCard({
  mission,
  missionIndex,
}: MissionCardProps) {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 text-left transition-all">
      {/* Header tags: Type and subtle duration */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
            {mission.type || "Mission"}
          </span>
          <span className="text-xs text-slate-400 font-medium">#{missionIndex + 1}</span>
        </div>

        {/* Subtle estimated duration per PRD: ~6 min */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium"
          title="Estimated duration for this mission"
        >
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>~{mission.minutes} min</span>
        </div>
      </div>

      {/* Mission title */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
          {mission.title}
        </h2>
      </div>

      {/* Instruction */}
      <div className="space-y-2">
        <p className="text-slate-700 text-base leading-relaxed whitespace-pre-line font-normal">
          {mission.instruction}
        </p>
      </div>

      {/* Optional completion question */}
      {mission.completionQuestion && (
        <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs sm:text-sm text-indigo-950 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-indigo-900">Check: </span>
            <span className="italic">{mission.completionQuestion}</span>
          </div>
        </div>
      )}
    </div>
  );
}
