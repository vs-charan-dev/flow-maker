"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ActiveSession } from "@/lib/types";
import {
  saveCompletedSession,
  updateRecentSessionReflection,
  setActiveSession,
} from "@/lib/storage";
import { Award, CheckCircle2, FastForward, Clock, Target, Home, RotateCcw, Star } from "lucide-react";

interface SessionSummaryProps {
  session: ActiveSession;
  onRepeat?: () => void;
}

export default function SessionSummary({ session, onRepeat }: SessionSummaryProps) {
  const [speedFeedback, setSpeedFeedback] = useState<"faster" | "same" | "slower" | undefined>(
    session.reflection?.speedFeedback
  );
  const [engagementRating, setEngagementRating] = useState<number | undefined>(
    session.reflection?.engagementRating
  );

  const completedMissions = session.missions.filter((m) => m.status === "completed");
  const skippedMissions = session.missions.filter((m) => m.status === "skipped");

  // Focused minutes equal sum of COMPLETED mission minutes only
  const estimatedFocusedMinutes = completedMissions.reduce((acc, m) => acc + m.minutes, 0);
  const completionRate = Math.round((completedMissions.length / session.missions.length) * 100);

  // Automatically save to local history on mount (idempotent)
  useEffect(() => {
    saveCompletedSession({
      id: session.id,
      title: session.title,
      date: session.createdAt || new Date().toISOString(),
      duration: session.totalMinutes,
      completedMissionsCount: completedMissions.length,
      skippedMissionsCount: skippedMissions.length,
      totalMissionsCount: session.missions.length,
      completionPercentage: completionRate,
      estimatedFocusedMinutes,
      originalTask: session.originalTask,
      desiredOutcome: session.desiredOutcome,
      energy: session.energy,
      speedFeedback,
      engagementRating,
    });
  }, [session, completedMissions.length, skippedMissions.length, completionRate, estimatedFocusedMinutes, speedFeedback, engagementRating]);

  const handleSpeedSelect = (val: "faster" | "same" | "slower") => {
    const nextVal = speedFeedback === val ? undefined : val;
    setSpeedFeedback(nextVal);
    updateRecentSessionReflection(session.id, nextVal, engagementRating);

    // Update active session in sessionStorage
    const updated: ActiveSession = {
      ...session,
      reflection: {
        ...session.reflection,
        speedFeedback: nextVal,
      },
    };
    setActiveSession(updated);
  };

  const handleRatingSelect = (rating: number) => {
    const nextRating = engagementRating === rating ? undefined : rating;
    setEngagementRating(nextRating);
    updateRecentSessionReflection(session.id, speedFeedback, nextRating);

    const updated: ActiveSession = {
      ...session,
      reflection: {
        ...session.reflection,
        engagementRating: nextRating,
      },
    };
    setActiveSession(updated);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 text-left animate-fadeIn">
      {/* Hero Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <Award className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Session Complete!
          </h1>
          <p className="text-sm font-medium text-slate-500">{session.title}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="space-y-0.5">
            <span className="block text-2xl font-bold text-emerald-600">{completedMissions.length}</span>
            <span className="text-xs text-slate-500 font-medium">Completed</span>
          </div>
          <div className="space-y-0.5">
            <span className="block text-2xl font-bold text-slate-400">{skippedMissions.length}</span>
            <span className="text-xs text-slate-500 font-medium">Skipped</span>
          </div>
          <div className="space-y-0.5">
            <span className="block text-2xl font-bold text-indigo-600">~{estimatedFocusedMinutes}m</span>
            <span className="text-xs text-slate-500 font-medium">Focused</span>
          </div>
        </div>
      </div>

      {/* Goal Reflection */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
        <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs uppercase tracking-wider">
          <Target className="w-4 h-4" />
          <span>Desired Outcome</span>
        </div>
        <p className="text-slate-900 text-sm font-medium leading-relaxed bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
          {session.desiredOutcome}
        </p>
      </div>

      {/* Mission Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-xs">
          Mission Recap ({completedMissions.length}/{session.missions.length})
        </h2>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {session.missions.map((m, idx) => (
            <div
              key={m.id || idx}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                m.status === "completed"
                  ? "bg-emerald-50/40 border-emerald-200 text-emerald-950"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                {m.status === "completed" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <FastForward className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className="font-semibold truncate">{m.title}</span>
              </div>
              <span className="shrink-0 text-slate-500 font-mono">~{m.minutes}m</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback & Engagement Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Faster than normal? */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Did this session feel faster than normal?
          </label>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Speed perception">
            {(
              [
                { id: "faster", label: "Yes ⚡" },
                { id: "same", label: "About the same" },
                { id: "slower", label: "Slower" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSpeedSelect(opt.id)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  speedFeedback === opt.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Engagement Rating (1-5) */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="block text-sm font-bold text-slate-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            How engaged were you? (Optional)
          </label>
          <div className="flex items-center justify-between gap-2 max-w-xs" role="group" aria-label="Engagement rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingSelect(star)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                  engagementRating === star
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
                aria-label={`Rating ${star} of 5`}
              >
                {star} ★
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="space-y-2 pt-2">
        {onRepeat && (
          <button
            type="button"
            onClick={onRepeat}
            className="w-full py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Repeat This Session Setup</span>
          </button>
        )}

        <Link
          href="/"
          className="w-full py-3.5 px-6 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
