"use client";
import React from "react";
interface ProgressBarProps {
  currentIndex: number;
  totalCount: number;
  completedCount: number;
  skippedCount: number;
}

export default function ProgressBar({
  currentIndex,
  totalCount,
  completedCount,
  skippedCount,
}: ProgressBarProps) {
  if (totalCount <= 0) return null;

  const percent = Math.round(((completedCount + skippedCount) / totalCount) * 100);
  const displayIndex = Math.min(currentIndex + 1, totalCount);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
        <span className="font-semibold text-slate-800">
          Mission {displayIndex} of {totalCount}
        </span>
        <span>{percent}% Complete</span>
      </div>

      {/* Segmented bar */}
      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex gap-1 p-0.5">
        <div
          className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
