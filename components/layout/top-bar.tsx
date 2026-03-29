"use client";

import { DarkToggle } from "@/components/ui/theme-provider";

type TopBarProps = {
  displayName: string;
  level: number;
  streak: number;
  rank?: string;
};

export function TopBar({ displayName, level, streak, rank = "Scholar" }: TopBarProps) {
  return (
    <div
      className="sticky top-0 z-20 px-4 lg:px-10 py-3 lg:py-4 flex items-center justify-end glass-bar"
      style={{
        background: "color-mix(in srgb, var(--surface) 85%, transparent)",
      }}
    >
      {/* Right: badges + avatar */}
      <div className="flex items-center gap-3 lg:gap-5">
        {/* Streak badge */}
        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full" style={{ background: "var(--tertiary-container, #e6f7ee)" }}>
          <span className="text-sm">🔥</span>
          <span className="text-[13px] font-bold" style={{ color: "var(--tertiary)" }}>{streak}-Day Streak</span>
        </div>

        {/* Level badge (desktop) */}
        <div className="hidden lg:flex items-center gap-1.5 px-4 py-1.5 rounded-full" style={{ background: "var(--surface-low)" }}>
          <span className="text-sm">🏆</span>
          <span className="text-[13px] font-bold text-[var(--on-surface)]">Lvl {level}</span>
        </div>

        {/* User info + avatar (desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold text-[var(--on-surface)]">{displayName}</p>
            <p className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: "var(--outline)" }}>{rank}</p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center btn-primary text-white font-extrabold text-base" style={{ boxShadow: "none" }}>
            {displayName[0]}
          </div>
        </div>

        {/* Mobile dark toggle */}
        <div className="lg:hidden">
          <DarkToggle />
        </div>
      </div>
    </div>
  );
}
