"use client";

import { datingOptions } from "@/lib/game/data/dating";
import { PlayerAvatar } from "../PlayerAvatar";
import { useGame } from "./GameContext";
import { ActionButton, ScreenCard } from "./ui";
import { useSharedState } from "@/hooks/useSharedState";

type Filter = "all" | "Male" | "Female";

const META = "text-xs leading-relaxed text-cyan-100/70";

export function DatingOffice() {
  const { player } = useGame();
  const [filter, setFilter] = useSharedState<Filter>("dating-filter", "all");
  const rel = player.relationship;
  const list = rel.isDating
    ? datingOptions.filter((p) => p.id === rel.partnerId)
    : datingOptions.filter((p) => filter === "all" || p.gender === filter);

  return (
    <ScreenCard
      title="Dating Office"
      subtitle={
        rel.isDating
          ? "You're in a relationship. Keep the spark alive."
          : "Find your special someone. (Health 80+ is part of the win goal.)"
      }
    >
      {/* Relationship vitals */}
      {rel.isDating && (
        <div className="cy-card mb-4 grid gap-4 p-4 sm:grid-cols-2">
          {(
            [
              ["Relationship health", rel.health],
              ["Happiness", rel.happiness],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <div className="mb-1.5 flex justify-between">
                <span className="cy-label">{label}</span>
                <span className="font-mono text-xs text-cyan-100">
                  {value}/100
                </span>
              </div>
              <div className="cy-meter">
                <div
                  className="cy-meter-fill"
                  style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter chips */}
      {!rel.isDating && (
        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", "Female", "Male"] as const).map((f) => (
            <button
              key={f}
              type="button"
              data-on={filter === f}
              onClick={() => setFilter(f)}
              className="cy-pill"
            >
              {f === "all" ? "Everyone" : f}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((person) => (
          <div key={person.id} className="cy-card flex flex-col p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="shrink-0 overflow-hidden rounded-full border-2 border-cyan-400/80 shadow-[0_0_16px_color-mix(in_oklab,var(--accent-400)_65%,transparent)]">
                <PlayerAvatar src={person.image} name={person.name} size={56} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-white">
                  {person.name}
                </p>
                <p className="cy-label mb-1">
                  <span className="accent-gradient-text font-bold">
                    {person.compatibility}%
                  </span>{" "}
                  compatible
                </p>
                <div className="cy-meter" style={{ height: 4 }}>
                  <div
                    className="cy-meter-fill"
                    style={{ width: `${person.compatibility}%` }}
                  />
                </div>
              </div>
            </div>

            <p className={META}>
              <span className="cy-label mr-1.5">Personality</span>
              {person.personality}
            </p>
            <p className={`mb-4 mt-1 ${META}`}>
              <span className="cy-label mr-1.5">Interests</span>
              {person.interests}
            </p>

            <div className="mt-auto flex flex-wrap gap-2">
              {rel.isDating ? (
                <>
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
                </>
              ) : (
                <ActionButton
                  action={{ type: "startDating", personId: person.id }}
                >
                  Start dating
                </ActionButton>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScreenCard>
  );
}
