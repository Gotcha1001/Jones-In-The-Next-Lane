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

const ROW =
  "accent-card flex items-center justify-between rounded-xl p-3 transition hover:border-cyan-400/70 hover:shadow-[0_0_14px_var(--accent-400)]";
const TIER =
  "accent-card rounded-xl p-3 transition hover:border-cyan-400/70 hover:shadow-[0_0_14px_var(--accent-400)]";
const TIER_CURRENT =
  "accent-card rounded-xl border-cyan-400 p-3 shadow-[0_0_18px_var(--accent-400)]";
const NAME = "font-medium text-white";
const META = "text-xs text-cyan-300/80";

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
          className={`mb-3 text-sm ${
            rental.rentDue ? "font-semibold text-red-500" : "text-cyan-100"
          }`}
        >
          {rental.rentDue
            ? `⚠️ Rent of $${rental.rentAmount} is overdue — 20% of wages are garnished.`
            : `Your rent is $${rental.rentAmount}/month. Next payment due in ${nextDue} week(s).`}
        </p>
      ) : (
        <p className="mb-3 text-sm text-cyan-300/80">
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
            <div key={tier} className={isCurrent ? TIER_CURRENT : TIER}>
              <p className="font-semibold text-white">{t.label}</p>
              <p className={META}>
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
                  <span className="accent-gradient-text text-xs font-semibold">
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
          disabled={player.happiness >= 100}
        >
          😴 Rest (30⏱, +10 😊)
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
      <h4 className="accent-gradient-text mb-2 mt-4 text-sm font-semibold">
        Study at home (15⏱ per hour)
      </h4>
      <div className="grid gap-2 sm:grid-cols-2">
        {SUBJECTS.map((s) => (
          <div key={s.id} className={ROW}>
            <div>
              <p className="text-sm font-medium text-white">{s.name}</p>
              <p className={META}>Level {player.subjects[s.id]}/100</p>
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
