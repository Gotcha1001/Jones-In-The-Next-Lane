// app/components/game/ModalPortal.tsx
"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

// "Are we in the browser?" without setState-in-an-effect:
// false while rendering on the server / hydrating, true on the client.
const subscribe = (): (() => void) => () => {};
const getClientSnapshot = (): boolean => true;
const getServerSnapshot = (): boolean => false;

/**
 * Renders a modal on document.body instead of inside the game board.
 *
 * Why: the game board sits in its own stacking layer (`relative z-10`), which
 * is BELOW the sticky navbar (z-30). A `fixed z-50` modal inside it is still
 * trapped in that layer, so the navbar paints over the top of the modal and
 * cuts off its header. Out on <body> the modal's z-index competes with the
 * navbar directly and wins.
 *
 * The `dark` + `cp` wrappers keep the neon theme variables (--c1, --cp-fg…)
 * that the modals use, since those are scoped to `.dark .cp`.
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  const isClient = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  if (!isClient) return null;

  return createPortal(
    <div className="dark">
      <div className="cp">{children}</div>
    </div>,
    document.body,
  );
}
