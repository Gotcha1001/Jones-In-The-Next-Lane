"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Banknote,
  Check,
  Crown,
  GraduationCap,
  Heart,
  HeartPulse,
  PartyPopper,
  PiggyBank,
  ShoppingBag,
  Smile,
  Target,
  TrendingUp,
  Trophy,
  Briefcase,
  Clock,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import type { PlayerState, Stock } from "@/lib/game/validators";
import { averageEducation, evaluateGoals } from "@/lib/game/engine";
import type { GoalProgress } from "@/lib/game/engine";
import { SUBJECTS } from "@/lib/game/data/services";
import { CyberPortrait } from "../Cyberportrait";
import { Section, SubHead, Tile, TileGrid } from "./RulesUi";
import { Confetti } from "./Confetti";
import { useGame } from "./GameContext";
import { SaveDialog } from "./SaveDialog";

interface Props {
  roomId?: Id<"rooms">;
  isHost?: boolean;
}

// Inline style on purpose: html[data-glow="off"] strips any [style*="text-shadow"]
const GLOW_TEXT = {
  textShadow:
    "0 0 12px color-mix(in oklab, var(--accent-400) 70%, transparent)",
} as const;

const EASE = [0.22, 1, 0.36, 1] as const;

/** One colour per seat so players are easy to tell apart in every chart. */
const SEAT_COLORS = ["#22d3ee", "#e879f9", "#a3e635", "#fbbf24", "#fb7185"];
const seatColor = (seat: number): string =>
  SEAT_COLORS[seat % SEAT_COLORS.length];

const clip = (c: number): string =>
  `polygon(0 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, ${c}px 100%, 0 calc(100% - ${c}px))`;

const money = (n: number): string => `$${Math.round(n).toLocaleString()}`;

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

// ── Derived numbers ─────────────────────────────────────────────────────────
interface Row {
  p: PlayerState;
  goals: GoalProgress;
  goalsMet: number;
  stocks: number;
  savings: number;
  netWorth: number;
  education: number;
}

const GOAL_COUNT = 7;

function goalsMet(g: GoalProgress): number {
  return [
    g.cash,
    g.job,
    g.luxury,
    g.health,
    g.happiness,
    g.education,
    g.subjects,
  ].filter((x) => x.achieved).length;
}

function buildRow(p: PlayerState, market: readonly Stock[]): Row {
  const price = new Map(market.map((s) => [s.id, s.price]));
  const stocks = p.shares.reduce(
    (sum, h) => sum + h.owned * (price.get(h.id) ?? 0),
    0,
  );
  const savings = p.bankAccount.savings;
  const goals = evaluateGoals(p);
  return {
    p,
    goals,
    goalsMet: goalsMet(goals),
    stocks,
    savings,
    netWorth: p.cash + savings + stocks,
    education: averageEducation(p),
  };
}

interface Stat {
  key: string;
  label: string;
  icon: ReactNode;
  value: (r: Row) => number;
  format?: (n: number) => string;
  award: string;
}

const STATS: Stat[] = [
  {
    key: "net",
    label: "Net worth",
    icon: <TrendingUp size={14} />,
    value: (r) => r.netWorth,
    format: money,
    award: "Richest",
  },
  {
    key: "cash",
    label: "Cash on hand",
    icon: <Banknote size={14} />,
    value: (r) => r.p.cash,
    format: money,
    award: "Most cash",
  },
  {
    key: "savings",
    label: "Bank savings",
    icon: <PiggyBank size={14} />,
    value: (r) => r.savings,
    format: money,
    award: "Top saver",
  },
  {
    key: "stocks",
    label: "Stock portfolio",
    icon: <TrendingUp size={14} />,
    value: (r) => r.stocks,
    format: money,
    award: "Top trader",
  },
  {
    key: "edu",
    label: "Education",
    icon: <GraduationCap size={14} />,
    value: (r) => r.education,
    award: "Scholar",
  },
  {
    key: "happy",
    label: "Happiness",
    icon: <Smile size={14} />,
    value: (r) => r.p.happiness,
    award: "Happiest",
  },
  {
    key: "health",
    label: "Health",
    icon: <HeartPulse size={14} />,
    value: (r) => r.p.relationship.health,
    award: "Healthiest",
  },
  {
    key: "exp",
    label: "Work experience",
    icon: <Briefcase size={14} />,
    value: (r) => r.p.experience,
    award: "Most experienced",
  },
  {
    key: "things",
    label: "Possessions",
    icon: <ShoppingBag size={14} />,
    value: (r) => r.p.possessions.length,
    award: "Collector",
  },
  {
    key: "dates",
    label: "Dates",
    icon: <Heart size={14} />,
    value: (r) => r.p.relationship.dateCount,
    award: "Romantic",
  },
];

/** Names of whoever leads a stat (ties share it). Empty when nobody has any. */
function leaders(rows: Row[], s: Stat): { names: string[]; max: number } {
  const max = Math.max(...rows.map(s.value));
  if (max <= 0) return { names: [], max };
  return {
    names: rows.filter((r) => s.value(r) === max).map((r) => r.p.name),
    max,
  };
}

// ── Pieces ──────────────────────────────────────────────────────────────────
function Portrait({
  p,
  className,
  cut = 8,
}: {
  p: PlayerState;
  className: string;
  cut?: number;
}) {
  return (
    <span
      className={`relative block shrink-0 overflow-hidden bg-black ${className}`}
      style={{ clipPath: clip(cut) }}
    >
      <CyberPortrait src={p.avatar} name={p.name} />
    </span>
  );
}

function Bar({
  pct,
  color,
  delay = 0,
}: {
  pct: number;
  color: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color, boxShadow: `0 0 10px ${color}` }}
        initial={reduce ? false : { width: 0 }}
        whileInView={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: EASE, delay }}
      />
    </div>
  );
}

// ── Screen ──────────────────────────────────────────────────────────────────
export function WinScreen({ roomId, isHost }: Props) {
  const { core, gameId } = useGame();
  const router = useRouter();
  const reduce = useReducedMotion();
  const playAgain = useMutation(api.rooms.playAgain);
  const [burst, setBurst] = useState(0);

  const rows = core.players.map((p) => buildRow(p, core.market));
  const winnerRow =
    core.winnerSeat !== null
      ? rows.find((r) => r.p.seat === core.winnerSeat)
      : undefined;
  const winner = winnerRow?.p;

  // Winner first, then by goals met, then net worth.
  const ranked = [...rows].sort((a, b) => {
    if (a === winnerRow) return -1;
    if (b === winnerRow) return 1;
    return b.goalsMet - a.goalsMet || b.netWorth - a.netWorth;
  });
  const topNet = Math.max(1, ...rows.map((r) => r.netWorth));

  const goalRows: {
    label: string;
    cell: (r: Row) => { ok: boolean; text: string };
  }[] = [
    {
      label: "Cash",
      cell: (r) => ({
        ok: r.goals.cash.achieved,
        text: `${money(r.goals.cash.current)} / ${money(r.goals.cash.target)}`,
      }),
    },
    {
      label: "Winning job",
      cell: (r) => ({ ok: r.goals.job.achieved, text: r.goals.job.current }),
    },
    {
      label: "Luxury home",
      cell: (r) => ({
        ok: r.goals.luxury.achieved,
        text: r.goals.luxury.current,
      }),
    },
    {
      label: "Health",
      cell: (r) => ({
        ok: r.goals.health.achieved,
        text: `${r.goals.health.current} / ${r.goals.health.target}`,
      }),
    },
    {
      label: "Happiness",
      cell: (r) => ({
        ok: r.goals.happiness.achieved,
        text: `${r.goals.happiness.current} / ${r.goals.happiness.target}`,
      }),
    },
    {
      label: "Education",
      cell: (r) => ({
        ok: r.goals.education.achieved,
        text: `${r.goals.education.current} / ${r.goals.education.target}`,
      }),
    },
    {
      label: "Job-ready subjects",
      cell: (r) => ({
        ok: r.goals.subjects.achieved,
        text: r.goals.subjects.achieved ? "Qualified" : "Not yet",
      }),
    },
  ];

  const btn =
    "bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black shadow-[0_0_20px_color-mix(in_oklab,var(--accent-400)_45%,transparent)] hover:brightness-110";

  return (
    <div className="relative mx-auto max-w-4xl space-y-8 pb-16">
      <Confetti runKey={burst} />

      {/* ── Winner hero ─────────────────────────────────────────────── */}
      <motion.section
        initial={reduce ? false : { opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="accent-card relative overflow-hidden rounded-3xl bg-black/50 p-6 backdrop-blur sm:p-8"
      >
        <motion.span
          aria-hidden
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent"
        />
        <motion.div
          initial={reduce ? false : "hidden"}
          animate="show"
          variants={stagger}
          className="grid items-center gap-6 sm:grid-cols-[200px_1fr]"
        >
          {winner && (
            <motion.div variants={rise} className="mx-auto w-44 sm:w-full">
              <div
                className="relative aspect-[3/4]"
                style={{
                  filter: `drop-shadow(0 0 22px ${seatColor(winner.seat)}88)`,
                }}
              >
                <Portrait
                  p={winner}
                  cut={22}
                  className="absolute inset-0 h-full w-full"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 border-2"
                  style={{
                    borderColor: "#fbbf24",
                    clipPath: clip(22),
                  }}
                />
                <motion.span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-300 drop-shadow-[0_0_10px_#fbbf24]"
                  animate={reduce ? undefined : { y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Crown size={34} fill="currentColor" />
                </motion.span>
              </div>
            </motion.div>
          )}

          <div className="space-y-4 text-center sm:text-left">
            <motion.p
              variants={rise}
              className="font-mono text-xs uppercase tracking-[0.35em] text-amber-300/90"
            >
              {"// "}Game over · round {core.round}
            </motion.p>
            <motion.h1
              variants={rise}
              className="accent-gradient-text text-4xl font-black tracking-tight sm:text-5xl"
              style={GLOW_TEXT}
            >
              {winner ? `${winner.name} wins!` : "Game over"}
            </motion.h1>
            <motion.p variants={rise} className="text-sm text-slate-300">
              {winner
                ? "Career success, luxury living and a happy life — every goal met."
                : "Nobody reached every goal."}
            </motion.p>
            <motion.div variants={rise} className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setBurst((b) => b + 1)}
              >
                <PartyPopper size={14} /> Celebrate again
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {winnerRow && (
          <div className="mt-6">
            <TileGrid>
              <Tile
                icon={<TrendingUp size={16} />}
                label="Net worth"
                countTo={Math.round(winnerRow.netWorth)}
                prefix="$"
                hint={`Cash ${money(winnerRow.p.cash)}`}
              />
              <Tile
                icon={<Target size={16} />}
                label="Goals met"
                value={`${winnerRow.goalsMet} / ${GOAL_COUNT}`}
                hint="Every goal at once"
              />
              <Tile
                icon={<Briefcase size={16} />}
                label="Career"
                value={winnerRow.p.jobTitle ?? "No job"}
                hint={`${winnerRow.p.experience} exp`}
              />
            </TileGrid>
          </div>
        )}
      </motion.section>

      {/* ── Standings ───────────────────────────────────────────────── */}
      <Section id="standings" index={1} title="Final standings">
        <motion.ol
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={stagger}
          className="space-y-3"
        >
          {ranked.map((r, i) => {
            const color = seatColor(r.p.seat);
            const isWinner = r === winnerRow;
            return (
              <motion.li
                key={r.p.seat}
                variants={rise}
                className="rounded-xl border bg-white/[0.03] p-3 sm:p-4"
                style={{
                  borderColor: isWinner ? "#fbbf24aa" : `${color}33`,
                  boxShadow: isWinner ? "0 0 22px -6px #fbbf24" : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-7 text-center font-mono text-lg font-black"
                    style={{ color: isWinner ? "#fbbf24" : color }}
                  >
                    {isWinner ? (
                      <Trophy className="mx-auto" size={22} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <Portrait p={r.p} className="h-16 w-14" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate font-bold text-white">
                      {r.p.name}
                      {isWinner && (
                        <Crown size={14} className="text-amber-300" />
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {r.p.jobTitle ?? "No job"} · {r.goalsMet}/{GOAL_COUNT}{" "}
                      goals
                    </p>
                  </div>
                  <p
                    className="text-right text-xl font-bold tabular-nums text-white"
                    style={GLOW_TEXT}
                  >
                    {money(r.netWorth)}
                  </p>
                </div>
                <div className="mt-3 space-y-1.5">
                  <Bar pct={(r.netWorth / topNet) * 100} color={color} />
                  <div className="flex gap-1">
                    {Array.from({ length: GOAL_COUNT }, (_, k) => (
                      <span
                        key={k}
                        className="h-1.5 flex-1 rounded-full"
                        style={{
                          background:
                            k < r.goalsMet ? color : "rgba(255,255,255,0.08)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </motion.ol>
      </Section>

      {/* ── Goal checklist ──────────────────────────────────────────── */}
      <Section id="goals" index={2} title="Goal checklist">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-separate border-spacing-y-1.5 text-sm">
            <thead>
              <tr>
                <th className="px-2 text-left">
                  <SubHead>Goal</SubHead>
                </th>
                {ranked.map((r) => (
                  <th key={r.p.seat} className="px-2 text-center">
                    <span
                      className="font-mono text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: seatColor(r.p.seat) }}
                    >
                      {r.p.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {goalRows.map((g, gi) => (
                <motion.tr
                  key={g.label}
                  initial={reduce ? false : { opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, ease: EASE, delay: gi * 0.05 }}
                  className="bg-white/[0.03]"
                >
                  <td className="rounded-l-lg px-3 py-2 font-medium text-slate-200">
                    {g.label}
                  </td>
                  {ranked.map((r, ri) => {
                    const c = g.cell(r);
                    return (
                      <td
                        key={r.p.seat}
                        className={`px-2 py-2 text-center ${ri === ranked.length - 1 ? "rounded-r-lg" : ""}`}
                      >
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs ${c.ok ? "text-emerald-300" : "text-slate-500"}`}
                        >
                          {c.ok ? (
                            <Check size={14} strokeWidth={3} />
                          ) : (
                            <X size={14} />
                          )}
                          <span className="tabular-nums">{c.text}</span>
                        </span>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Head to head ────────────────────────────────────────────── */}
      <Section id="head-to-head" index={3} title="Head to head">
        <div className="flex flex-wrap gap-3">
          {ranked.map((r) => (
            <span
              key={r.p.seat}
              className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-slate-300"
            >
              <span
                className="size-2.5 rounded-full"
                style={{
                  background: seatColor(r.p.seat),
                  boxShadow: `0 0 8px ${seatColor(r.p.seat)}`,
                }}
              />
              {r.p.name}
            </span>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {STATS.map((s, si) => {
            const lead = leaders(rows, s);
            const fmt = s.format ?? ((n: number) => String(Math.round(n)));
            return (
              <motion.div
                key={s.key}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  ease: EASE,
                  delay: (si % 2) * 0.08,
                }}
                className="accent-card rounded-xl bg-cyan-400/5 p-4"
              >
                <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">
                  <span className="flex size-6 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
                    {s.icon}
                  </span>
                  {s.label}
                </p>
                <div className="space-y-2.5">
                  {ranked.map((r, ri) => {
                    const v = s.value(r);
                    const top = lead.names.includes(r.p.name) && lead.max > 0;
                    return (
                      <div key={r.p.seat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 truncate text-slate-300">
                            {r.p.name}
                            {top && (
                              <Crown size={11} className="text-amber-300" />
                            )}
                          </span>
                          <span
                            className={`tabular-nums ${top ? "font-bold text-white" : "text-slate-400"}`}
                          >
                            {fmt(v)}
                          </span>
                        </div>
                        <Bar
                          pct={lead.max > 0 ? (v / lead.max) * 100 : 0}
                          color={seatColor(r.p.seat)}
                          delay={ri * 0.07}
                        />
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ── Skills ──────────────────────────────────────────────────── */}
      <Section id="skills" index={4} title="Subject levels">
        <div className="overflow-x-auto">
          <div className="min-w-[480px] space-y-3">
            {SUBJECTS.map((subj, si) => (
              <motion.div
                key={subj.id}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, ease: EASE, delay: si * 0.04 }}
                className="grid grid-cols-[140px_1fr] items-center gap-3"
              >
                <p className="text-xs text-slate-300">
                  {subj.name}
                  {subj.specialist && (
                    <span className="ml-1 font-mono text-[9px] uppercase text-fuchsia-300">
                      spec
                    </span>
                  )}
                </p>
                <div className="space-y-1">
                  {ranked.map((r) => {
                    const lvl =
                      (r.p.subjects as Record<string, number | undefined>)[
                        subj.id
                      ] ?? 0;
                    return (
                      <div key={r.p.seat} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Bar pct={lvl} color={seatColor(r.p.seat)} />
                        </div>
                        <span className="w-7 text-right font-mono text-[10px] tabular-nums text-slate-400">
                          {lvl}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Awards ──────────────────────────────────────────────────── */}
      <Section id="awards" index={5} title="Awards">
        <TileGrid>
          {STATS.map((s) => {
            const lead = leaders(rows, s);
            if (lead.names.length === 0) return null;
            return (
              <Tile
                key={s.key}
                icon={s.icon}
                label={s.award}
                value={
                  <span className="text-lg">{lead.names.join(" & ")}</span>
                }
                hint={(s.format ?? ((n: number) => String(Math.round(n))))(
                  lead.max,
                )}
              />
            );
          })}
        </TileGrid>
      </Section>

      {/* ── Actions ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <SaveDialog gameId={gameId} />
        {roomId ? (
          isHost ? (
            <Button
              className={btn}
              onClick={() =>
                void playAgain({ roomId }).catch((e: unknown) =>
                  toast.error(
                    e instanceof Error ? e.message : "Couldn't reset",
                  ),
                )
              }
            >
              Play again
            </Button>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock size={14} /> Waiting for the host to start another round…
            </p>
          )
        ) : (
          <Button className={btn} onClick={() => router.push("/local/new")}>
            New game
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push("/lobby")}>
          Lobby
        </Button>
      </div>
    </div>
  );
}
