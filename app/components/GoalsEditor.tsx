"use client";

import type { Goals } from "@/lib/game/validators";
import { DEFAULT_GOALS } from "@/lib/game/engine";

interface Props {
  goals: Goals;
  onChange: (g: Goals) => void;
}

interface SliderDef {
  key: "cash" | "education" | "happiness";
  label: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: readonly SliderDef[] = [
  { key: "cash", label: "Cash goal ($)", min: 1000, max: 50000, step: 500 },
  { key: "education", label: "Education goal", min: 20, max: 100, step: 5 },
  { key: "happiness", label: "Happiness goal", min: 30, max: 100, step: 5 },
];

export function GoalsEditor({ goals, onChange }: Props) {
  return (
    <div className="space-y-3">
      {SLIDERS.map((s) => (
        <label key={s.key} className="block text-sm">
          <span className="mb-1 flex justify-between">
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-mono text-cyan-300">{goals[s.key]}</span>
          </span>
          <input
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={goals[s.key]}
            onChange={(e) =>
              onChange({ ...goals, [s.key]: Number(e.target.value) })
            }
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400
              [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:w-3.5
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-cyan-400
              [&::-webkit-slider-thumb]:shadow-[0_0_10px_color-mix(in_oklab,var(--accent-400)_60%,transparent)]
              [&::-moz-range-thumb]:h-3.5
              [&::-moz-range-thumb]:w-3.5
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:bg-cyan-400"
          />
        </label>
      ))}
      <button
        type="button"
        className="text-xs text-cyan-400/80 underline underline-offset-2 transition hover:text-cyan-300"
        onClick={() => onChange(DEFAULT_GOALS)}
      >
        Reset to defaults
      </button>
    </div>
  );
}
