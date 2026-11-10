"use client";

import { useState } from "react";
import { findJob, jobs } from "@/lib/game/data/jobs";
import { SUBJECTS } from "@/lib/game/data/services";
import { jobIsAvailable, jobsWithinReach } from "@/lib/game/engine";
import type { SubjectId } from "@/lib/game/validators";
import { useGame } from "./GameContext";
import { ActionButton, ScreenCard } from "./ui";

export function University() {
  const { player } = useGame();
  const [subject, setSubject] = useState<SubjectId>("computerScience");
  const [hours, setHours] = useState(1);
  return (
    <ScreenCard
      title="University"
      subtitle="Raise your subject levels. Education is the average of all four."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {SUBJECTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSubject(s.id)}
            className={`rounded-xl border p-3 text-left ${subject === s.id ? "border-indigo-500 bg-indigo-500/10" : ""}`}
          >
            <p className="font-medium">{s.name}</p>
            <p className="text-xs text-muted-foreground">{s.description}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${player.subjects[s.id]}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Level {player.subjects[s.id]}/100
            </p>
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="text-sm">
          Hours:{" "}
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="rounded border bg-background px-2 py-1"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10].map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
        <ActionButton
          action={{ type: "studySubject", subject, hours }}
          disabled={player.energy < 10 || player.subjects[subject] >= 100}
        >
          Study
        </ActionButton>
        <span className="text-xs text-muted-foreground">
          Costs {hours * 2} energy and {hours} time unit(s).
        </span>
      </div>
    </ScreenCard>
  );
}

export function EmploymentOffice() {
  const { player } = useGame();
  const [showAll, setShowAll] = useState(false);
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
        />{" "}
        Show every job
      </label>
      <div className="grid gap-2">
        {list.map((job) => {
          const ok = jobIsAvailable(player, job.title);
          const reqs = Object.entries(job.requiredSubjects)
            .map(([s, l]) => `${s} ${l}`)
            .join(", ");
          return (
            <div
              key={job.title}
              className="flex items-center justify-between gap-3 rounded-xl border p-3"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {job.title}{" "}
                  <span className="text-emerald-500">${job.salary}/shift</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {job.description}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Exp {job.expReq}
                  {reqs && ` · ${reqs}`}
                </p>
              </div>
              <ActionButton
                action={{ type: "applyJob", jobTitle: job.title }}
                disabled={!ok || player.jobTitle === job.title}
              >
                {player.jobTitle === job.title ? "Current" : "Apply"}
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
      {overdue && (
        <p className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-500">
          ⚠️ Rent overdue — 20% of your pay is garnished until you pay at the
          Rental Office.
        </p>
      )}
      <p className="mb-2 text-sm">Experience: {player.experience}/100</p>
      <ActionButton action={{ type: "work" }} disabled={player.energy < 15}>
        Work a shift (15⏱, −15 ⚡)
      </ActionButton>
    </ScreenCard>
  );
}
