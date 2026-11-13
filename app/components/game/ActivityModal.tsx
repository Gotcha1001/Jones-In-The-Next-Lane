"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PlayerAvatar } from "@/app/components/PlayerAvatar";
import { CSS } from "./WeekendModal";

export interface ActivityInfo {
  playerName: string;
  playerAvatar?: string;
  /** True when the computer (Mr Jones) did this → pop-up closes by itself. */
  isBot?: boolean;
  kind: "tv" | "games" | "meditate";
  /** e.g. "Watch TV", "Play Video Games", "Gaming Zone". */
  label: string;
  happiness: number;
  time: number;
  /** Unique per session; restarts the video + auto-close timer. */
  at: number;
}

interface Props {
  /** null = closed. */
  info: ActivityInfo | null;
  onClose: () => void;
  /** How long Mr Jones' session stays up before it closes by itself. */
  botAutoCloseMs?: number;
}

const DEFAULT_BOT_AUTO_CLOSE_MS = 6000;

interface Scene {
  /** null = image only (no video). */
  src: string | null;
  poster: string;
  hasAudio: boolean;
  portrait: boolean;
  kicker: string;
  headline: [string, string];
  sys: string;
  verb: string;
  icon: string;
}

const SCENES: Record<ActivityInfo["kind"], Scene> = {
  tv: {
    src: "/videos/tv.mp4",
    poster: "/tv.jpg",
    hasAudio: true,
    portrait: false,
    kicker: "Now watching",
    headline: ["TV", "TIME"],
    sys: "SYS.TV_FEED",
    verb: "watching TV",
    icon: "📺",
  },
  games: {
    src: "/videos/gaming.mp4",
    poster: "/gaming.jpg",
    hasAudio: false,
    portrait: true,
    kicker: "Now playing",
    headline: ["GAME", "ON"],
    sys: "SYS.GAME_LINK",
    verb: "playing video games",
    icon: "🎮",
  },
  meditate: {
    src: null,
    poster: "/meditate.jpg",
    hasAudio: false,
    portrait: false,
    kicker: "Now meditating",
    headline: ["INNER", "PEACE"],
    sys: "SYS.ZEN_LINK",
    verb: "meditating",
    icon: "🧘",
  },
};

/**
 * Cyberpunk pop-up shown while someone watches TV, plays games or meditates.
 * Same frame / glitch title / scanlines / grid floor as the weekend recap
 * (shared `wk-` styles), but wider so the video gets the room it needs.
 * The portrait gaming clip is centred at full height instead of letterboxed.
 * Meditate has no video: it shows its image instead.
 */
export default function ActivityModal({
  info,
  onClose,
  botAutoCloseMs = DEFAULT_BOT_AUTO_CLOSE_MS,
}: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const reduceMotion = useReducedMotion();
  const [failedAt, setFailedAt] = useState<number | null>(null);
  const [soundOnAt, setSoundOnAt] = useState<number | null>(null);
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

  // Mr Jones' session closes by itself. Depends on `info` so two sessions in
  // a row restart the timer.
  const autoClose = info?.isBot === true;
  useEffect(() => {
    if (!info || !autoClose) return;
    const id = window.setTimeout(() => onCloseRef.current(), botAutoCloseMs);
    return () => window.clearTimeout(id);
  }, [info, autoClose, botAutoCloseMs]);

  const scene = info ? SCENES[info.kind] : null;
  const who = info ? (info.isBot ? info.playerName : "You") : "";
  const videoSrc = scene?.src ?? null;
  const showVideo =
    info !== null && videoSrc !== null && failedAt !== info.at && !reduceMotion;
  const sound = info !== null && soundOnAt === info.at;

  return (
    <AnimatePresence>
      {info && scene && (
        <motion.div
          className="wk fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/90 p-3 backdrop-blur-sm sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <style>{CSS}</style>

          {/* Atmosphere: scanlines + moving neon grid floor */}
          <div className="wk-scan pointer-events-none fixed inset-0" />
          <div
            className="wk-floor pointer-events-none fixed inset-x-0 bottom-0 h-1/2 opacity-[0.14]"
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={info.label}
            className={`wk-glow relative my-auto w-full ${
              scene.portrait ? "max-w-xl" : "max-w-5xl"
            }`}
            initial={reduceMotion ? false : { scale: 0.94, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { scale: 0.96, y: 16, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
          >
            <div className="wk-frame">
              <div className="wk-inner relative text-left text-[color:var(--wk-fg)]">
                <div className="wk-scan pointer-events-none absolute inset-0 z-10" />

                {/* Who is doing this? */}
                <div
                  className="relative flex items-center gap-3 border-b border-[color:var(--wk-line)] px-5 py-3"
                  style={{
                    background:
                      "linear-gradient(90deg,color-mix(in oklab,var(--c1) 18%,transparent),transparent)",
                  }}
                >
                  {info.playerAvatar && (
                    <PlayerAvatar
                      src={info.playerAvatar}
                      name={info.playerName}
                      size={44}
                      className="shrink-0 ring-2 ring-[color:var(--c1)]"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--wk-faint)]">
                      {info.isBot ? "🤖 Computer player" : "Player"}
                    </p>
                    <p className="truncate text-xl font-black uppercase leading-tight tracking-tight text-[color:var(--c1)]">
                      {info.playerName}
                    </p>
                  </div>
                  <h2 className="hidden text-2xl font-black uppercase leading-none tracking-tight sm:block sm:text-3xl">
                    <span
                      className="wk-glitch text-[color:var(--c1)]"
                      data-text={scene.headline[0]}
                    >
                      {scene.headline[0]}
                    </span>{" "}
                    <span
                      className="wk-glitch text-[color:var(--wk-fg)]"
                      data-text={scene.headline[1]}
                    >
                      {scene.headline[1]}
                    </span>
                  </h2>
                </div>

                {/* HUD bar */}
                <div className="relative flex items-center justify-between border-b border-[color:var(--wk-line)] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--wk-faint)]">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full bg-red-500"
                      style={{ animation: "wk-blink 1.4s infinite" }}
                    />
                    {scene.kicker} · {info.label}
                  </span>
                  <span className="text-[color:var(--c2)]">{scene.sys}</span>
                </div>

                <div className="relative space-y-4 p-4 sm:p-6">
                  {/* Video / image stage */}
                  <div className="relative mx-auto flex justify-center">
                    <div
                      className={`relative overflow-hidden bg-black ring-1 ring-[color:var(--c1)] shadow-[0_0_28px_color-mix(in_oklab,var(--c1)_45%,transparent)] ${
                        scene.portrait
                          ? "aspect-[9/16] h-[min(62vh,640px)]"
                          : "aspect-video w-full"
                      }`}
                    >
                      {showVideo && videoSrc ? (
                        <video
                          key={info.at}
                          src={videoSrc}
                          poster={scene.poster}
                          autoPlay
                          loop
                          muted={!sound}
                          playsInline
                          preload="auto"
                          onError={() => setFailedAt(info.at)}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={scene.poster}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}

                      {/* Soft vignette + REC-style corner tag */}
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55))]" />
                      <div className="wk-scan pointer-events-none absolute inset-0 opacity-70" />
                      {showVideo && (
                        <span className="absolute left-3 top-3 flex items-center gap-2 bg-black/60 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-white">
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-red-500"
                            style={{ animation: "wk-blink 1.4s infinite" }}
                          />
                          Live
                        </span>
                      )}

                      {showVideo && scene.hasAudio && (
                        <button
                          type="button"
                          onClick={() => setSoundOnAt(sound ? null : info.at)}
                          aria-pressed={sound}
                          aria-label={sound ? "Mute video" : "Unmute video"}
                          className="absolute right-3 top-3 bg-black/60 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-white transition hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--c2)]"
                        >
                          {sound ? "🔊 Sound on" : "🔇 Sound off"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Result */}
                  <div className="relative border border-[color:var(--wk-line)] bg-[color:var(--wk-tint)] p-4 pl-5">
                    <span
                      className="absolute inset-y-0 left-0 w-1"
                      style={{
                        background:
                          "linear-gradient(180deg,var(--c1),var(--c2))",
                      }}
                    />
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--wk-faint)]">
                      {scene.icon} {info.isBot ? info.playerName : "You"} spent
                      time {scene.verb}
                    </p>
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-xl font-black uppercase tracking-tight">
                      <span className="text-[color:var(--c1)]">
                        +{info.happiness} 😊
                      </span>
                      <span className="text-[color:var(--c2)]">
                        −{info.time} ⏱
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--wk-muted)]">
                      {who === "You" ? "You unwind" : `${who} unwinds`} for a
                      bit — happiness up, time spent.
                    </p>
                  </div>

                  {autoClose && (
                    <div
                      className="h-1 w-full overflow-hidden bg-[color:var(--wk-tint)]"
                      aria-hidden
                    >
                      <motion.div
                        key={info.at}
                        className="h-full"
                        style={{
                          background:
                            "linear-gradient(90deg,var(--c1),var(--c2))",
                        }}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                          duration: botAutoCloseMs / 1000,
                          ease: "linear",
                        }}
                      />
                    </div>
                  )}

                  <button
                    ref={buttonRef}
                    type="button"
                    onClick={onClose}
                    className="wk-btn w-full px-6 py-3 text-sm"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
