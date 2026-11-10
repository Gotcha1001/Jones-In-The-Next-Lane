// components/game/PlaceModal.tsx
"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { PLACE_BY_ID, SOUNDS, type LocationId } from "@/lib/game/places";
import { playLoop, playOnce, stopLoop } from "@/lib/game/audio";
import PlaceVideoHeader from "./PlaceVideoHeader";
import SoundToggle from "./SoundToggle";

interface PlaceModalProps {
  /** Which place is open. null = closed. */
  locationId: LocationId | null;
  onClose: () => void;
  /** Your existing place content (the facts / actions that currently sit under the board). */
  children: ReactNode;
  /** Override the NPC's opening line. */
  greeting?: string;
}

export default function PlaceModal({
  locationId,
  onClose,
  children,
  greeting,
}: PlaceModalProps) {
  const place = locationId ? PLACE_BY_ID[locationId] : null;
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Place-specific music while open.
  const music = place?.media.music ?? null;
  const isOpen = place !== null;
  useEffect(() => {
    if (!isOpen) return;
    playLoop("music", music);
    return () => stopLoop("music");
  }, [isOpen, music]);

  // Escape to close, lock page scroll, focus the close button.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleClose = (): void => {
    playOnce(SOUNDS.click);
    onClose();
  };

  return (
    <AnimatePresence>
      {place && (
        <motion.div
          key="place-overlay"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={handleClose}
        >
          <motion.div
            key={place.id}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative flex max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-slate-950 text-white shadow-2xl ring-1 ring-white/10 sm:max-h-[92vh] sm:rounded-3xl"
            initial={{ opacity: 0, y: 48, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Video header */}
            <header className="relative h-52 shrink-0 sm:h-64 md:h-72">
              <PlaceVideoHeader place={place} />

              <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                <SoundToggle />
                <button
                  ref={closeRef}
                  type="button"
                  onClick={handleClose}
                  aria-label={`Leave ${place.name}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="absolute inset-x-0 bottom-0 z-10 flex items-end gap-4 p-4 sm:p-6">
                <img
                  src={place.media.portrait}
                  alt={place.media.portraitAlt}
                  className="h-20 w-20 shrink-0 rounded-full border-4 border-white/80 object-cover shadow-xl sm:h-28 sm:w-28"
                />
                <div className="min-w-0">
                  <h2
                    id={titleId}
                    className="truncate text-2xl font-extrabold tracking-tight drop-shadow sm:text-4xl"
                  >
                    {place.name}
                  </h2>
                  <p className="text-sm text-white/80 sm:text-base">
                    {place.description}
                  </p>
                </div>
              </div>
            </header>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
              <p
                className={`rounded-2xl bg-gradient-to-r ${place.media.accent} px-5 py-4 text-sm italic text-white shadow-md ring-1 ring-white/10 sm:text-base`}
              >
                “{greeting ?? place.media.greeting}”
              </p>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
