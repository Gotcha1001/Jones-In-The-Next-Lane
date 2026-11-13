"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { AVATARS } from "@/lib/avatars";
import { MAX_LOCAL_PLAYERS } from "@/lib/game/constants";
import { DEFAULT_GOALS } from "@/lib/game/engine";
import type { Goals } from "@/lib/game/validators";
import { GoalsEditor } from "@/app/components/GoalsEditor";
import { CyberPortrait } from "@/app/components/Cyberportrait";

interface Draft {
  name: string;
  avatar: string;
  goals: Goals;
}

interface SeatTheme {
  /** Any CSS colour (hex or var()). Used for borders, glows and text accents. */
  color: string;
  label: string;
}

/**
 * One neon colour per seat so hot-seat players are easy to tell apart.
 * Seat 1 follows the chosen accent; seats 2-5 stay fixed on purpose so that
 * players never end up with two identical colours.
 */
const SEAT_THEMES: readonly SeatTheme[] = [
  { color: "var(--accent-400)", label: "ACCENT" },
  { color: "#e879f9", label: "MAGENTA" },
  { color: "#a3e635", label: "LIME" },
  { color: "#fbbf24", label: "AMBER" },
  { color: "#fb7185", label: "ROSE" },
];

const CUT = 14; // px size of the clipped corners

const clip = (c: number = CUT): string =>
  `polygon(0 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, ${c}px 100%, 0 calc(100% - ${c}px))`;

/** Transparent version of ANY css colour (hex or var()). Replaces the old `${hex}66` trick. */
const mix = (color: string, pct: number): string =>
  `color-mix(in oklab, ${color} ${pct}%, transparent)`;

// Accent colours used outside the seat themes
const ACCENT = "var(--accent-400)";

// Inline style on purpose: html[data-glow="off"] strips any [style*="text-shadow"]
const GLOW_TEXT = {
  textShadow: `0 0 12px ${mix(ACCENT, 70)}`,
} as const;

const SCANLINES =
  "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px)";

const draft = (i: number): Draft => ({
  name: i === 0 ? "Jones" : `Player ${i + 1}`,
  avatar: AVATARS[i % AVATARS.length],
  goals: DEFAULT_GOALS,
});

const pad = (n: number): string => String(n).padStart(2, "0");

export default function NewLocalGamePage() {
  const router = useRouter();
  const create = useMutation(api.game.createLocalGame);
  const [count, setCount] = useState<number>(1);
  const [activeSeat, setActiveSeat] = useState<number>(0);
  const [players, setPlayers] = useState<Draft[]>(() =>
    Array.from({ length: MAX_LOCAL_PLAYERS }, (_, i) => draft(i)),
  );
  const [busy, setBusy] = useState<boolean>(false);
  // Solo only: play against the computer (Mr Jones)?
  const [rival, setRival] = useState<"none" | "easy" | "medium" | "hard">(
    "none",
  );

  const seat = Math.min(activeSeat, count - 1);
  const active = players[seat];
  const theme = SEAT_THEMES[seat % SEAT_THEMES.length];

  // avatar src -> seat index of the OTHER players who already hold it
  const takenBy = new Map<string, number>();
  players.slice(0, count).forEach((p, i) => {
    if (i !== seat) takenBy.set(p.avatar, i);
  });

  const update = (i: number, patch: Partial<Draft>): void =>
    setPlayers((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    );

  const start = async (): Promise<void> => {
    setBusy(true);
    try {
      const gameId = await create({
        players: players.slice(0, count),
        vsComputer: count === 1 && rival !== "none" ? rival : undefined,
      });
      router.push(`/play/${gameId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't start the game");
      setBusy(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-6xl space-y-8 pb-12">
      {/* ambient neon glow + grid (follows the accent's two colours) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 -z-10 opacity-70"
        style={{
          background: `radial-gradient(600px 300px at 15% 0%, ${mix("var(--accent-from)", 16)}, transparent 70%), radial-gradient(600px 400px at 90% 30%, ${mix("var(--accent-alt)", 16)}, transparent 70%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* header */}
      <div className="space-y-2">
        <p
          className="font-mono text-xs tracking-[0.35em] text-cyan-400"
          style={GLOW_TEXT}
        >
          {"// SOLO · HOT-SEAT PROTOCOL"}
        </p>
        <h1
          className="accent-gradient-text text-4xl font-black uppercase tracking-tight md:text-5xl"
          style={GLOW_TEXT}
        >
          Choose your runner
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Everyone shares this screen and takes turns. Want to play remotely?
          Use the online lobby.
        </p>
      </div>

      {/* player count */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs tracking-[0.3em] text-muted-foreground">
          PLAYERS
        </span>
        {Array.from({ length: MAX_LOCAL_PLAYERS }, (_, i) => i + 1).map((n) => {
          const on = n === count;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              style={{
                clipPath: clip(8),
                borderColor: on ? ACCENT : "transparent",
                boxShadow: on ? `0 0 18px ${mix(ACCENT, 55)}` : undefined,
              }}
              className={`h-11 w-12 border font-mono text-lg font-bold transition ${
                on
                  ? "bg-cyan-400 text-black"
                  : "bg-white/5 text-white/70 hover:bg-cyan-400/15 hover:text-white"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* computer opponent (solo only) */}
      {count === 1 && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs tracking-[0.3em] text-muted-foreground">
            RIVAL
          </span>
          {(
            [
              ["none", "NONE"],
              ["easy", "MR JONES · EASY"],
              ["medium", "MR JONES · MEDIUM"],
              ["hard", "MR JONES · HARD"],
            ] as const
          ).map(([id, label]) => {
            const on = rival === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setRival(id)}
                style={{
                  clipPath: clip(8),
                  borderColor: on ? ACCENT : "transparent",
                  boxShadow: on ? `0 0 18px ${mix(ACCENT, 55)}` : undefined,
                }}
                className={`h-11 border px-4 font-mono text-xs font-bold tracking-widest transition ${
                  on
                    ? "bg-cyan-400 text-black"
                    : "bg-white/5 text-white/70 hover:bg-cyan-400/15 hover:text-white"
                }`}
              >
                {label}
              </button>
            );
          })}
          {rival !== "none" && (
            <p className="w-full text-xs text-muted-foreground">
              🤖 Mr Jones plays his own weeks for the same win conditions. You
              watch everything he does, live.
            </p>
          )}
        </div>
      )}

      {/* seat tabs (hot-seat only) */}
      {count > 1 && (
        <div className="flex flex-wrap gap-3">
          {players.slice(0, count).map((p, i) => {
            const t = SEAT_THEMES[i % SEAT_THEMES.length];
            const on = i === seat;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActiveSeat(i)}
                style={{
                  clipPath: clip(10),
                  borderColor: on ? t.color : "rgba(255,255,255,0.1)",
                  boxShadow: on ? `0 0 20px ${mix(t.color, 40)}` : undefined,
                }}
                className={`flex items-center gap-3 border bg-black/60 py-2 pl-2 pr-6 transition hover:bg-white/5 ${
                  on ? "" : "opacity-60 hover:opacity-100"
                }`}
              >
                <span
                  className="relative h-12 w-12 overflow-hidden"
                  style={{ clipPath: clip(6) }}
                >
                  <CyberPortrait key={p.avatar} src={p.avatar} name={p.name} />
                </span>
                <span className="text-left">
                  <span
                    className="block font-mono text-[10px] tracking-[0.3em]"
                    style={{ color: t.color }}
                  >
                    SEAT {pad(i + 1)}
                  </span>
                  <span className="block max-w-[120px] truncate text-sm font-bold text-white">
                    {p.name || "—"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* main character-select panel */}
      <div
        style={{ clipPath: clip(22), borderColor: mix(theme.color, 33) }}
        className="relative border bg-black/70 p-5 backdrop-blur-sm md:p-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: SCANLINES }}
        />

        <div className="relative grid gap-8 lg:grid-cols-[340px_1fr]">
          {/* hero portrait + handle */}
          <div className="space-y-5">
            <div
              className="relative mx-auto aspect-[3/4] w-full max-w-[340px]"
              style={{
                filter: `drop-shadow(0 0 22px ${mix(theme.color, 53)})`,
              }}
            >
              <div
                className="absolute inset-0 overflow-hidden bg-black"
                style={{ clipPath: clip(26) }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.avatar}
                    initial={{ opacity: 0, scale: 1.08, filter: "blur(6px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0"
                  >
                    <CyberPortrait src={active.avatar} name={active.name} />
                  </motion.div>
                </AnimatePresence>

                <div
                  className="absolute inset-0"
                  style={{ backgroundImage: SCANLINES }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                {/* sweeping scan beam */}
                <motion.div
                  aria-hidden
                  className="absolute inset-x-0 h-16"
                  style={{
                    background: `linear-gradient(to bottom, transparent, ${mix(theme.color, 20)}, transparent)`,
                  }}
                  initial={{ top: "-20%" }}
                  animate={{ top: "110%" }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />

                {/* readout */}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p
                    className="font-mono text-[10px] tracking-[0.35em]"
                    style={{ color: theme.color }}
                  >
                    SEAT {pad(seat + 1)} · {theme.label}
                  </p>
                  <p className="truncate text-2xl font-black uppercase text-white">
                    {active.name || "Unnamed"}
                  </p>
                </div>
              </div>

              {/* border */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 border-2"
                style={{ borderColor: theme.color, clipPath: clip(26) }}
              />
              {/* corner brackets */}
              {(
                [
                  "left-2 top-2 border-l-2 border-t-2",
                  "right-2 top-2 border-r-2 border-t-2",
                ] as const
              ).map((c) => (
                <span
                  key={c}
                  aria-hidden
                  className={`pointer-events-none absolute h-5 w-5 ${c}`}
                  style={{ borderColor: theme.color }}
                />
              ))}
            </div>

            <label className="block space-y-1.5">
              <span className="font-mono text-[10px] tracking-[0.35em] text-muted-foreground">
                HANDLE
              </span>
              <input
                value={active.name}
                maxLength={24}
                onChange={(e) => update(seat, { name: e.target.value })}
                style={{
                  clipPath: clip(10),
                  borderColor: mix(theme.color, 53),
                }}
                className="w-full border bg-black/60 px-4 py-3 text-lg font-bold text-white outline-none transition focus:bg-black"
              />
            </label>
          </div>

          {/* avatar grid */}
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <p
                className="font-mono text-xs tracking-[0.35em]"
                style={{ color: theme.color }}
              >
                {"// SELECT AVATAR"}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {AVATARS.length} AVAILABLE
              </p>
            </div>

            <div className="grid max-h-[560px] grid-cols-3 gap-3 overflow-y-auto p-1 pr-2 sm:grid-cols-4 xl:grid-cols-5">
              {AVATARS.map((src) => {
                const selected = active.avatar === src;
                const holder = takenBy.get(src);
                const locked = holder !== undefined;
                return (
                  <motion.button
                    key={src}
                    type="button"
                    disabled={locked}
                    onClick={() => update(seat, { avatar: src })}
                    whileHover={locked ? undefined : { scale: 1.05, y: -3 }}
                    whileTap={locked ? undefined : { scale: 0.97 }}
                    aria-pressed={selected}
                    aria-label={
                      locked
                        ? `Taken by seat ${(holder ?? 0) + 1}`
                        : "Choose avatar"
                    }
                    className="relative aspect-[4/5] w-full"
                    style={{
                      filter: selected
                        ? `drop-shadow(0 0 12px ${theme.color})`
                        : undefined,
                    }}
                  >
                    <span
                      className="absolute inset-0 overflow-hidden bg-black"
                      style={{
                        clipPath: clip(12),
                        outline: selected
                          ? `3px solid ${theme.color}`
                          : "1px solid rgba(255,255,255,0.12)",
                        outlineOffset: "-3px",
                      }}
                    >
                      <span
                        className={`block h-full w-full transition ${locked ? "opacity-30 grayscale" : selected ? "" : "opacity-80 hover:opacity-100"}`}
                      >
                        <CyberPortrait src={src} name="?" />
                      </span>
                      <span
                        className="absolute inset-0"
                        style={{ backgroundImage: SCANLINES }}
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    </span>

                    {selected && (
                      <span
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-sm text-black"
                        style={{ backgroundColor: theme.color }}
                      >
                        <Check className="h-4 w-4" strokeWidth={3} />
                      </span>
                    )}
                    {locked && (
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 font-mono text-[10px] tracking-widest text-white/80">
                        <Lock className="h-4 w-4" />
                        SEAT {pad((holder ?? 0) + 1)}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <details className="group border-t border-cyan-400/20 pt-4">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-mono text-xs tracking-[0.3em] text-muted-foreground transition hover:text-cyan-300">
                <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
                CUSTOM WIN CONDITIONS
              </summary>
              <div className="mt-4">
                <GoalsEditor
                  goals={active.goals}
                  onChange={(g: Goals) => update(seat, { goals: g })}
                />
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* start */}
      <button
        type="button"
        disabled={busy}
        onClick={() => void start()}
        style={{
          clipPath: clip(14),
          boxShadow: `0 0 30px ${mix(ACCENT, 50)}`,
        }}
        className="accent-gradient-bg group relative inline-flex items-center gap-3 px-10 py-4 text-lg font-black uppercase tracking-widest text-black transition hover:brightness-110 disabled:opacity-60"
      >
        {busy ? "Starting…" : "Start game"}
        <ChevronRight
          className="h-5 w-5 transition group-hover:translate-x-1"
          strokeWidth={3}
        />
      </button>
    </div>
  );
}
