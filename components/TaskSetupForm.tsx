"use client";
import React, { useState } from "react";
import { EnergyLevel, TaskSetupData } from "@/lib/types";
import { Sparkles, AlertCircle, Clock, Zap, Target, BookOpen } from "lucide-react";

interface TaskSetupFormProps {
  initialValues?: Partial<TaskSetupData>;
  onSubmit: (data: TaskSetupData) => void;
  hasCredentials: boolean;
  onOpenSettings: () => void;
  isLoading?: boolean;
  phase?: number;
}

export default function TaskSetupForm({
  initialValues,
  onSubmit,
  hasCredentials,
  onOpenSettings,
  isLoading = false,
  phase = 1,
}: TaskSetupFormProps) {
  const [task, setTask] = useState(initialValues?.task || "");
  const [duration, setDuration] = useState<number>(initialValues?.duration ?? 60);
  const [outcome, setOutcome] = useState(initialValues?.outcome || "");
  const [energy, setEnergy] = useState<EnergyLevel>(initialValues?.energy || "normal");

  const [errors, setErrors] = useState<{
    task?: string;
    duration?: string;
    outcome?: string;
    general?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: {
      task?: string;
      duration?: string;
      outcome?: string;
      general?: string;
    } = {};

    if (!task.trim()) {
      newErrors.task = "Please enter what you need to do.";
    }

    if (typeof duration !== "number" || isNaN(duration)) {
      newErrors.duration = "Duration must be a valid number.";
    } else if (!Number.isInteger(duration)) {
      newErrors.duration = "Duration must be a whole number of minutes.";
    } else if (duration < 10) {
      newErrors.duration = "Duration must be at least 10 minutes.";
    } else if (duration > 240) {
      newErrors.duration = "Duration cannot exceed 240 minutes.";
    }

    if (!outcome.trim()) {
      newErrors.outcome = "Please enter what you want to achieve.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (!hasCredentials) {
      setErrors((prev) => ({
        ...prev,
        general: "Connect OpenRouter in Settings before creating a session.",
      }));
      return;
    }

    if (phase < 3) {
      setErrors((prev) => ({
        ...prev,
        general: "Session quest generation will be activated in Phase 3.",
      }));
      return;
    }

    onSubmit({
      task: task.trim(),
      duration,
      outcome: outcome.trim(),
      energy,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto space-y-6 text-left">
      {/* Missing settings warning banner */}
      {errors.general && (
        <div
          className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex items-start gap-3"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{errors.general}</p>
            {!hasCredentials && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="mt-2 inline-flex items-center text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline"
              >
                Open Settings to enter your OpenRouter API Key →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Task input */}
      <div className="space-y-1.5">
        <label
          htmlFor="task-input"
          className="block text-sm font-semibold text-slate-800 flex items-center gap-1.5"
        >
          <BookOpen className="w-4 h-4 text-indigo-600" />
          What do you need to do?
        </label>
        <textarea
          id="task-input"
          rows={3}
          value={task}
          onChange={(e) => {
            setTask(e.target.value);
            if (errors.task) setErrors((prev) => ({ ...prev, task: undefined }));
          }}
          placeholder="e.g. Study thermodynamics chapter 4, or review pull request #142"
          className={`w-full px-3.5 py-2.5 rounded-xl border ${
            errors.task ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-indigo-500"
          } text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition shadow-sm`}
          aria-invalid={!!errors.task}
          aria-describedby={errors.task ? "task-error" : undefined}
        />
        {errors.task && (
          <p id="task-error" className="text-xs text-rose-600 font-medium">
            {errors.task}
          </p>
        )}
      </div>

      {/* Duration slider & input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="duration-input"
            className="text-sm font-semibold text-slate-800 flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-indigo-600" />
            How much time do you have?
          </label>
          <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            <input
              id="duration-input"
              type="number"
              min={10}
              max={240}
              value={isNaN(duration) ? "" : duration}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setDuration(val);
                if (errors.duration) setErrors((prev) => ({ ...prev, duration: undefined }));
              }}
              className="w-12 bg-transparent text-sm font-bold text-indigo-700 text-right focus:outline-none"
              aria-label="Duration in minutes"
            />
            <span className="text-xs text-slate-600 font-medium">minutes</span>
          </div>
        </div>

        <input
          type="range"
          min={10}
          max={240}
          step={5}
          value={isNaN(duration) ? 60 : Math.min(240, Math.max(10, duration))}
          onChange={(e) => {
            setDuration(parseInt(e.target.value, 10));
            if (errors.duration) setErrors((prev) => ({ ...prev, duration: undefined }));
          }}
          className="w-full accent-indigo-600 cursor-pointer"
          aria-label="Duration slider"
        />
        <div className="flex justify-between text-[11px] text-slate-400 font-medium">
          <span>10m</span>
          <span>60m (Default)</span>
          <span>120m</span>
          <span>240m</span>
        </div>
        {errors.duration && (
          <p className="text-xs text-rose-600 font-medium">{errors.duration}</p>
        )}
      </div>

      {/* Desired outcome */}
      <div className="space-y-1.5">
        <label
          htmlFor="outcome-input"
          className="block text-sm font-semibold text-slate-800 flex items-center gap-1.5"
        >
          <Target className="w-4 h-4 text-indigo-600" />
          What do you want to achieve?
        </label>
        <textarea
          id="outcome-input"
          rows={3}
          value={outcome}
          onChange={(e) => {
            setOutcome(e.target.value);
            if (errors.outcome) setErrors((prev) => ({ ...prev, outcome: undefined }));
          }}
          placeholder="e.g. Understand the core concepts well enough to explain them simply."
          className={`w-full px-3.5 py-2.5 rounded-xl border ${
            errors.outcome ? "border-rose-400 focus:ring-rose-500" : "border-slate-300 focus:ring-indigo-500"
          } text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition shadow-sm`}
          aria-invalid={!!errors.outcome}
          aria-describedby={errors.outcome ? "outcome-error" : undefined}
        />
        {errors.outcome && (
          <p id="outcome-error" className="text-xs text-rose-600 font-medium">
            {errors.outcome}
          </p>
        )}
      </div>

      {/* Energy level */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-indigo-600" />
          Current energy
        </label>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Current energy level">
          {(
            [
              { id: "low", label: "Low", desc: "Gentle pacing" },
              { id: "normal", label: "Normal", desc: "Balanced flow" },
              { id: "high", label: "High", desc: "Fast challenges" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={energy === item.id}
              onClick={() => setEnergy(item.id)}
              className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                energy === item.id
                  ? "bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500 font-medium"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="text-sm font-semibold">{item.label}</span>
              <span className="text-[11px] text-slate-500">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-base transition shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          <span>Build My Session</span>
        </button>
        <p className="text-xs text-center text-slate-500 mt-2">
          Breaks your task into 5–10 short, engaging missions without continuous clock-watching.
        </p>
      </div>
    </form>
  );
}
