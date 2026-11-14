"use client";

import { shopItems } from "@/lib/game/data/items";
import {
  meals,
  healingServices,
  leisureActivities,
} from "@/lib/game/data/services";
import type { LeisureId } from "@/lib/game/validators";
import { useGame } from "./GameContext";
import { ActionButton, ScreenCard } from "./ui";

const ROW =
  "accent-card flex items-center justify-between rounded-xl p-3 transition hover:border-cyan-400/70 hover:shadow-[0_0_14px_var(--accent-400)]";
const ITEM_CARD =
  "accent-card flex flex-col gap-3 rounded-xl p-3 transition hover:border-cyan-400/70 hover:shadow-[0_0_14px_var(--accent-400)]";
const NAME = "font-medium text-white";
const META = "text-xs text-cyan-300/80";

export function Mall() {
  const { player } = useGame();
  return (
    <ScreenCard
      title="Shopping Mall"
      subtitle="Buy items to improve your life. Each item can only be bought once."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shopItems.map((item) => {
          const owned = player.possessions.includes(item.name);
          return (
            <div key={item.name} className={ITEM_CARD}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                className="aspect-square w-full rounded-lg border border-cyan-400/40 object-cover"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className={`${NAME} truncate text-base`}>{item.name}</p>
                  <p className={META}>
                    ${item.price}
                    {item.happiness ? ` · +${item.happiness} 😊` : ""}
                  </p>
                </div>
                <ActionButton
                  action={{ type: "buyItem", itemName: item.name }}
                  disabled={owned || player.cash < item.price}
                >
                  {owned ? "Owned" : "Buy"}
                </ActionButton>
              </div>
            </div>
          );
        })}
      </div>
    </ScreenCard>
  );
}

export function FastFood() {
  const { player } = useGame();
  return (
    <ScreenCard
      title="Python Burgers"
      subtitle="Each meal takes 10 time units."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {meals.map((m) => (
          <div key={m.id} className={ROW}>
            <div>
              <p className={NAME}>{m.name}</p>
              <p className={META}>
                ${m.price} · +{m.happiness} 😊 · counts as eating for the week
              </p>
            </div>
            <ActionButton
              action={{ type: "buyMeal", mealId: m.id }}
              disabled={player.cash < m.price}
            >
              Eat
            </ActionButton>
          </div>
        ))}
      </div>
    </ScreenCard>
  );
}

export function HealingCentre() {
  const { player } = useGame();
  return (
    <ScreenCard
      title="Zen Healing Centre"
      subtitle="Boosts relationship health and happiness (15 time units)."
    >
      <p className="mb-2 text-sm text-cyan-100">
        Health:{" "}
        <strong className="accent-gradient-text">
          {player.relationship.health}
        </strong>
        /100 (goal: 80+)
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {healingServices.map((s) => (
          <div key={s.id} className={ROW}>
            <div>
              <p className={NAME}>{s.name}</p>
              <p className={META}>
                ${s.price} · +{s.health} ❤️ · +{s.happiness} 😊
              </p>
            </div>
            <ActionButton
              action={{ type: "healing", serviceId: s.id }}
              disabled={player.cash < s.price}
            >
              Book
            </ActionButton>
          </div>
        ))}
      </div>
    </ScreenCard>
  );
}

export function LeisureCentre() {
  const { player } = useGame();
  const ids = Object.keys(leisureActivities) as LeisureId[];
  return (
    <ScreenCard
      title="Leisure Center"
      subtitle="Have fun and recover your spirits."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {ids.map((id) => {
          const a = leisureActivities[id];
          return (
            <div key={id} className={ROW}>
              <div>
                <p className={NAME}>{a.name}</p>
                <p className={META}>
                  {a.description} · ${a.cost} · {a.time}⏱ · +{a.happiness} 😊
                </p>
              </div>
              <ActionButton
                action={{ type: "leisure", activity: id }}
                disabled={player.cash < a.cost}
              >
                Go
              </ActionButton>
            </div>
          );
        })}
      </div>
    </ScreenCard>
  );
}
