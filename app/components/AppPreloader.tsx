// app/components/AppPreloader.tsx
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BACKGROUND_IMAGES,
  BACKGROUND_VIDEOS,
  CRITICAL_IMAGES,
  HERO_VIDEOS,
  preloadImage,
  preloadVideo,
  runPool,
} from "@/lib/preload";

const SESSION_KEY = "jones-preloaded";
const MAX_WAIT_MS = 8000; // never trap the user behind the loader

/**
 * Shows a progress screen until critical images + hero videos are ready,
 * then reveals the app and keeps warming the rest in the background.
 * The children are rendered immediately (hidden behind the overlay) so
 * Clerk / Convex / hydration run IN PARALLEL with the downloads.
 */
export function AppPreloader({ children }: { children: ReactNode }) {
  // Skip the loader on later visits in the same tab session.
  const [ready, setReady] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [gone, setGone] = useState<boolean>(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let alreadyDone = false;
    try {
      alreadyDone = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {}

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const saveData = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection?.saveData;

    const finish = () => {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {}
      setProgress(1);
      setReady(true);
    };

    const background = () => {
      const run = () => {
        // Low priority: images first, then videos, 2 at a time.
        void runPool(BACKGROUND_IMAGES, 3, preloadImage).then(() => {
          if (saveData) return; // respect Data Saver
          return runPool([...HERO_VIDEOS, ...BACKGROUND_VIDEOS], 2, (src) =>
            preloadVideo(src, 30000),
          );
        });
      };
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(run, { timeout: 3000 });
      } else {
        setTimeout(run, 1500);
      }
    };

    if (alreadyDone) {
      finish();
      background();
      return;
    }

    // Critical = images + first hero video only (not all 8 videos).
    const critical: Array<() => Promise<void>> = [
      ...CRITICAL_IMAGES.map((s) => () => preloadImage(s)),
      ...(saveData || reduceMotion
        ? []
        : [() => preloadVideo(HERO_VIDEOS[0], 6000)]),
    ];

    let done = 0;
    const total = critical.length;
    const bump = () => setProgress(Math.min(0.98, ++done / total));

    const timeout = new Promise<void>((r) => setTimeout(r, MAX_WAIT_MS));
    const work = runPool(critical, 4, (fn) => fn(), bump);

    void Promise.race([work, timeout]).then(() => {
      finish();
      background();
    });
  }, []);

  // Remove the overlay from the DOM after its fade-out finishes.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setGone(true), 600);
    return () => clearTimeout(t);
  }, [ready]);

  return (
    <>
      {children}
      {!gone && (
        <div
          aria-hidden={ready}
          role="status"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#05060a] transition-opacity duration-500"
          style={{
            opacity: ready ? 0 : 1,
            pointerEvents: ready ? "none" : "auto",
          }}
        >
          <h1 className="text-2xl font-black uppercase tracking-[0.3em] text-white">
            Jones <span className="text-cyan-400">in the Fast Lane</span>
          </h1>
          <div className="h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 transition-[width] duration-300 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-white/60">
            Loading assets… {Math.round(progress * 100)}%
          </p>
        </div>
      )}
    </>
  );
}
