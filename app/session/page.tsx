"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getActiveSession, setActiveSession, getStoredApiKey, getStoredModel } from "@/lib/storage";
import { ActiveSession, FeedbackType, Mission, SessionMission } from "@/lib/types";
import ProgressBar from "@/components/ProgressBar";
import MissionCard from "@/components/MissionCard";
import MissionControls from "@/components/MissionControls";
import SessionSummary from "@/components/SessionSummary";
import { ArrowLeft, RotateCcw, AlertCircle, Sparkles } from "lucide-react";

export default function SessionPage() {
  const router = useRouter();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptError, setAdaptError] = useState("");

  useEffect(() => {
    const active = getActiveSession();
    setSession(active);
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Loading session...
      </div>
    );
  }

  // If session is missing or invalid/corrupt
  if (!session || !session.missions || session.missions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Active Session Found</h2>
          <p className="text-sm text-slate-600">
            You don&apos;t have an active session in progress. Create a new one from the home screen.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const completedCount = session.missions.filter((m) => m.status === "completed").length;
  const skippedCount = session.missions.filter((m) => m.status === "skipped").length;
  const isAllDone = session.isComplete || session.currentMissionIndex >= session.missions.length;

  // Handle "Done"
  const handleDone = () => {
    if (isAllDone || isAdapting) return;
    setAdaptError("");

    const updatedMissions = [...session.missions];
    const currIdx = session.currentMissionIndex;
    updatedMissions[currIdx] = {
      ...updatedMissions[currIdx],
      status: "completed",
      completedAt: new Date().toISOString(),
    };

    const nextIdx = currIdx + 1;
    const isComplete = nextIdx >= updatedMissions.length;

    const updatedSession: ActiveSession = {
      ...session,
      missions: updatedMissions,
      currentMissionIndex: nextIdx,
      isComplete,
    };

    setSession(updatedSession);
    setActiveSession(updatedSession);
  };

  // Handle "Skip"
  const handleSkip = () => {
    if (isAllDone || isAdapting) return;
    setAdaptError("");

    const updatedMissions = [...session.missions];
    const currIdx = session.currentMissionIndex;
    updatedMissions[currIdx] = {
      ...updatedMissions[currIdx],
      status: "skipped",
    };

    const nextIdx = currIdx + 1;
    const isComplete = nextIdx >= updatedMissions.length;

    const updatedSession: ActiveSession = {
      ...session,
      missions: updatedMissions,
      currentMissionIndex: nextIdx,
      isComplete,
    };

    setSession(updatedSession);
    setActiveSession(updatedSession);
  };

  // Handle Adaptive Feedback ("Too Hard", "I'm Bored", "Not Useful")
  const handleFeedback = async (feedback: FeedbackType) => {
    if (isAllDone || isAdapting) return;
    setAdaptError("");

    const apiKey = getStoredApiKey();
    const model = getStoredModel();
    if (!apiKey) {
      setAdaptError("OpenRouter API key is missing. Please return home to reconnect your key in Settings.");
      return;
    }

    const currentMission = session.missions[session.currentMissionIndex];
    // Planned minutes for current and all remaining pending missions
    const pendingMissions = session.missions.slice(session.currentMissionIndex);
    const remainingMinutes = pendingMissions.reduce((acc, m) => acc + m.minutes, 0);

    setIsAdapting(true);

    try {
      const res = await fetch("/api/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          model,
          originalGoal: session.originalTask,
          desiredOutcome: session.desiredOutcome,
          remainingMinutes,
          completedMissions: session.missions.filter((m) => m.status === "completed"),
          currentMission,
          feedback,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAdaptError(data.error || "Could not adapt remaining missions. Your original plan has been kept.");
        return;
      }

      // Atomically replace current and future pending missions
      const pastMissions = session.missions.slice(0, session.currentMissionIndex);
      const newPendingMissions: SessionMission[] = data.revisedMissions.map((m: Mission) => ({
        ...m,
        status: "pending" as const,
      }));

      const updatedMissions = [...pastMissions, ...newPendingMissions];
      const updatedSession: ActiveSession = {
        ...session,
        missions: updatedMissions,
      };

      setSession(updatedSession);
      setActiveSession(updatedSession);
    } catch {
      setAdaptError("Network failure while adapting missions. The original plan was kept.");
    } finally {
      setIsAdapting(false);
    }
  };

  const handleRepeatSession = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        "flow_companion_prefill",
        JSON.stringify({
          task: session.originalTask,
          duration: session.totalMinutes,
          outcome: session.desiredOutcome,
          energy: session.energy,
        })
      );
    }
    router.push("/");
  };

  // Session Completion Screen
  if (isAllDone) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8 flex flex-col items-center justify-center">
        <SessionSummary session={session} onRepeat={handleRepeatSession} />
      </div>
    );
  }

  const currentMission = session.missions[session.currentMissionIndex];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8 flex flex-col items-center justify-between pb-12">
      <div className="w-full max-w-xl space-y-6">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="font-bold text-base sm:text-lg text-slate-900 leading-snug">
              {session.title}
            </h1>
            <p className="text-xs text-slate-500 line-clamp-1">{session.originalTask}</p>
          </div>
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition shrink-0"
            title="Return to Home"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </header>

        {/* Adaptation loading or error banner */}
        {isAdapting && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-medium text-indigo-800 flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Adapting remaining missions to your feedback...</span>
          </div>
        )}

        {adaptError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{adaptError}</span>
          </div>
        )}

        {/* Progress Bar */}
        <ProgressBar
          currentIndex={session.currentMissionIndex}
          totalCount={session.missions.length}
          completedCount={completedCount}
          skippedCount={skippedCount}
        />

        {/* Current Mission Card */}
        {currentMission && (
          <MissionCard
            mission={currentMission}
            missionIndex={session.currentMissionIndex}
            totalMissions={session.missions.length}
          />
        )}

        {/* Mission Controls */}
        <MissionControls
          onDone={handleDone}
          onSkip={handleSkip}
          onFeedback={handleFeedback}
          isAdapting={isAdapting}
          phase={5}
        />
      </div>
    </div>
  );
}
