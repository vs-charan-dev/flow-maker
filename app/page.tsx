"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import SettingsModal from "@/components/SettingsModal";
import TaskSetupForm from "@/components/TaskSetupForm";
import RecentSessions from "@/components/RecentSessions";
import LoadingOverlay from "@/components/LoadingOverlay";
import ProfileOnboarding from "@/components/ProfileOnboarding";
import LearningSuggestions from "@/components/LearningSuggestions";
import UnderstandingCheckIn from "@/components/UnderstandingCheckIn";
import { learningHistoryFromSessions } from "@/lib/personalization";
import {
  getStoredApiKey,
  getStoredModel,
  setStoredApiKey,
  setStoredModel,
  clearStoredApiKey,
  setActiveSession,
  getRecentSessions,
  getStoredProfile,
  setStoredProfile,
  updateRecentSessionReflection,
} from "@/lib/storage";
import { TaskSetupData, ActiveSession, Mission, SessionSummaryRecord, UnderstandingLevel, UserProfile } from "@/lib/types";
import { AlertCircle } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("openai/gpt-4o-mini");
  const [isMounted, setIsMounted] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Connection test state
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connected" | "error">("idle");
  const [settingsError, setSettingsError] = useState("");

  // Session generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");

  // Recent sessions & prefill
  const [recentSessions, setRecentSessions] = useState<SessionSummaryRecord[]>([]);
  const [initialFormValues, setInitialFormValues] = useState<Partial<TaskSetupData> | undefined>(undefined);
  const [formKey, setFormKey] = useState(0); // For forcing form re-render when prefilled

  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const formContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setApiKey(getStoredApiKey());
    setModel(getStoredModel());
    setRecentSessions(getRecentSessions());
    setProfile(getStoredProfile());

    // Check for repeat prefill from sessionStorage
    try {
      const prefillRaw = window.sessionStorage.getItem("flow_companion_prefill");
      if (prefillRaw) {
        const prefill = JSON.parse(prefillRaw);
        setInitialFormValues(prefill);
        setFormKey((k) => k + 1);
        window.sessionStorage.removeItem("flow_companion_prefill");
      }
    } catch {
      // ignore corrupt prefill
    }
  }, []);

  const handleClearKey = () => {
    clearStoredApiKey();
    setApiKey("");
    setConnectionStatus("idle");
    setSettingsError("");
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
    settingsButtonRef.current?.focus();
  };

  const handleCredentialsChange = () => {
    setConnectionStatus("idle");
    setSettingsError("");
  };

  const handleSaveAndTest = async (newKey: string, newModel: string) => {
    setIsConnecting(true);
    setSettingsError("");

    try {
      const res = await fetch("/api/openrouter/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: newKey,
          model: newModel,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setStoredApiKey(newKey);
        setStoredModel(newModel);
        setApiKey(newKey);
        setModel(newModel);
        setConnectionStatus("connected");
        setSettingsError("");
      } else {
        setConnectionStatus("error");
        setSettingsError(data.error || "Connection test failed.");
      }
    } catch {
      setConnectionStatus("error");
      setSettingsError("Network error: Could not reach application server.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFormSubmit = async (data: TaskSetupData) => {
    if (!apiKey.trim() || !model.trim()) {
      setIsSettingsOpen(true);
      return;
    }

    setIsGenerating(true);
    setGenerationError("");

    try {
      const res = await fetch("/api/quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          model,
          task: data.task,
          duration: data.duration,
          outcome: data.outcome,
          energy: data.energy,
          profile: profile ?? undefined,
          learningHistory: learningHistoryFromSessions(getRecentSessions()),
        }),
      });

      const responseData = await res.json();
      if (!res.ok || !responseData.ok) {
        setGenerationError(
          responseData.error || "Could not generate session missions. Please check settings or retry."
        );
        return;
      }

      const quest = responseData.quest;
      const newSession: ActiveSession = {
        id: "sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        title: quest.title,
        totalMinutes: quest.totalMinutes,
        originalTask: data.task,
        desiredOutcome: data.outcome,
        energy: data.energy,
        createdAt: new Date().toISOString(),
        missions: quest.missions.map((m: Mission) => ({
          ...m,
          status: "pending",
        })),
        currentMissionIndex: 0,
        isComplete: false,
      };

      setActiveSession(newSession);
      router.push("/session");
    } catch {
      setGenerationError("Network error: Failed to connect to server. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRepeatSession = (item: SessionSummaryRecord) => {
    setInitialFormValues({
      task: item.originalTask,
      duration: item.duration,
      outcome: item.desiredOutcome,
      energy: item.energy,
    });
    setFormKey((k) => k + 1);

    // Scroll smoothly to form container
    formContainerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleProfileComplete = (updated: UserProfile) => {
    setStoredProfile(updated);
    setProfile(updated);
    setIsEditingProfile(false);
  };

  const handleCheckIn = (answer: UnderstandingLevel) => {
    const latest = recentSessions[0];
    if (!latest) return;
    updateRecentSessionReflection(latest.id, latest.speedFeedback, latest.engagementRating, answer, latest.unclearNote);
    setRecentSessions(getRecentSessions());
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 pb-12">
      <div className="w-full">
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          settingsButtonRef={settingsButtonRef}
          isConnected={connectionStatus === "connected"}
        />

        <main className="max-w-2xl mx-auto px-4 text-center">
          <div className="space-y-3 mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Make boring work feel shorter.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
              Turn one long work session into a sequence of short AI-generated missions so you focus on progress instead of watching the clock.
            </p>
          </div>

          {isMounted && (!profile || isEditingProfile) ? (
            <ProfileOnboarding initialProfile={profile} onComplete={handleProfileComplete} onCancel={profile ? () => setIsEditingProfile(false) : undefined} />
          ) : null}

          {profile && !isEditingProfile && generationError && (
            <div
              className="mb-6 p-4 max-w-xl mx-auto bg-rose-50 border border-rose-200 rounded-xl text-left text-sm text-rose-800 flex items-start gap-3"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Session Generation Failed</p>
                <p className="mt-1 text-xs text-rose-700">{generationError}</p>
              </div>
            </div>
          )}

          {profile && !isEditingProfile && (
          <div ref={formContainerRef}>
            <div className="max-w-xl mx-auto mb-6 flex items-center justify-between text-left rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <div><p className="text-sm font-semibold text-indigo-900">Your profile is ready</p><p className="text-xs text-indigo-700">Missions will use your preferred level, style, and pace.</p></div>
              <button type="button" onClick={() => setIsEditingProfile(true)} className="text-sm font-semibold text-indigo-700 hover:underline focus-ring rounded">Edit profile</button>
            </div>
            {isMounted && (
              <TaskSetupForm
                key={formKey}
                initialValues={initialFormValues}
                onSubmit={handleFormSubmit}
                hasCredentials={Boolean(apiKey && model)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                isLoading={isGenerating}
                phase={6}
              />
            )}
          </div>
          )}

          {isMounted && profile && !isEditingProfile && (
            <UnderstandingCheckIn session={recentSessions[0]} onAnswer={handleCheckIn} />
          )}
          {isMounted && profile && !isEditingProfile && (
            <LearningSuggestions sessions={recentSessions} onChoose={(setup) => {
              setInitialFormValues(setup);
              setFormKey((key) => key + 1);
              formContainerRef.current?.scrollIntoView({ behavior: "smooth" });
            }} />
          )}
          {isMounted && profile && !isEditingProfile && (
            <RecentSessions sessions={recentSessions} onRepeat={handleRepeatSession} />
          )}
        </main>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        apiKey={apiKey}
        model={model}
        onSave={handleSaveAndTest}
        onClearKey={handleClearKey}
        onCredentialsChange={handleCredentialsChange}
        isConnecting={isConnecting}
        connectionStatus={connectionStatus}
        errorMessage={settingsError}
        phase={6}
      />

      <LoadingOverlay isOpen={isGenerating} />
    </div>
  );
}
