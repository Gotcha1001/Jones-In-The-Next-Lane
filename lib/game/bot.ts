/**
 * Mr Jones — the computer opponent.
 *
 * `chooseBotPlan` is a pure function: given the game it returns the NEXT thing
 * the bot wants to do ("work at the workplace", "study Business for 10 hours
 * at the university"…) or null when there is nothing useful left (→ end the
 * week). The server drives the plan one visible step at a time (walk, open the
 * place, pick the options, press the button) so every player sees exactly what
 * he does, just like watching a human in a lobby.
 *
 * Difficulty only changes how well he plays:
 *   easy   – forgets to eat, skips rent, studies a little, wastes time
 *   medium – solid all-rounder, keeps money in the bank, dates when he
 *            needs a mood boost, upgrades flat
 *   hard   – never forgets anything, studies in big blocks for the winning
 *            job, upgrades quickly, banks his spare cash once the luxury flat
 *            is paid for and dates to keep happiness (and health) up
 */
import { jobIsAvailable } from "./engine";
import { findJob, jobs } from "./data/jobs";
import { datingOptions } from "./data/dating";
import type { Job } from "./data/jobs";
import {
  apartmentTiers,
  healingServices,
  HEALING_TIME,
  mealValue,
  meals,
  tierFromRent,
  upgradeFee,
  isEnrolled,
  subjectTuition,
  CORE_SUBJECT_IDS,
  type CoreSubjectId,
} from "./data/services";
import type {
  GameAction,
  LocationId,
  PlayerState,
  SubjectId,
} from "./validators";
import type { GameCore } from "./validators";

export type BotLevel = "easy" | "medium" | "hard";

export interface BotPlan {
  action: GameAction;
  /** Where the action has to be performed. */
  at: LocationId;
  /** Selections to show on the place screen before pressing the button. */
  ui?: Record<string, string | number | boolean>;
}

interface Tuning {
  /** % of weeks he simply forgets to eat. */
  forgetEatPct: number;
  /** % of weeks he doesn't pay rent when it is due. */
  skipRentPct: number;
  /** % chance per decision that he wastes time relaxing. */
  slopPct: number;
  /** He studies while more than this much time is left in the week. */
  studyUntil: number;
  /** Hours per study session. */
  studyHours: number;
  /** Does he use the bank at all? */
  banks: boolean;
  /** Deposit when cash is above this… */
  depositAbove: number;
  /** …keeping this much in his pocket. */
  keepCash: number;
  /** null = never upgrades; else cash he wants left after paying the fee. */
  upgradeBuffer: number | null;
  /** Chases the best/winning job instead of whatever is first. */
  bestJob: boolean;
  /** Studies what his target job needs instead of a random subject. */
  smartStudy: boolean;
  /** Visits the Healing Centre when health falls below this (0 = never). */
  healBelow: number;
  /** Does he date to keep his mood (and health) up? */
  dating: boolean;
  /** Cash he wants to keep in his pocket after paying for a date. */
  dateBuffer: number;
}

const TUNING: Record<BotLevel, Tuning> = {
  easy: {
    forgetEatPct: 35,
    skipRentPct: 40,
    slopPct: 25,
    studyUntil: 85,
    studyHours: 2,
    banks: false,
    depositAbove: Infinity,
    keepCash: 0,
    upgradeBuffer: null,
    bestJob: false,
    smartStudy: false,
    healBelow: 0,
    dating: false,
    dateBuffer: 0,
  },
  medium: {
    forgetEatPct: 10,
    skipRentPct: 10,
    slopPct: 5,
    studyUntil: 55,
    studyHours: 5,
    banks: true,
    depositAbove: 1500,
    keepCash: 500,
    upgradeBuffer: 500,
    bestJob: true,
    smartStudy: true,
    healBelow: 55,
    dating: true,
    dateBuffer: 300,
  },
  hard: {
    forgetEatPct: 0,
    skipRentPct: 0,
    slopPct: 0,
    studyUntil: 70,
    studyHours: 10,
    banks: true,
    depositAbove: 800,
    keepCash: 300,
    upgradeBuffer: 150,
    bestJob: true,
    smartStudy: true,
    healBelow: 80,
    dating: true,
    dateBuffer: 200,
  },
};

// Bots only chase the original (core) subjects: every winning job needs them
// and education is their average. Specialist subjects are for human players.
const SUBJECT_IDS: readonly CoreSubjectId[] = CORE_SUBJECT_IDS;

/** Stable 0–99 number for (week, seat): "does he forget this week?" must not
 *  flip-flop between decisions inside the same week. */
function weekRoll(week: number, seat: number, salt: number): number {
  let h =
    (Math.imul(week + salt * 101, 2654435761) ^ Math.imul(seat + 7, 40503)) >>>
    0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  return h % 100;
}

const jobScore = (job: Job, winning: readonly string[]): number =>
  (winning.includes(job.title) ? 1_000_000 : 0) + job.salary;

/** Subject he should study next, or null if there is nothing worth studying. */
function studyTarget(
  p: PlayerState,
  T: Tuning,
  rng: () => number,
): SubjectId | null {
  const open = SUBJECT_IDS.filter(
    (s) =>
      p.subjects[s] < 100 && (isEnrolled(p, s) || p.cash >= subjectTuition(s)),
  );
  if (open.length === 0) return null;

  if (!T.smartStudy) return open[Math.floor(rng() * open.length)];

  // Closest winning job (fewest missing subject points)
  let bestDeficit: Partial<Record<CoreSubjectId, number>> | null = null;
  let bestTotal = Infinity;
  for (const title of p.goals.winningJobs) {
    const job = findJob(title);
    if (!job) continue;
    // Bots don't study specialist subjects, so skip winning jobs that need one.
    const coreOnly = Object.keys(job.requiredSubjects).every((id) =>
      (SUBJECT_IDS as readonly string[]).includes(id),
    );
    if (!coreOnly) continue;
    const deficit: Partial<Record<CoreSubjectId, number>> = {};
    let total = 0;
    for (const s of SUBJECT_IDS) {
      const need = job.requiredSubjects[s] ?? 0;
      if (need > p.subjects[s]) {
        deficit[s] = need - p.subjects[s];
        total += need - p.subjects[s];
      }
    }
    if (total > 0 && total < bestTotal) {
      bestTotal = total;
      bestDeficit = deficit;
    }
  }
  if (bestDeficit) {
    const wanted = open
      .filter((s) => (bestDeficit?.[s] ?? 0) > 0)
      .sort((a, b) => (bestDeficit?.[b] ?? 0) - (bestDeficit?.[a] ?? 0))[0];
    if (wanted) return wanted;
  }

  // Otherwise lift the education average toward the goal
  const avg =
    SUBJECT_IDS.reduce((sum, s) => sum + p.subjects[s], 0) / SUBJECT_IDS.length;
  if (avg < p.goals.education) {
    return [...open].sort((a, b) => p.subjects[a] - p.subjects[b])[0];
  }
  return null;
}

/** Best-value date: most mood + health for the money (stable, no randomness). */
function bestDatingPartner() {
  return [...datingOptions].sort(
    (a, b) =>
      (b.happinessBoost + b.healthBoost) / b.datePrice -
      (a.happinessBoost + a.healthBoost) / a.datePrice,
  )[0];
}

export function chooseBotPlan(
  core: GameCore,
  seat: number,
  level: BotLevel,
  rng: () => number,
): BotPlan | null {
  const p = core.players[seat];
  if (!p || p.timeLeft <= 0) return null;
  const T = TUNING[level];
  const g = p.goals;
  const t = p.timeLeft;
  const rent = p.rental;

  // 1. Pay rent when it is due (garnished wages are expensive)
  if (
    rent.hasApartment &&
    rent.rentDue &&
    p.cash >= rent.rentAmount &&
    weekRoll(p.week, seat, 1) >= T.skipRentPct
  ) {
    return { action: { type: "payRent" }, at: "rentoffice" };
  }

  // 2. Cash out the bank the moment that wins the game
  if (
    T.banks &&
    p.bankAccount.savings > 0 &&
    p.cash + p.bankAccount.savings >= g.cash
  ) {
    const amount = Math.floor(p.bankAccount.savings);
    return {
      action: { type: "withdraw", amount },
      at: "bank",
      ui: { "bank-amount": amount },
    };
  }

  // 3. Eat at least once a week (or the doctor sends a bill)
  if (p.ateThisWeek === false && weekRoll(p.week, seat, 2) >= T.forgetEatPct) {
    const eatNow = level === "hard" || t <= 60;
    const affordable = meals.filter((m) => m.price <= p.cash);
    if (eatNow && affordable.length > 0) {
      const budget = Math.max(6, p.cash * 0.03);
      const pool = affordable.filter((m) => m.price <= budget);
      // Best all-round meal (energy + happiness + health) he can comfortably pay.
      const meal =
        pool.length > 0
          ? [...pool].sort((a, b) => mealValue(b) - mealValue(a))[0]
          : [...affordable].sort((a, b) => a.price - b.price)[0];
      return { action: { type: "buyMeal", mealId: meal.id }, at: "fastFood" };
    }
  }

  // 4. A roof over his head
  if (!rent.hasApartment && p.cash >= apartmentTiers.basic.deposit + 40) {
    return {
      action: { type: "rentApartment", tier: "basic" },
      at: "rentoffice",
    };
  }

  // 5. A job (best / winning one if he is any good)
  const current = p.jobTitle ? findJob(p.jobTitle) : undefined;
  const available = jobs.filter((j) => jobIsAvailable(p, j.title));
  if (!current && available.length > 0) {
    const pick = T.bestJob
      ? [...available].sort(
          (a, b) => jobScore(b, g.winningJobs) - jobScore(a, g.winningJobs),
        )[0]
      : available[Math.floor(rng() * available.length)];
    return {
      action: { type: "applyJob", jobTitle: pick.title },
      at: "employmentOffice",
    };
  }
  if (current && T.bestJob && available.length > 0) {
    const best = [...available].sort(
      (a, b) => jobScore(b, g.winningJobs) - jobScore(a, g.winningJobs),
    )[0];
    if (jobScore(best, g.winningJobs) > jobScore(current, g.winningJobs)) {
      return {
        action: { type: "applyJob", jobTitle: best.title },
        at: "employmentOffice",
      };
    }
  }

  // 6. Upgrade to the luxury flat (a win condition)
  if (rent.hasApartment && T.upgradeBuffer !== null) {
    const tier = tierFromRent(rent.rentAmount);
    if (tier !== "luxury") {
      const fee = upgradeFee(tier, "luxury");
      if (p.cash >= fee + T.upgradeBuffer) {
        return {
          action: { type: "upgradeApartment", tier: "luxury" },
          at: "rentoffice",
        };
      }
    }
  }

  // 7. Wasting time (mostly the easy bot)
  if (t > 20 && rng() * 100 < T.slopPct) {
    return rent.hasApartment
      ? { action: { type: "homeActivity", activity: "tv" }, at: "apartment" }
      : { action: { type: "leisure", activity: "basic" }, at: "leisureCenter" };
  }

  // 8. Study early in the week
  if (t > T.studyUntil) {
    const subject = studyTarget(p, T, rng);
    if (subject && !isEnrolled(p, subject)) {
      // Tuition first: register and pay before the first lesson.
      return {
        action: { type: "enrollSubject", subject },
        at: "university",
      };
    }
    if (subject) {
      const hours = Math.min(T.studyHours, t);
      return {
        action: { type: "studySubject", subject, hours },
        at: "university",
        ui: { "uni-subject": subject, "uni-hours": hours },
      };
    }
  }

  // 9. Bank: collect interest once a week, park spare cash
  if (T.banks) {
    if (
      p.bankAccount.savings >= 500 &&
      p.bankAccount.lastInterestWeek !== p.week
    ) {
      return { action: { type: "collectInterest" }, at: "bank" };
    }
    // Don't park cash while he still needs it for the luxury flat: the
    // upgrade only looks at cash in hand, so he'd have to walk back to withdraw.
    const savingForUpgrade =
      T.upgradeBuffer !== null &&
      (!rent.hasApartment || tierFromRent(rent.rentAmount) !== "luxury");
    // …and once cash + savings already reach the money goal he keeps it in
    // his pocket (step 2 just withdrew it), otherwise he'd redeposit forever.
    const holdingForWin = p.cash + p.bankAccount.savings >= g.cash;
    if (!savingForUpgrade && !holdingForWin && p.cash > T.depositAbove) {
      const amount = Math.floor(p.cash - T.keepCash);
      return {
        action: { type: "deposit", amount },
        at: "bank",
        ui: { "bank-amount": amount },
      };
    }
  }

  // 9b. Health: illness and skipped meals drain it, so top it back up
  //     (hard aims for the goal, medium only when it gets bad, easy never).
  if (
    T.healBelow > 0 &&
    p.relationship.health < T.healBelow &&
    t > HEALING_TIME
  ) {
    const affordable = healingServices.filter((s) => s.price <= p.cash);
    if (affordable.length > 0) {
      // Biggest health gain per dollar, but only what he can comfortably pay.
      const best = [...affordable].sort(
        (a, b) => b.health / b.price - a.health / a.price,
      )[0];
      return {
        action: { type: "healing", serviceId: best.id },
        at: "healingCentre",
      };
    }
  }

  // 9c. Exhausted? Tired workers earn less, so rest at home first
  //     (easy never bothers).
  if (level !== "easy" && rent.hasApartment && p.energy < 35 && t > 30) {
    return { action: { type: "sleep" }, at: "apartment" };
  }

  // 10. Keep happy (hard aims for the goal, medium just stays comfortable)
  if (level !== "easy" && t < 50 && rent.hasApartment) {
    const wants = level === "hard" ? g.happiness : 55;
    if (p.happiness < wants) {
      // A date beats TV or games: same time as games, plus a health boost.
      // Skipped if he can't pay for it comfortably (then he stays home).
      if (T.dating) {
        const partner = bestDatingPartner();
        if (p.relationship.isDating && p.relationship.partnerId !== null) {
          const mine = datingOptions.find(
            (d) => d.id === p.relationship.partnerId,
          );
          if (mine && t >= 20 && p.cash >= mine.datePrice + T.dateBuffer) {
            return {
              action: { type: "goOnDate", personId: mine.id },
              at: "apartment",
            };
          }
        } else if (
          partner &&
          t > 15 &&
          p.cash >= partner.datePrice * 3 + T.dateBuffer
        ) {
          // First meeting happens at the Dating Office.
          return {
            action: { type: "startDating", personId: partner.id },
            at: "datingOffice",
          };
        }
      }
      return {
        action: {
          type: "homeActivity",
          activity: level === "hard" ? "games" : "tv",
        },
        at: "apartment",
      };
    }
  }

  // 11. Work for whatever time is left
  if (current) {
    return {
      action: { type: t > 20 ? "work" : "workRest" },
      at: "workplace",
    };
  }

  return null;
}
