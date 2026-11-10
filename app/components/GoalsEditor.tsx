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
          <span className="flex justify-between">
            <span>{s.label}</span>
            <span className="font-mono">{goals[s.key]}</span>
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
            className="w-full"
          />
        </label>
      ))}
      <button
        type="button"
        className="text-xs text-muted-foreground underline"
        onClick={() => onChange(DEFAULT_GOALS)}
      >
        Reset to defaults
      </button>
    </div>
  );
}
