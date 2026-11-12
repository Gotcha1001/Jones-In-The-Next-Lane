"use client";

import type { ReactElement } from "react";
import { locations } from "@/lib/game/data/locations";
import type { LocationId } from "@/lib/game/validators";
import { useGame } from "./GameContext";
import { Apartment, RentalOffice } from "./Housing";
import { EmploymentOffice, University, Workplace } from "./Career";
import { FastFood, HealingCentre, LeisureCentre, Mall } from "./Shops";
import { Bank } from "./Finance";
import { DatingOffice } from "./Dating";
import { ActionButton } from "./ui";

/** Exhaustive: adding a LocationId without a screen is a compile error. */
const SCREENS: Record<LocationId, () => ReactElement> = {
  rentoffice: () => <RentalOffice />,
  apartment: () => <Apartment />,
  university: () => <University />,
  employmentOffice: () => <EmploymentOffice />,
  workplace: () => <Workplace />,
  mall: () => <Mall />,
  leisureCenter: () => <LeisureCentre />,
  bank: () => <Bank />,
  fastFood: () => <FastFood />,
  datingOffice: () => <DatingOffice />,
  healingCentre: () => <HealingCentre />,
};

export function LocationPanel() {
  const { player } = useGame();
  const loc = locations[player.location];
  return (
    <div className="space-y-3">
      <div className="accent-card flex items-center justify-between gap-3 rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-slate-950 via-cyan-950/60 to-slate-950 p-4 text-white shadow-[0_0_24px_var(--accent-400)]">
        <div>
          <p className="text-xs uppercase tracking-widest text-cyan-300/70">
            {player.name} is at
          </p>
          <h2 className="accent-gradient-text text-xl font-bold">
            {loc.emoji} {loc.name}
          </h2>
          <p className="text-sm text-cyan-100/80">{loc.description}</p>
        </div>
        <ActionButton
          action={{ type: "endTurn" }}
          variant="outline"
          className="border-cyan-400/50 bg-cyan-500/10 text-cyan-100 transition hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_14px_var(--accent-400)]"
        >
          End week
        </ActionButton>
      </div>
      {SCREENS[player.location]()}
    </div>
  );
}
