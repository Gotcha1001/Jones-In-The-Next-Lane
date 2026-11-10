"use client";

import {
  apartmentTiers,
  homeActivities,
  SUBJECTS,
  tierFromRent,
  tierOrder,
  upgradeFee,
} from "@/lib/game/data/services";
import type { HomeActivity } from "@/lib/game/validators";
import { RENT_INTERVAL_WEEKS } from "@/lib/game/engine";
import { useGame } from "./GameContext";
import { ActionButton, ScreenCard } from "./ui";

export function RentalOffice() {
  const { player } = useGame();
  const { rental } = player;
  const current = rental.hasApartment ? tierFromRent(rental.rentAmount) : null;
  const weeksSince =
    rental.lastPaidWeek !== null ? player.week - rental.lastPaidWeek : 0;
  const nextDue = Math.max(0, RENT_INTERVAL_WEEKS - weeksSince);

  return (
    <ScreenCard
      title="Rental Office"
      subtitle="Rent an apartment, upgrade it, and pay your rent on time."
    >
      {rental.hasApartment ? (
        <p
          className={`mb-3 text-sm ${rental.rentDue ? "font-semibold text-red-500" : ""}`}
        >
          {rental.rentDue
            ? `⚠️ Rent of $${rental.rentAmount} is overdue — 20% of wages are garnished.`
            : `Your rent is $${rental.rentAmount}/month. Next payment due in ${nextDue} week(s).`}
        </p>
      ) : (
        <p className="mb-3 text-sm text-muted-foreground">
          You don&apos;t have an apartment yet.
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        {tierOrder.map((tier) => {
          const t = apartmentTiers[tier];
          const isCurrent = current === tier;
          const below =
            current !== null &&
            tierOrder.indexOf(tier) < tierOrder.indexOf(current);
          const cost = current === null ? t.deposit : upgradeFee(current, tier);
          return (
            <div
              key={tier}
              className={`rounded-xl border p-3 ${isCurrent ? "border-indigo-500" : ""}`}
            >
              <p className="font-semibold">{t.label}</p>
              <p className="text-xs text-muted-foreground">
                ${t.rentAmount}/month ·{" "}
                {current === null
                  ? `$${t.deposit} deposit`
                  : `$${cost} upgrade`}
              </p>
              <div className="mt-2">
                {current === null ? (
                  <ActionButton
                    action={{ type: "rentApartment", tier }}
                    disabled={player.cash < t.deposit}
                  >
                    Rent
                  </ActionButton>
                ) : isCurrent ? (
                  <span className="text-xs font-semibold text-indigo-500">
                    Current home
                  </span>
                ) : (
                  <ActionButton
                    action={{ type: "upgradeApartment", tier }}
                    disabled={below || player.cash < cost}
                  >
                    Upgrade
                  </ActionButton>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {rental.hasApartment && (
        <div className="mt-4">
          <ActionButton
            action={{ type: "payRent" }}
            disabled={player.cash < rental.rentAmount}
          >
            Pay rent (${rental.rentAmount})
          </ActionButton>
        </div>
      )}
    </ScreenCard>
  );
}

export function Apartment() {
  const { player } = useGame();
  if (!player.rental.hasApartment) {
    return (
      <ScreenCard
        title="Apartment"
        subtitle="You need to rent an apartment first! Visit the Rental Office."
      >
        <span />
      </ScreenCard>
    );
  }
  const activities = Object.keys(homeActivities) as HomeActivity[];
  return (
    <ScreenCard
      title="Your apartment"
      subtitle="Rest, relax, or study at home."
    >
      <div className="flex flex-wrap gap-2">
        <ActionButton
          action={{ type: "sleep" }}
          disabled={player.energy >= 100}
        >
          😴 Sleep (30⏱)
        </ActionButton>
        {activities.map((a) => (
          <ActionButton
            key={a}
            action={{ type: "homeActivity", activity: a }}
            variant="outline"
          >
            {homeActivities[a].name} ({homeActivities[a].time}⏱)
          </ActionButton>
        ))}
      </div>
      <h4 className="mb-2 mt-4 text-sm font-semibold">
        Study at home (15⏱ per hour)
      </h4>
      <div className="grid gap-2 sm:grid-cols-2">
        {SUBJECTS.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-xl border p-3"
          >
            <div>
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">
                Level {player.subjects[s.id]}/100
              </p>
            </div>
            <ActionButton
              action={{ type: "studySubject", subject: s.id, hours: 1 }}
              variant="outline"
              disabled={player.subjects[s.id] >= 100}
            >
              Study
            </ActionButton>
          </div>
        ))}
      </div>
    </ScreenCard>
  );
}
