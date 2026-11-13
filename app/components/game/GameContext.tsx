"use client";

import { createContext, useContext } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import type {
  GameAction,
  GameCore,
  PlayerState,
  Seat,
} from "@/lib/game/validators";

export interface GameCtxValue {
  gameId: Id<"games">;
  core: GameCore;
  seats: readonly Seat[];
  /** The player whose turn it currently is. */
  player: PlayerState;
  /** True when the signed-in user may act right now. */
  canAct: boolean;
  pending: boolean;
  run: (action: GameAction) => Promise<boolean>;
  /** Share a UI selection/input with every player (see useSharedState). */
  setUi: (key: string, value: string | number | boolean) => void;
}

export const GameCtx = createContext<GameCtxValue | null>(null);

export function useGame(): GameCtxValue {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error("useGame must be used inside <GameView>");
  return ctx;
}
