"use client";

import { useGame } from "@/app/components/game/GameContext";
import { useCallback, useState } from "react";

type UiValue = string | number | boolean;

/**
 * Like `useState`, but the value is shared with every player in the game.
 *
 * - The active player's changes are sent to the server (and shown instantly).
 * - Everyone else just reads the value, so they see exactly what the active
 *   player selects, types or toggles.
 *
 * `key` must be unique per control (e.g. "uni-hours"). The server wipes all
 * shared values whenever a place is opened/closed, the player travels or the
 * week ends, so every visit starts fresh.
 */
export function useSharedState<T extends UiValue>(
  key: string,
  initial: T,
): [T, (value: T) => void] {
  const { core, canAct, setUi } = useGame();
  const shared = core.ui?.[key] as T | undefined;
  const [local, setLocal] = useState<T>(() => shared ?? initial);

  const set = useCallback(
    (value: T) => {
      setLocal(value);
      if (canAct) setUi(key, value);
    },
    [canAct, setUi, key],
  );

  return [canAct ? local : (shared ?? initial), set];
}
