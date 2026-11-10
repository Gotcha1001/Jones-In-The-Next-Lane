// hooks/useWalkAnimation.ts
"use client";

import { useEffect, useRef, useState } from "react";
import {
  easeInOutQuad,
  pointAlongRoute,
  type Point,
} from "@/lib/game/mapPaths";

export interface WalkFrame {
  readonly position: Point;
  /** Eased progress 0..1 */
  readonly progress: number;
}

interface RouteFrame extends WalkFrame {
  /** The route this frame was computed for. */
  readonly route: readonly Point[];
}

/**
 * Animates along `route` for `durationMs`. Returns null when there is no route.
 * `onComplete` fires once when the walk finishes.
 */
export function useWalkAnimation(
  route: readonly Point[] | null,
  durationMs: number,
  onComplete: () => void,
): WalkFrame | null {
  const [latest, setLatest] = useState<RouteFrame | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!route || route.length < 2) return;

    let rafId = 0;
    let startTime: number | null = null;
    let cancelled = false;

    // setState only happens inside this animation-frame callback (an external
    // system notifying us), never synchronously in the effect body.
    const tick = (timestamp: number): void => {
      if (cancelled) return;
      if (startTime === null) startTime = timestamp;
      const raw = Math.min((timestamp - startTime) / durationMs, 1);
      const eased = easeInOutQuad(raw);
      setLatest({
        route,
        position: pointAlongRoute(route, eased),
        progress: eased,
      });

      if (raw < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        onCompleteRef.current();
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [route, durationMs]);

  // Derived during render: no route -> null; a frame left over from a previous
  // route -> start at the beginning of the new one.
  if (!route || route.length < 2) return null;
  if (latest && latest.route === route) return latest;
  return { position: route[0], progress: 0 };
}
