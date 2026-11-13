"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface WeekendInfo {
  playerName: string;
  week: number;
  title: string;
  description: string;
}

interface Props {
  /** null = closed. */
  info: WeekendInfo | null;
  onClose: () => void;
}

/** Shown when a week ends: what randomly happened over the weekend. */
export default function WeekendModal({ info, onClose }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const isOpen = info !== null;
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape" || e.key === "Enter") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    buttonRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Weekend recap"
            className="accent-card w-full max-w-md rounded-2xl border border-cyan-400/40 bg-black/80 p-6 text-center shadow-[0_0_30px_var(--accent-400)]"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <p className="text-xs uppercase tracking-widest text-cyan-300/70">
              📅 Week {info.week} has ended
            </p>
            <h2 className="accent-gradient-text mt-2 text-2xl font-bold">
              Over the weekend…
            </h2>
            <p className="mt-4 text-lg font-semibold text-white">
              🎲 {info.title}
            </p>
            <p className="mt-1 text-sm text-cyan-100/90">{info.description}</p>
            <p className="mt-4 text-xs text-cyan-300/70">
              {info.playerName} is back home. A new week begins!
            </p>
            <button
              ref={buttonRef}
              type="button"
              onClick={onClose}
              className="mt-5 rounded-lg border border-cyan-400/60 bg-cyan-500/15 px-5 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-500/30"
            >
              Start week {info.week + 1}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
