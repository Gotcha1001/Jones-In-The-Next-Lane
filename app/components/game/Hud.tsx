"use client";

import { Briefcase, Clock, DollarSign, PiggyBank } from "lucide-react";
import { PlayerAvatar } from "../PlayerAvatar";
import { useGame } from "./GameContext";
import { Stat } from "./ui";

// Inline style on purpose: html[data-glow="off"] strips any [style*="text-shadow"]
const GLOW_TEXT = {
  textShadow:
    "0 0 10px color-mix(in oklab, var(--accent-400) 70%, transparent)",
} as const;

export function PlayersStrip() {
  const { core } = useGame();
  return (
    <div className="flex gap-2 overflow-x-auto p-1">
      {core.players.map((p) => {
        const active = p.seat === core.currentSeat;
        return (
          <div
            key={p.seat}
            className={`flex min-w-[150px] items-center gap-2 rounded-xl border p-2 transition ${
              active
                ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_16px_-4px_color-mix(in_oklab,var(--accent-400)_60%,transparent)]"
                : "border-cyan-400/20 bg-card opacity-80"
            }`}
          >
            <PlayerAvatar src={p.avatar} name={p.name} size={36} />
            <div className="min-w-0 text-xs">
              <p
                className={`truncate font-semibold ${active ? "text-cyan-300" : ""}`}
                style={active ? GLOW_TEXT : undefined}
              >
                {p.name}
                {active && " 🎲"}
              </p>
              <p className="text-cyan-200/70">
                Wk {p.week} ·{" "}
                <span className="text-cyan-300">
                  ${Math.round(p.cash).toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StatsPanel() {
  const { player, core } = useGame();
  return (
    <div className="accent-card rounded-2xl bg-card p-4">
      <div className="mb-3 flex items-center gap-3">
        <PlayerAvatar src={player.avatar} name={player.name} size={48} />
        <div>
          <p className="font-bold text-cyan-300" style={GLOW_TEXT}>
            {player.name}
          </p>
          <p className="flex items-center gap-1 text-xs text-cyan-200/70">
            <Briefcase size={12} className="text-cyan-400" />{" "}
            {player.jobTitle ?? "Unemployed"}
          </p>
        </div>
        <div className="ml-auto text-right text-xs text-cyan-200/70">
          <p>Week {player.week}</p>
          <p>Round {core.round}</p>
        </div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
        <p className="flex items-center gap-1">
          <DollarSign size={14} className="text-cyan-400" />{" "}
          <strong className="text-cyan-300">
            {player.cash.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </strong>
        </p>
        <p className="flex items-center gap-1">
          <PiggyBank size={14} className="text-fuchsia-400" />{" "}
          <strong className="text-fuchsia-300">
            {player.bankAccount.savings.toLocaleString()}
          </strong>
        </p>
      </div>
      {/* Bars keep their own colours on purpose: they're how you tell six stats apart */}
      <div className="space-y-2">
        <Stat
          label="Time used"
          value={100 - player.timeLeft}
          max={100}
          color="bg-sky-500"
        />
        <Stat
          label="Energy"
          value={player.energy}
          max={100}
          color="bg-yellow-500"
        />
        <Stat
          label="Happiness"
          value={player.happiness}
          max={100}
          color="bg-pink-500"
        />
        <Stat
          label="Health (relationship)"
          value={player.relationship.health}
          max={100}
          color="bg-red-500"
        />
        <Stat
          label="Education"
          value={player.education}
          max={100}
          color="bg-blue-500"
        />
        <Stat
          label="Experience"
          value={player.experience}
          max={100}
          color="bg-purple-500"
        />
      </div>
      <p className="mt-3 flex items-center gap-1 text-[11px] text-cyan-300/70">
        <Clock size={11} /> Possessions:{" "}
        {player.possessions.length ? player.possessions.join(", ") : "none yet"}
      </p>
    </div>
  );
}
