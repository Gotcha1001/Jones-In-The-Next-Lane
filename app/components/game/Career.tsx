"use client";

import { findJob, jobs } from "@/lib/game/data/jobs";
import {
  isEnrolled,
  SUBJECTS,
  subjectLevel,
  subjectName,
  subjectTuition,
} from "@/lib/game/data/services";
import { jobIsAvailable, jobsWithinReach } from "@/lib/game/engine";
import type { SubjectId } from "@/lib/game/validators";
import { useGame } from "./GameContext";
import { ActionButton, ScreenCard } from "./ui";
import { useSharedState } from "@/hooks/useSharedState";

/* Accent-aware glow helpers (follow --accent-400, so they change with the picker) */
const GLOW_BOX =
  "shadow-[0_0_24px_-10px_color-mix(in_oklab,var(--accent-400)_45%,transparent)]";
const GLOW_BAR =
  "shadow-[0_0_10px_color-mix(in_oklab,var(--accent-400)_70%,transparent)]";
// Inline style on purpose: html[data-glow="off"] strips any [style*="text-shadow"]
const GLOW_TEXT = {
  textShadow:
    "0 0 10px color-mix(in oklab, var(--accent-400) 70%, transparent)",
} as const;

export function University() {
  const { player } = useGame();
  const [subject, setSubject] = useSharedState<SubjectId>(
    "uni-subject",
    "computerScience",
  );
  const [hours, setHours] = useSharedState<number>("uni-hours", 1);
  return (
    <ScreenCard
      title="University"
      subtitle="Register and pay tuition for a subject first, then study it. Subjects that lead to better-paid jobs cost more. Education is the average of the four core subjects; specialist subjects unlock extra careers."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {SUBJECTS.map((s) => {
          const selected = subject === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSubject(s.id)}
              className={`cursor-pointer rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                selected
                  ? `border-cyan-400 bg-cyan-500/10 ${GLOW_BOX}`
                  : "border-cyan-400/20 hover:border-cyan-400/60 hover:bg-cyan-500/5"
              }`}
            >
              <p
                className={`font-medium ${selected ? "text-cyan-300" : ""}`}
                style={selected ? GLOW_TEXT : undefined}
              >
                {s.name}
                {s.specialist && (
                  <span className="ml-2 rounded-full border border-cyan-400/40 px-1.5 py-0.5 align-middle text-[9px] font-normal uppercase tracking-wider text-cyan-300/80">
                    Specialist
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{s.description}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cyan-950/60">
                <div
                  className={`accent-gradient-bg h-full rounded-full ${GLOW_BAR}`}
                  style={{ width: `${subjectLevel(player.subjects, s.id)}%` }}
                />
              </div>
              <p className="mt-1 flex items-center justify-between text-[11px] text-cyan-300/70">
                <span>Level {subjectLevel(player.subjects, s.id)}/100</span>
                {isEnrolled(player, s.id) ? (
                  <span className="font-semibold text-emerald-300">
                    ✓ Registered
                  </span>
                ) : (
                  <span
                    className={`font-mono font-semibold ${
                      player.cash >= subjectTuition(s.id)
                        ? "text-amber-300"
                        : "text-rose-300"
                    }`}
                  >
                    Tuition ${subjectTuition(s.id).toLocaleString()}
                  </span>
                )}
              </p>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="text-sm">
          Hours:{" "}
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="cursor-pointer rounded-lg border border-cyan-400/50 bg-black/40 px-3 py-1.5 font-mono text-cyan-200 shadow-[0_0_12px_-4px_color-mix(in_oklab,var(--accent-400)_60%,transparent)] outline-none transition-all hover:border-cyan-300 hover:shadow-[0_0_18px_-2px_color-mix(in_oklab,var(--accent-400)_75%,transparent)] focus:border-cyan-300 focus:ring-1 focus:ring-cyan-400"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10].map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
        {isEnrolled(player, subject) ? (
          <>
            <ActionButton
              action={{ type: "studySubject", subject, hours }}
              disabled={subjectLevel(player.subjects, subject) >= 100}
              className="px-8"
            >
              Study
            </ActionButton>
            <span className="text-xs text-muted-foreground">
              Costs {hours} time unit(s).
            </span>
          </>
        ) : (
          <>
            <ActionButton
              action={{ type: "enrollSubject", subject }}
              disabled={player.cash < subjectTuition(subject)}
              className="px-8"
            >
              Register &amp; pay ${subjectTuition(subject).toLocaleString()}
            </ActionButton>
            <span className="text-xs text-muted-foreground">
              {player.cash < subjectTuition(subject)
                ? `You need $${(subjectTuition(subject) - Math.floor(player.cash)).toLocaleString()} more. `
                : ""}
              Pay tuition once to unlock {subjectName(subject)}.
            </span>
          </>
        )}
      </div>
    </ScreenCard>
  );
}

export function EmploymentOffice() {
  const { player } = useGame();
  const [showAll, setShowAll] = useSharedState<boolean>("jobs-showall", false);
  const list = showAll ? jobs : jobsWithinReach(player);
  return (
    <ScreenCard
      title="Employment Office"
      subtitle={`Current job: ${player.jobTitle ?? "none"}`}
    >
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showAll}
          onChange={(e) => setShowAll(e.target.checked)}
          className="accent-cyan-400"
        />{" "}
        Show every job
      </label>
      <div className="grid gap-2">
        {list.map((job) => {
          const ok = jobIsAvailable(player, job.title);
          const isCurrent = player.jobTitle === job.title;
          const reqs = Object.entries(job.requiredSubjects)
            .map(([s, l]) => `${subjectName(s)} ${l}`)
            .join(", ");
          return (
            <div
              key={job.title}
              className={`accent-card flex items-center justify-between gap-3 rounded-xl p-3 ${
                isCurrent ? "bg-cyan-500/10" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {job.title}{" "}
                  <span
                    className="accent-gradient-text font-semibold"
                    style={GLOW_TEXT}
                  >
                    ${job.salary}/shift
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {job.description}
                </p>
                <p className="text-[11px] text-cyan-300/70">
                  Exp {job.expReq}
                  {reqs && ` · ${reqs}`}
                </p>
              </div>
              <ActionButton
                action={{ type: "applyJob", jobTitle: job.title }}
                disabled={!ok || isCurrent}
              >
                {isCurrent ? "Current" : "Apply"}
              </ActionButton>
            </div>
          );
        })}
      </div>
    </ScreenCard>
  );
}

export function Workplace() {
  const { player } = useGame();
  const job = player.jobTitle ? findJob(player.jobTitle) : undefined;
  if (!job) {
    return (
      <ScreenCard
        title="Workplace"
        subtitle="You don't have a job. Visit the Employment Office to get hired!"
      >
        <span />
      </ScreenCard>
    );
  }
  const overdue = player.rental.hasApartment && player.rental.rentDue;
  return (
    <ScreenCard
      title="Workplace"
      subtitle={`${job.title} — $${job.salary} per shift`}
    >
      {/* Warning stays red on purpose: it's a status colour, not an accent */}
      {overdue && (
        <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-500">
          ⚠️ Rent overdue — 20% of your pay is garnished until you pay at the
          Rental Office.
        </p>
      )}
      <div className="accent-card mb-3 rounded-xl p-3">
        <p className="text-sm">
          Experience:{" "}
          <span className="text-cyan-300" style={GLOW_TEXT}>
            {player.experience}/100
          </span>
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cyan-950/60">
          <div
            className={`accent-gradient-bg h-full rounded-full ${GLOW_BAR}`}
            style={{ width: `${player.experience}%` }}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ActionButton action={{ type: "work" }} disabled={player.timeLeft <= 0}>
          Work a shift (15⏱)
        </ActionButton>
        <ActionButton
          action={{ type: "workRest" }}
          disabled={player.timeLeft <= 0}
          title="Work every time unit you have left and finish the week"
        >
          Work the rest of the week ({player.timeLeft}⏱ ≈ $
          {Math.round((job.salary * player.timeLeft) / 15)})
        </ActionButton>
      </div>
    </ScreenCard>
  );
}
