"use client";

import { Briefcase, Clock, DollarSign, PiggyBank } from "lucide-react";
import { PlayerAvatar } from "../PlayerAvatar";
import { useGame } from "./GameContext";
import { Stat } from "./ui";

export function PlayersStrip() {
  const { core } = useGame();
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {core.players.map((p) => {
        const active = p.seat === core.currentSeat;
        return (
          <div
            key={p.seat}
            className={`flex min-w-[150px] items-center gap-2 rounded-xl border p-2 ${
              active ? "border-amber-400 bg-amber-400/10" : "bg-card"
            }`}
          >
            <PlayerAvatar src={p.avatar} name={p.name} size={36} />
            <div className="min-w-0 text-xs">
              <p className="truncate font-semibold">
                {p.name}
                {active && " 🎲"}
              </p>
              <p className="text-muted-foreground">
                Wk {p.week} · ${Math.round(p.cash).toLocaleString()}
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
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-3">
        <PlayerAvatar src={player.avatar} name={player.name} size={48} />
        <div>
          <p className="font-bold">{player.name}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Briefcase size={12} /> {player.jobTitle ?? "Unemployed"}
          </p>
        </div>
        <div className="ml-auto text-right text-xs text-muted-foreground">
          <p>Week {player.week}</p>
          <p>Round {core.round}</p>
        </div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
        <p className="flex items-center gap-1">
          <DollarSign size={14} className="text-emerald-500" />{" "}
          <strong>
            {player.cash.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}
          </strong>
        </p>
        <p className="flex items-center gap-1">
          <PiggyBank size={14} className="text-amber-500" />{" "}
          <strong>{player.bankAccount.savings.toLocaleString()}</strong>
        </p>
      </div>
      <div className="space-y-2">
        <Stat
          label="Time left"
          value={player.timeLeft}
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
      <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
        <Clock size={11} /> Possessions:{" "}
        {player.possessions.length ? player.possessions.join(", ") : "none yet"}
      </p>
    </div>
  );
}
