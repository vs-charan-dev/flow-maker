"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, Eye, EyeOff, Trash2, Key, Cpu, ShieldCheck } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  model?: string;
  onSave: (apiKey: string, model: string) => Promise<void | boolean> | void;
  onClearKey: () => void;
  isConnecting?: boolean;
  connectionStatus?: "idle" | "connected" | "error";
  errorMessage?: string;
  phase?: number;
  onCredentialsChange?: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  model = "openai/gpt-4o-mini",
  onSave,
  onClearKey,
  isConnecting = false,
  connectionStatus = "idle",
  errorMessage = "",
  phase = 2,
  onCredentialsChange,
}: SettingsModalProps) {
  const [inputKey, setInputKey] = useState(apiKey);
  const [inputModel, setInputModel] = useState(model);
  const [showKey, setShowKey] = useState(false);
  const [localError, setLocalError] = useState("");

  const modalRef = useRef<HTMLDivElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputKey(apiKey);
    setInputModel(model);
    setLocalError("");
  }, [apiKey, model, isOpen]);

  // Keyboard accessibility: Escape to close and autofocus input
  useEffect(() => {
    if (!isOpen) return;
    keyInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClear = () => {
    setInputKey("");
    onClearKey();
    setLocalError("");
    onCredentialsChange?.();
  };

  const handleKeyChange = (val: string) => {
    setInputKey(val);
    setLocalError("");
    onCredentialsChange?.();
  };

  const handleModelChange = (val: string) => {
    setInputModel(val);
    setLocalError("");
    onCredentialsChange?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === 1) return;

    if (!inputKey.trim()) {
      setLocalError("OpenRouter API key cannot be blank.");
      return;
    }
    if (!inputModel.trim()) {
      setLocalError("OpenRouter model ID cannot be blank.");
      return;
    }
    setLocalError("");
    await onSave(inputKey.trim(), inputModel.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 id="settings-title" className="text-lg font-semibold text-slate-900">
            OpenRouter Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* API Key */}
          <div className="space-y-1.5">
            <label
              htmlFor="settings-api-key"
              className="flex items-center justify-between text-sm font-medium text-slate-700"
            >
              <span className="flex items-center gap-1.5">
                <Key className="w-4 h-4 text-slate-400" />
                OpenRouter API Key
              </span>
              {inputKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-normal"
                  aria-label="Clear API key"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </label>
            <div className="relative">
              <input
                ref={keyInputRef}
                id="settings-api-key"
                type={showKey ? "text" : "password"}
                value={inputKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full px-3.5 py-2.5 pr-11 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded"
                aria-label={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Stored only in your browser tab (sessionStorage). Never stored on the server.
            </p>
          </div>

          {/* Model ID */}
          <div className="space-y-1.5">
            <label
              htmlFor="settings-model"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-700"
            >
              <Cpu className="w-4 h-4 text-slate-400" />
              OpenRouter Model ID
            </label>
            <input
              id="settings-model"
              type="text"
              value={inputModel}
              onChange={(e) => handleModelChange(e.target.value)}
              placeholder="openai/gpt-4o-mini"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              spellCheck={false}
            />
            <p className="text-xs text-slate-500">
              Examples: <code className="text-slate-700">openai/...</code>,{" "}
              <code className="text-slate-700">anthropic/...</code>,{" "}
              <code className="text-slate-700">google/...</code>,{" "}
              <code className="text-slate-700">deepseek/...</code>. Any valid OpenRouter model ID is accepted.
            </p>
          </div>

          {/* Privacy Note per PRD */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <span>
              <strong>Privacy:</strong> Your API key is used only to send requests to OpenRouter. It is not stored on the application server.
            </span>
          </div>

          {/* Errors / Feedback */}
          {(localError || errorMessage) && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
              {localError || errorMessage}
            </div>
          )}

          {connectionStatus === "connected" && !localError && !errorMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-medium flex items-center gap-1.5">
              <span>Connected ✓</span>
            </div>
          )}

          {/* Action Button */}
          <div>
            {phase === 1 ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-200 text-slate-400 font-medium text-sm cursor-not-allowed text-center"
                  title="Save & Test Connection will be enabled in Phase 2"
                >
                  Save & Test Connection (Enabled in Phase 2)
                </button>
                <p className="text-xs text-center text-slate-500">
                  Route wiring and verification activate in Phase 2.
                </p>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isConnecting || !inputKey.trim() || !inputModel.trim()}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm transition shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isConnecting ? (
                  <span>Testing connection...</span>
                ) : (
                  <span>Save & Test Connection</span>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
