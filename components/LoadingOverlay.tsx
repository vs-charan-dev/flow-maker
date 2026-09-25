"use client";
import React, { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  isOpen: boolean;
  title?: string;
}

const DEFAULT_MESSAGES = [
  "Breaking the goal into smaller wins...",
  "Adding variety and pacing...",
  "Balancing the session budget...",
  "Building your missions...",
];

export default function LoadingOverlay({
  isOpen,
  title = "Designing Your Flow Session",
}: LoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % DEFAULT_MESSAGES.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Loading session"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
        <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-75" />
          <div className="relative w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold text-slate-900 text-base">{title}</h3>
          <p className="text-sm text-indigo-600 font-medium min-h-[1.5rem] transition-all duration-300">
            {DEFAULT_MESSAGES[messageIndex]}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Thinking and structuring...</span>
        </div>
      </div>
    </div>
  );
}
