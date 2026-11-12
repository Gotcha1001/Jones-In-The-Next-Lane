"use client";

import { useState } from "react";
import { datingOptions } from "@/lib/game/data/dating";
import { PlayerAvatar } from "../PlayerAvatar";
import { useGame } from "./GameContext";
import { ActionButton, ScreenCard } from "./ui";

type Filter = "all" | "Male" | "Female";

const CARD =
  "accent-card rounded-xl p-3 transition hover:border-cyan-400/70 hover:shadow-[0_0_14px_var(--accent-400)]";
const PILL =
  "rounded-full border px-3 py-1 text-xs transition hover:border-cyan-400 hover:shadow-[0_0_10px_var(--accent-400)]";
const PILL_ON =
  "border-cyan-400 bg-cyan-500/20 text-cyan-100 shadow-[0_0_12px_var(--accent-400)]";
const PILL_OFF = "border-cyan-400/30 bg-black/40 text-cyan-300/80";
const META = "text-xs text-cyan-300/80";

export function DatingOffice() {
  const { player } = useGame();
  const [filter, setFilter] = useState<Filter>("all");
  const rel = player.relationship;
  const list = rel.isDating
    ? datingOptions.filter((p) => p.id === rel.partnerId)
    : datingOptions.filter((p) => filter === "all" || p.gender === filter);

  return (
    <ScreenCard
      title="Dating Office"
      subtitle={
        rel.isDating
          ? `Relationship health ${rel.health}/100 · happiness ${rel.happiness}/100`
          : "Find your special someone. (Health 80+ is part of the win goal.)"
      }
    >
      {!rel.isDating && (
        <div className="mb-3 flex gap-2">
          {(["all", "Female", "Male"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`${PILL} ${filter === f ? PILL_ON : PILL_OFF}`}
            >
              {f === "all" ? "Everyone" : f}
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((person) => (
          <div key={person.id} className={CARD}>
            <div className="mb-2 flex items-center gap-3">
              <PlayerAvatar src={person.image} name={person.name} size={56} />
              <div>
                <p className="font-medium text-white">{person.name}</p>
                <p className="accent-gradient-text text-xs font-semibold">
                  {person.compatibility}% compatible
                </p>
              </div>
            </div>
            <p className={META}>{person.personality}</p>
            <p className={`mb-2 ${META}`}>{person.interests}</p>
            {rel.isDating ? (
              <div className="flex gap-2">
                <ActionButton
                  action={{ type: "goOnDate", personId: person.id }}
                  disabled={player.cash < person.datePrice}
                >
                  Date (${person.datePrice})
                </ActionButton>
                <ActionButton
                  action={{ type: "breakUp" }}
                  variant="destructive"
                >
                  Break up
                </ActionButton>
              </div>
            ) : (
              <ActionButton
                action={{ type: "startDating", personId: person.id }}
              >
                Start dating
              </ActionButton>
            )}
          </div>
        ))}
      </div>
    </ScreenCard>
  );
}
