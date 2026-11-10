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

export function Mall() {
  const { player } = useGame();
  return (
    <ScreenCard
      title="Shopping Mall"
      subtitle="Buy items to improve your life. Each item can only be bought once."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {shopItems.map((item) => {
          const owned = player.possessions.includes(item.name);
          return (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-xl border p-3"
            >
              <div>
                <p className="font-medium">
                  {item.image} {item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  ${item.price}
                  {item.happiness ? ` · +${item.happiness} 😊` : ""}
                  {item.energy ? ` · +${item.energy} ⚡` : ""}
                </p>
              </div>
              <ActionButton
                action={{ type: "buyItem", itemName: item.name }}
                disabled={owned || player.cash < item.price}
              >
                {owned ? "Owned" : "Buy"}
              </ActionButton>
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
          <div
            key={m.id}
            className="flex items-center justify-between rounded-xl border p-3"
          >
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-xs text-muted-foreground">
                ${m.price} · +{m.energy} ⚡ · +{m.happiness} 😊
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
      <p className="mb-2 text-sm">
        Health: <strong>{player.relationship.health}</strong>/100 (goal: 80+)
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {healingServices.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-xl border p-3"
          >
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">
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
            <div
              key={id}
              className="flex items-center justify-between rounded-xl border p-3"
            >
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">
                  {a.description} · ${a.cost} · {a.time}⏱ · −{a.energy} ⚡ · +
                  {a.happiness} 😊
                </p>
              </div>
              <ActionButton
                action={{ type: "leisure", activity: id }}
                disabled={player.cash < a.cost || player.energy < a.energy}
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
