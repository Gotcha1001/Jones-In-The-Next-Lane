"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { GameAction } from "@/lib/game/validators";
import { WEEK_LENGTH } from "@/lib/game/engine";
import { useGame } from "./GameContext";

interface ActionButtonProps {
  action: GameAction;
  children: ReactNode;
  variant?: "default" | "outline" | "destructive";
  className?: string;
  /** Extra client-side reason to disable (the server re-validates anyway). */
  disabled?: boolean;
  title?: string;
}

/** A button that sends one typed action to the server. */
export function ActionButton({
  action,
  children,
  variant = "default",
  className,
  disabled,
  title,
}: ActionButtonProps) {
  const { run, canAct, pending } = useGame();
  return (
    <Button
      size="sm"
      variant={variant}
      title={title}
      className={className}
      disabled={!canAct || pending || disabled}
      onClick={() => void run(action)}
    >
      {children}
    </Button>
  );
}

export function ScreenCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <h3 className="text-lg font-bold">{title}</h3>
      {subtitle && (
        <p className="mb-3 text-sm text-muted-foreground">{subtitle}</p>
      )}
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max?: number;
  color: string;
}) {
  const pct = max ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono">
          {Math.round(value)}
          {max ? `/${max}` : ""}
        </span>
      </div>
      {max !== undefined && (
        <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

/** How much of the current week is left. Turns amber, then red, as it runs down. */
export function WeekMeter({ compact = false }: { compact?: boolean }) {
  const { player } = useGame();
  const left = Math.max(0, Math.min(WEEK_LENGTH, player.timeLeft));
  const pct = (left / WEEK_LENGTH) * 100;
  const tone =
    pct > 50
      ? "from-cyan-400 to-sky-500"
      : pct > 20
        ? "from-amber-300 to-orange-500"
        : "from-red-400 to-red-600";
  return (
    <div
      className={`accent-card rounded-2xl border border-cyan-400/40 bg-black/40 backdrop-blur ${
        compact ? "px-3 py-2" : "p-3"
      }`}
      role="progressbar"
      aria-label="Time left this week"
      aria-valuemin={0}
      aria-valuemax={WEEK_LENGTH}
      aria-valuenow={Math.round(left)}
    >
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-widest text-cyan-300/80">
          ⏱ Week {player.week}
        </span>
        <span className="font-mono text-cyan-100">
          {Math.round(left)}/{WEEK_LENGTH} left
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone} transition-[width] duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
