"use client";

import { useState } from "react";
import { datingOptions } from "@/lib/game/data/dating";
import { PlayerAvatar } from "../PlayerAvatar";
import { useGame } from "./GameContext";
import { ActionButton, ScreenCard } from "./ui";

type Filter = "all" | "Male" | "Female";

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
              className={`rounded-full border px-3 py-1 text-xs ${filter === f ? "border-pink-500 bg-pink-500/10" : ""}`}
            >
              {f === "all" ? "Everyone" : f}
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((person) => (
          <div key={person.id} className="rounded-xl border p-3">
            <div className="mb-2 flex items-center gap-3">
              <PlayerAvatar src={person.image} name={person.name} size={56} />
              <div>
                <p className="font-medium">{person.name}</p>
                <p className="text-xs text-pink-500">
                  {person.compatibility}% compatible
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {person.personality}
            </p>
            <p className="mb-2 text-xs text-muted-foreground">
              {person.interests}
            </p>
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
