"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { evaluateGoals } from "@/lib/game/engine";
import { useGame } from "./GameContext";

function Row({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail: string;
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {ok ? (
        <Check size={14} className="shrink-0 text-emerald-500" />
      ) : (
        <X size={14} className="shrink-0 text-red-500" />
      )}
      <span className="font-medium">{label}</span>
      <span className="ml-auto text-xs text-muted-foreground">{detail}</span>
    </li>
  );
}

export function GoalsPanel() {
  const { core, player } = useGame();
  const [seat, setSeat] = useState<number | null>(null);
  const viewed = core.players[seat ?? player.seat] ?? player;
  const g = evaluateGoals(viewed);

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold">Goals</h3>
        {core.players.length > 1 && (
          <select
            value={viewed.seat}
            onChange={(e) => setSeat(Number(e.target.value))}
            className="rounded border bg-background px-2 py-1 text-xs"
          >
            {core.players.map((p) => (
              <option key={p.seat} value={p.seat}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <ul className="space-y-1.5">
        <Row
          ok={g.cash.achieved}
          label="Cash"
          detail={`$${Math.round(g.cash.current).toLocaleString()} / $${g.cash.target.toLocaleString()}`}
        />
        <Row ok={g.job.achieved} label="Winning job" detail={g.job.current} />
        <Row
          ok={g.subjects.achieved}
          label="Job subjects"
          detail={g.subjects.achieved ? "qualified" : "keep studying"}
        />
        <Row
          ok={g.luxury.achieved}
          label="Luxury apartment"
          detail={g.luxury.current}
        />
        <Row
          ok={g.health.achieved}
          label="Health"
          detail={`${g.health.current} / ${g.health.target}`}
        />
        <Row
          ok={g.happiness.achieved}
          label="Happiness"
          detail={`${g.happiness.current} / ${g.happiness.target}`}
        />
        <Row
          ok={g.education.achieved}
          label="Education"
          detail={`${g.education.current} / ${g.education.target}`}
        />
      </ul>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Winning jobs: {viewed.goals.winningJobs.join(", ")}
      </p>
    </div>
  );
}
