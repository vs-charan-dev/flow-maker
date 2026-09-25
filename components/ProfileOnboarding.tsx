"use client";

import React, { useState } from "react";
import { UserProfile } from "@/lib/types";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

type ProfileKey = keyof UserProfile;

const questions: Array<{
  key: ProfileKey;
  title: string;
  reason: string;
  options: Array<{ value: string; label: string; detail: string }>;
}> = [
  {
    key: "goal",
    title: "What brings you here most often?",
    reason: "This helps us shape sessions around the kind of progress you want.",
    options: [
      { value: "learn", label: "Learn a topic", detail: "Understand and remember something new" },
      { value: "create", label: "Make something", detail: "Build, write, or design" },
      { value: "finish", label: "Get work done", detail: "Move through a task or project" },
    ],
  },
  {
    key: "experience",
    title: "Where do you usually start with a new topic?",
    reason: "Your starting point helps us choose the right level of explanation. You can still describe each task in detail later.",
    options: [
      { value: "beginner", label: "New to it", detail: "Start with the basics" },
      { value: "some", label: "Know a little", detail: "Build on what I know" },
      { value: "confident", label: "Quite familiar", detail: "Go deeper, faster" },
    ],
  },
  {
    key: "approach",
    title: "What helps you make progress?",
    reason: "We can use more of the activity style that works for you.",
    options: [
      { value: "examples", label: "Concrete examples", detail: "Show me how it works" },
      { value: "practice", label: "Hands-on practice", detail: "Let me try it myself" },
      { value: "steps", label: "Clear steps", detail: "Guide me one action at a time" },
    ],
  },
  {
    key: "pace",
    title: "What pace feels best?",
    reason: "This helps us size missions within the time you choose for each session.",
    options: [
      { value: "short", label: "Short bursts", detail: "Frequent small wins" },
      { value: "steady", label: "Steady rhythm", detail: "A balanced mix" },
      { value: "deep", label: "Deep focus", detail: "Longer stretches of attention" },
    ],
  },
];

export default function ProfileOnboarding({
  initialProfile,
  onComplete,
  onCancel,
}: {
  initialProfile?: UserProfile | null;
  onComplete: (profile: UserProfile) => void;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<UserProfile>>(initialProfile ?? {});
  const question = questions[step];
  const selected = answers[question.key];
  const progress = Math.round((Object.keys(answers).length / questions.length) * 100);

  const choose = (value: string) => {
    setAnswers((current) => ({ ...current, [question.key]: value }));
  };

  const next = () => {
    if (!selected) return;
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(answers as UserProfile);
    }
  };

  return (
    <section className="max-w-xl mx-auto text-left bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-8" aria-labelledby="onboarding-title">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-indigo-700">
        <span>Your profile</span>
        <span>{progress}% complete</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 mt-3 overflow-hidden" role="progressbar" aria-label="Profile completion" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-sm text-slate-600">A few quick answers help tailor your missions. Your profile stays in this browser, and you can edit it later.</p>
      {onCancel && <button type="button" onClick={onCancel} className="mt-2 text-sm font-semibold text-indigo-700 hover:underline focus-ring rounded">Cancel editing</button>}
      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Question {step + 1} of {questions.length}</p>
        <h2 id="onboarding-title" className="mt-2 text-xl sm:text-2xl font-bold text-slate-900">{question.title}</h2>
        <p className="mt-2 text-sm text-slate-600">Why we ask: {question.reason}</p>
        <div className="mt-6 space-y-3" role="radiogroup" aria-label={question.title}>
          {question.options.map((option) => (
            <button key={option.value} type="button" role="radio" aria-checked={selected === option.value} onClick={() => choose(option.value)} className={`w-full p-4 rounded-xl border text-left focus-ring transition ${selected === option.value ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"}`}>
              <span className="block font-semibold text-slate-900">{option.label}</span>
              <span className="block mt-0.5 text-sm text-slate-600">{option.detail}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between items-center gap-3 mt-8">
        <button type="button" onClick={() => setStep(step - 1)} disabled={step === 0} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 disabled:invisible focus-ring rounded-lg px-2 py-2"><ArrowLeft className="w-4 h-4" /> Back</button>
        <button type="button" onClick={next} disabled={!selected} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 focus-ring">
          {step === questions.length - 1 ? <>Save profile <Check className="w-4 h-4" /></> : <>Continue <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </section>
  );
}
