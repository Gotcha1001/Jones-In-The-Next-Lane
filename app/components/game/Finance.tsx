"use client";

import { useState } from "react";
import { INTEREST_RATE } from "@/lib/game/engine";
import { useGame } from "./GameContext";
import { ActionButton, ScreenCard } from "./ui";

export function Bank() {
  const { player, core } = useGame();
  const [amount, setAmount] = useState(50);
  const [qty, setQty] = useState(1);
  const { savings, lastInterestWeek } = player.bankAccount;
  const interestDone = lastInterestWeek === player.week;

  return (
    <div className="space-y-4">
      <ScreenCard
        title="Python Bank"
        subtitle={`Savings earn ${INTEREST_RATE * 100}% interest, collectable once per week.`}
      >
        <div className="mb-3 flex gap-6 text-sm">
          <p>
            Cash: <strong>${player.cash.toLocaleString()}</strong>
          </p>
          <p>
            Savings: <strong>${savings.toLocaleString()}</strong>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) =>
              setAmount(Math.max(1, Number(e.target.value) || 1))
            }
            className="w-28 rounded-lg border bg-background px-3 py-1.5 text-sm"
          />
          <ActionButton
            action={{ type: "deposit", amount }}
            disabled={player.cash < amount}
          >
            Deposit
          </ActionButton>
          <ActionButton
            action={{ type: "withdraw", amount }}
            variant="outline"
            disabled={savings < amount}
          >
            Withdraw
          </ActionButton>
          <ActionButton
            action={{ type: "collectInterest" }}
            variant="outline"
            disabled={interestDone || savings <= 0}
          >
            {interestDone ? "Interest collected" : "Collect interest"}
          </ActionButton>
        </div>
      </ScreenCard>

      <ScreenCard
        title="Shares market"
        subtitle="Prices move after every full round of turns."
      >
        <label className="mb-3 block text-sm">
          Quantity:{" "}
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) =>
              setQty(Math.max(1, Math.floor(Number(e.target.value)) || 1))
            }
            className="w-20 rounded-lg border bg-background px-2 py-1"
          />
        </label>
        <div className="grid gap-2">
          {core.market.map((s) => {
            const owned = player.shares.find((h) => h.id === s.id)?.owned ?? 0;
            return (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2 rounded-xl border p-3"
              >
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ${s.price.toFixed(2)}{" "}
                    <span
                      className={
                        s.change >= 0 ? "text-emerald-500" : "text-red-500"
                      }
                    >
                      {s.change >= 0 ? "▲" : "▼"}{" "}
                      {Math.abs(s.change).toFixed(1)}%
                    </span>{" "}
                    · you own {owned}
                  </p>
                </div>
                <div className="flex gap-2">
                  <ActionButton
                    action={{ type: "buyShares", shareId: s.id, amount: qty }}
                    disabled={player.cash < s.price * qty}
                  >
                    Buy
                  </ActionButton>
                  <ActionButton
                    action={{ type: "sellShares", shareId: s.id, amount: qty }}
                    variant="outline"
                    disabled={owned < qty}
                  >
                    Sell
                  </ActionButton>
                </div>
              </div>
            );
          })}
        </div>
      </ScreenCard>
    </div>
  );
}
