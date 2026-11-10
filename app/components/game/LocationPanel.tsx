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
      <div className="flex items-center justify-between gap-3 rounded-2xl border bg-gradient-to-r from-indigo-950 to-teal-900 p-4 text-white">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/60">
            {player.name} is at
          </p>
          <h2 className="text-xl font-bold">
            {loc.emoji} {loc.name}
          </h2>
          <p className="text-sm text-white/70">{loc.description}</p>
        </div>
        <ActionButton
          action={{ type: "endTurn" }}
          variant="outline"
          className="border-white/30 bg-white/10 text-white hover:bg-white/20"
        >
          End week
        </ActionButton>
      </div>
      {SCREENS[player.location]()}
    </div>
  );
}
