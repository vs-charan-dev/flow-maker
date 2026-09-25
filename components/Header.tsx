"use client";
import React from "react";
import { Settings as SettingsIcon } from "lucide-react";

interface HeaderProps {
  onOpenSettings: () => void;
  settingsButtonRef?: React.RefObject<HTMLButtonElement | null>;
  isConnected?: boolean;
}

export default function Header({
  onOpenSettings,
  settingsButtonRef,
  isConnected = false,
}: HeaderProps) {
  return (
    <header className="w-full max-w-3xl mx-auto flex items-center justify-between py-4 px-4 sm:px-0 border-b border-slate-200 mb-8">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
          F
        </div>
        <div>
          <span className="font-semibold text-slate-900 tracking-tight text-lg">
            Flow Companion
          </span>
        </div>
      </div>

      <button
        ref={settingsButtonRef}
        type="button"
        onClick={onOpenSettings}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Open Settings"
      >
        <SettingsIcon className="w-4 h-4 text-slate-500" />
        <span>Settings</span>
        {isConnected && (
          <span
            className="w-2 h-2 rounded-full bg-emerald-500"
            title="Connected"
            aria-label="Connected"
          />
        )}
      </button>
    </header>
  );
}
