/**
 * lib/game/engine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure, side-effect-free rules engine for Jones in the Fast Lane.
 *
 * This replaces the old `gameReducer.js` + the logic that used to be scattered
 * across every React component. It is imported by the Convex mutations (which
 * are the only place game state is written) and by the UI (read-only helpers
 * such as `evaluateGoals` and `canAfford`).
 *
 * Nothing here touches the database, `Date.now()` or `Math.random()` directly:
 * time and randomness are injected so the engine is deterministic & testable.
 */
import { findJob, jobs } from "./data/jobs";
import { findItem } from "./data/items";
import { findDatingOption } from "./data/dating";
import { locations, TRAVEL_TIME } from "./data/locations";
import { pickRandomEvent } from "./data/randomEvents";
import type { EventStat } from "./data/randomEvents";
import {
  apartmentTiers,
  healingServices,
  HEALING_TIME,
  homeActivities,
  homeActivityMinEnergy,
  INITIAL_STOCKS,
  leisureActivities,
  MEAL_TIME,
  meals,
  tierFromRent,
  tierOrder,
  upgradeFee,
} from "./data/services";
import type {
  GameAction,
  GameCore,
  Goals,
  LocationId,
  PlayerState,
  Stock,
  SubjectId,
} from "./validators";

// ── Constants ───────────────────────────────────────────────────────────────
export const STARTING_CASH = 200;
export const WEEK_LENGTH = 100;
export const INTEREST_RATE = 0.05;
export const RENT_INTERVAL_WEEKS = 4;
export const MAX_LOG_ENTRIES = 40;

export const DEFAULT_GOALS: Goals = {
  cash: 10000,
  education: 80,
  happiness: 90,
  winningJobs: ["Executive", "Engineer", "Startup Founder", "Investor"],
};

// ── Small helpers ───────────────────────────────────────────────────────────
const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));
const round2 = (n: number): number => Math.round(n * 100) / 100;

function setAt<T>(arr: readonly T[], index: number, value: T): T[] {
  return arr.map((item, i) => (i === index ? value : item));
}

export function averageEducation(p: PlayerState): number {
  const levels = Object.values(p.subjects);
  return levels.length
    ? Math.floor(levels.reduce((s, l) => s + l, 0) / levels.length)
    : 0;
}

// ── Construction ────────────────────────────────────────────────────────────
export interface NewPlayerInput {
  readonly name: string;
  readonly avatar: string;
  readonly goals?: Goals;
}

export function createPlayer(seat: number, input: NewPlayerInput): PlayerState {
  return {
    seat,
    name: input.name,
    avatar: input.avatar,
    cash: STARTING_CASH,
    subjects: {
      engineering: 0,
      computerScience: 0,
      business: 0,
      liberalArts: 0,
    },
    experience: 0,
    rental: {
      hasApartment: false,
      lastPaidWeek: null,
      rentAmount: apartmentTiers.basic.rentAmount,
      rentDue: false,
      missedPayments: 0,
    },
    bankAccount: { savings: 0, lastInterestWeek: null },
    relationship: {
      isDating: false,
      partnerId: null,
      dateCount: 0,
      happiness: 0,
      health: 80,
    },
    shares: [],
    education: 0,
    happiness: 70,
    energy: 100,
    jobTitle: null,
    possessions: [],
    location: "apartment",
    week: 1,
    timeLeft: WEEK_LENGTH,
    goals: input.goals ?? DEFAULT_GOALS,
  };
}

export function createGame(players: readonly NewPlayerInput[]): GameCore {
  return {
    status: "active",
    players: players.map((p, i) => createPlayer(i, p)),
    currentSeat: 0,
    round: 1,
    market: INITIAL_STOCKS.map((s) => ({ ...s })),
    log: [],
    lastEvent: null,
    winnerSeat: null,
  };
}

// ── Goals ───────────────────────────────────────────────────────────────────
export interface GoalProgress {
  readonly cash: { current: number; target: number; achieved: boolean };
  readonly job: {
    current: string;
    target: readonly string[];
    achieved: boolean;
  };
  readonly luxury: { current: string; achieved: boolean };
  readonly health: { current: number; target: number; achieved: boolean };
  readonly happiness: { current: number; target: number; achieved: boolean };
  readonly education: { current: number; target: number; achieved: boolean };
  readonly subjects: { achieved: boolean };
  readonly achieved: boolean;
}

export function evaluateGoals(p: PlayerState): GoalProgress {
  const g = p.goals;
  const hasWinningJob =
    p.jobTitle !== null && g.winningJobs.includes(p.jobTitle);
  const hasLuxury =
    p.rental.hasApartment &&
    p.rental.rentAmount === apartmentTiers.luxury.rentAmount;
  const hasGoodHealth = p.relationship.health >= 80;
  const hasHappiness = p.happiness >= g.happiness;
  const avgEdu = averageEducation(p);
  const hasEdu = avgEdu >= g.education;
  const hasSubjects = g.winningJobs.some((title) => {
    const job = findJob(title);
    if (!job) return false;
    return (
      Object.entries(job.requiredSubjects) as [SubjectId, number][]
    ).every(([subject, level]) => p.subjects[subject] >= level);
  });
  const hasCash = p.cash >= g.cash;
  return {
    cash: { current: p.cash, target: g.cash, achieved: hasCash },
    job: {
      current: p.jobTitle ?? "None",
      target: g.winningJobs,
      achieved: hasWinningJob,
    },
    luxury: {
      current: hasLuxury ? "Luxury Apartment" : "Not Luxury",
      achieved: hasLuxury,
    },
    health: {
      current: p.relationship.health,
      target: 80,
      achieved: hasGoodHealth,
    },
    happiness: {
      current: p.happiness,
      target: g.happiness,
      achieved: hasHappiness,
    },
    education: { current: avgEdu, target: g.education, achieved: hasEdu },
    subjects: { achieved: hasSubjects },
    achieved:
      hasCash &&
      hasWinningJob &&
      hasLuxury &&
      hasGoodHealth &&
      hasHappiness &&
      hasEdu &&
      hasSubjects,
  };
}

// ── Single-player action handlers ───────────────────────────────────────────
type Fail = { readonly ok: false; readonly error: string };
type Applied = {
  readonly ok: true;
  readonly player: PlayerState;
  readonly message: string;
  /** Time units consumed by the action (0 for free actions). */
  readonly time: number;
  /** Optional market change (buying/selling does not move prices; reserved). */
};
type HandlerResult = Applied | Fail;

const fail = (error: string): Fail => ({ ok: false, error });
const done = (player: PlayerState, message: string, time = 0): Applied => ({
  ok: true,
  player,
  message,
  time,
});

/** Which location each action must be performed at. `null` = anywhere. */
const REQUIRED_LOCATION: Record<GameAction["type"], LocationId | null> = {
  moveTo: null,
  endTurn: null,
  sleep: "apartment",
  homeActivity: "apartment",
  studySubject: null, // university or apartment (checked in handler)
  work: "workplace",
  applyJob: "employmentOffice",
  buyItem: "mall",
  buyMeal: "fastFood",
  healing: "healingCentre",
  leisure: "leisureCenter",
  rentApartment: "rentoffice",
  upgradeApartment: "rentoffice",
  payRent: "rentoffice",
  deposit: "bank",
  withdraw: "bank",
  collectInterest: "bank",
  buyShares: "bank",
  sellShares: "bank",
  startDating: "datingOffice",
  goOnDate: "datingOffice",
  breakUp: "datingOffice",
};

function applyAction(
  p: PlayerState,
  action: GameAction,
  market: readonly Stock[],
): HandlerResult {
  const required = REQUIRED_LOCATION[action.type];
  if (required && p.location !== required) {
    return fail(
      `You need to be at the ${locations[required].name} to do that.`,
    );
  }

  switch (action.type) {
    case "moveTo": {
      if (action.locationId === p.location) return fail("You're already here.");
      // Not enough time left to get anywhere: the week simply ends (the
      // engine rolls it over and sends the player home).
      if (p.timeLeft < TRAVEL_TIME)
        return done(
          p,
          "You ran out of time before you could get there.",
          p.timeLeft,
        );
      return done(
        { ...p, location: action.locationId },
        `You travelled to the ${locations[action.locationId].name}.`,
        TRAVEL_TIME,
      );
    }

    case "endTurn":
      return done(p, `${p.name} ended the week early.`, p.timeLeft);

    case "sleep": {
      if (!p.rental.hasApartment)
        return fail(
          "You need to rent an apartment first! Visit the Rental Office.",
        );
      if (p.energy >= 100) return fail("You're already full of energy!");
      return done(
        { ...p, energy: 100 },
        "You had a good rest and recovered your energy!",
        30,
      );
    }

    case "homeActivity": {
      if (!p.rental.hasApartment)
        return fail("You need to rent an apartment first!");
      const def = homeActivities[action.activity];
      if (p.energy < homeActivityMinEnergy[action.activity]) {
        return fail(`You're too tired for that (${def.name}).`);
      }
      return done(
        {
          ...p,
          happiness: clamp(p.happiness + def.happiness, 0, 100),
          energy: clamp(p.energy - def.energyCost, 0, 100),
        },
        `${def.name}: +${def.happiness} happiness.`,
        def.time,
      );
    }

    case "studySubject": {
      const atUni = p.location === "university";
      const atHome = p.location === "apartment" && p.rental.hasApartment;
      if (!atUni && !atHome)
        return fail("Study at the University, or at home in your apartment.");
      const hours = atHome ? 1 : Math.floor(action.hours);
      if (hours < 1 || hours > 10) return fail("Study between 1 and 10 hours.");
      if (p.energy < 10)
        return fail("You're too tired to study. Get some rest first!");
      const current = p.subjects[action.subject];
      if (current >= 100) return fail("You've already mastered that subject!");
      const gain = Math.floor(2 * hours * (1 + current / 100));
      const subjects = {
        ...p.subjects,
        [action.subject]: Math.min(current + gain, 100),
      };
      const next: PlayerState = {
        ...p,
        subjects,
        energy: Math.max(0, p.energy - hours * 2),
      };
      return done(
        { ...next, education: averageEducation(next) },
        `You studied ${action.subject} and gained ${gain} points!`,
        atHome ? 15 : hours,
      );
    }

    case "work": {
      const job = p.jobTitle ? findJob(p.jobTitle) : undefined;
      if (!job) return fail("You need to get a job first!");
      if (p.energy < 15) return fail("You're too tired to work!");
      let salary = job.salary;
      let garnish = "";
      if (p.rental.hasApartment && p.rental.rentDue) {
        const cut = Math.floor(salary * 0.2);
        salary -= cut;
        garnish = ` Wages garnished: $${cut} due to overdue rent.`;
      }
      return done(
        {
          ...p,
          cash: p.cash + salary,
          energy: p.energy - 15,
          experience: Math.min(p.experience + 2, 100),
        },
        `You worked as ${job.title} and earned $${salary}!${garnish}`,
        15,
      );
    }

    case "applyJob": {
      const job = findJob(action.jobTitle);
      if (!job) return fail("That job doesn't exist.");
      if (p.experience < job.expReq)
        return fail(`You need ${job.expReq} experience points for this job.`);
      const missing = (
        Object.entries(job.requiredSubjects) as [SubjectId, number][]
      )
        .filter(([s, level]) => p.subjects[s] < level)
        .map(([s, level]) => `${s}: ${p.subjects[s]}/${level}`);
      if (missing.length)
        return fail(
          `You don't meet the subject requirements: ${missing.join(", ")}`,
        );
      return done(
        { ...p, jobTitle: job.title },
        `Congratulations! You got the ${job.title} job!`,
      );
    }

    case "buyItem": {
      const item = findItem(action.itemName);
      if (!item) return fail("That item doesn't exist.");
      if (p.possessions.includes(item.name))
        return fail(`You already own ${item.name}.`);
      if (p.cash < item.price)
        return fail(`You don't have enough money to buy ${item.name}.`);
      return done(
        {
          ...p,
          cash: round2(p.cash - item.price),
          possessions: [...p.possessions, item.name],
          energy: item.energy
            ? Math.min(p.energy + item.energy, 100)
            : p.energy,
          happiness: item.happiness
            ? Math.min(p.happiness + item.happiness, 100)
            : p.happiness,
        },
        `You bought ${item.name} for $${item.price}!`,
      );
    }

    case "buyMeal": {
      const meal = meals.find((m) => m.id === action.mealId);
      if (!meal) return fail("That meal doesn't exist.");
      if (p.cash < meal.price)
        return fail("You don't have enough cash for that meal.");
      return done(
        {
          ...p,
          cash: round2(p.cash - meal.price),
          energy: Math.min(p.energy + meal.energy, 100),
          happiness: Math.min(p.happiness + meal.happiness, 100),
        },
        `You enjoyed a ${meal.name}: +${meal.energy} energy, +${meal.happiness} happiness.`,
        MEAL_TIME,
      );
    }

    case "healing": {
      const svc = healingServices.find((s) => s.id === action.serviceId);
      if (!svc) return fail("That service doesn't exist.");
      if (p.cash < svc.price)
        return fail("You don't have enough cash for that service.");
      return done(
        {
          ...p,
          cash: round2(p.cash - svc.price),
          happiness: Math.min(p.happiness + svc.happiness, 100),
          relationship: {
            ...p.relationship,
            health: Math.min(p.relationship.health + svc.health, 100),
          },
        },
        `${svc.name}: health +${svc.health}, happiness +${svc.happiness}.`,
        HEALING_TIME,
      );
    }

    case "leisure": {
      const act = leisureActivities[action.activity];
      if (p.cash < act.cost)
        return fail(`You don't have enough cash for ${act.name}.`);
      if (p.energy < act.energy)
        return fail(`You're too tired for ${act.name}.`);
      return done(
        {
          ...p,
          cash: round2(p.cash - act.cost),
          energy: Math.max(0, p.energy - act.energy),
          happiness: Math.min(p.happiness + act.happiness, 100),
        },
        `You enjoyed ${act.name} and gained ${act.happiness} happiness!`,
        act.time,
      );
    }

    case "rentApartment": {
      if (p.rental.hasApartment)
        return fail("You already have an apartment — upgrade it instead.");
      const tier = apartmentTiers[action.tier];
      if (p.cash < tier.deposit)
        return fail(`You need $${tier.deposit} for the deposit.`);
      return done(
        {
          ...p,
          cash: p.cash - tier.deposit,
          rental: {
            ...p.rental,
            hasApartment: true,
            lastPaidWeek: p.week,
            rentAmount: tier.rentAmount,
            rentDue: false,
            missedPayments: 0,
          },
        },
        `You rented a ${action.tier} apartment for $${tier.rentAmount}/month with a $${tier.deposit} deposit.`,
        15,
      );
    }

    case "upgradeApartment": {
      if (!p.rental.hasApartment)
        return fail("You don't have an apartment to upgrade.");
      const current = tierFromRent(p.rental.rentAmount);
      if (tierOrder.indexOf(action.tier) <= tierOrder.indexOf(current)) {
        return fail("You can only upgrade to a better apartment.");
      }
      const fee = upgradeFee(current, action.tier);
      if (p.cash < fee) return fail(`You need $${fee} for the upgrade fee.`);
      return done(
        {
          ...p,
          cash: p.cash - fee,
          rental: {
            ...p.rental,
            lastPaidWeek: p.week,
            rentAmount: apartmentTiers[action.tier].rentAmount,
            rentDue: false,
          },
        },
        `You upgraded to a ${action.tier} apartment! New rent is $${apartmentTiers[action.tier].rentAmount}/month.`,
        15,
      );
    }

    case "payRent": {
      if (!p.rental.hasApartment)
        return fail("You don't have an apartment to pay rent for.");
      const weeksSince =
        p.rental.lastPaidWeek !== null ? p.week - p.rental.lastPaidWeek : 0;
      if (!p.rental.rentDue && weeksSince < RENT_INTERVAL_WEEKS) {
        return fail("You've already paid your rent for this month!");
      }
      if (p.cash < p.rental.rentAmount)
        return fail(`You need $${p.rental.rentAmount} to pay the rent.`);
      return done(
        {
          ...p,
          cash: p.cash - p.rental.rentAmount,
          rental: {
            ...p.rental,
            lastPaidWeek: p.week,
            rentDue: false,
            missedPayments: 0,
          },
        },
        `You paid your rent of $${p.rental.rentAmount}.`,
        5,
      );
    }

    case "deposit": {
      const amount = Math.floor(action.amount);
      if (amount <= 0) return fail("Enter an amount greater than zero.");
      if (p.cash < amount)
        return fail("You don't have enough cash to deposit that amount.");
      return done(
        {
          ...p,
          cash: p.cash - amount,
          bankAccount: {
            ...p.bankAccount,
            savings: p.bankAccount.savings + amount,
          },
        },
        `Deposited $${amount} into your savings account.`,
        5,
      );
    }

    case "withdraw": {
      const amount = Math.floor(action.amount);
      if (amount <= 0) return fail("Enter an amount greater than zero.");
      if (p.bankAccount.savings < amount)
        return fail("You don't have enough savings to withdraw that amount.");
      return done(
        {
          ...p,
          cash: p.cash + amount,
          bankAccount: {
            ...p.bankAccount,
            savings: p.bankAccount.savings - amount,
          },
        },
        `Withdrew $${amount} from your savings account.`,
        5,
      );
    }

    case "collectInterest": {
      // The original allowed unlimited collections (an exploit). Now once per week.
      if (p.bankAccount.lastInterestWeek === p.week) {
        return fail("You've already collected interest this week.");
      }
      const interest = Math.floor(p.bankAccount.savings * INTEREST_RATE);
      return done(
        {
          ...p,
          bankAccount: {
            savings: p.bankAccount.savings + interest,
            lastInterestWeek: p.week,
          },
        },
        `You earned $${interest} in interest!`,
        5,
      );
    }

    case "buyShares": {
      const amount = Math.floor(action.amount);
      if (amount < 1) return fail("Buy at least 1 share.");
      const stock = market.find((s) => s.id === action.shareId);
      if (!stock) return fail("Unknown stock.");
      const cost = round2(stock.price * amount);
      if (p.cash < cost)
        return fail("You don't have enough cash to buy these shares.");
      const existing = p.shares.find((s) => s.id === stock.id);
      const shares = existing
        ? p.shares.map((s) =>
            s.id === stock.id ? { ...s, owned: s.owned + amount } : s,
          )
        : [...p.shares, { id: stock.id, owned: amount }];
      return done(
        { ...p, cash: round2(p.cash - cost), shares },
        `You bought ${amount} shares of ${stock.name} for $${cost.toFixed(2)}.`,
        5,
      );
    }

    case "sellShares": {
      const amount = Math.floor(action.amount);
      if (amount < 1) return fail("Sell at least 1 share.");
      const stock = market.find((s) => s.id === action.shareId);
      const holding = p.shares.find((s) => s.id === action.shareId);
      if (!stock || !holding || holding.owned < amount)
        return fail("You don't own enough shares to sell.");
      const value = round2(stock.price * amount);
      const shares = p.shares
        .map((s) => (s.id === stock.id ? { ...s, owned: s.owned - amount } : s))
        .filter((s) => s.owned > 0);
      return done(
        { ...p, cash: round2(p.cash + value), shares },
        `You sold ${amount} shares of ${stock.name} for $${value.toFixed(2)}.`,
        5,
      );
    }

    case "startDating": {
      if (p.relationship.isDating) return fail("You need to break up first.");
      const person = findDatingOption(action.personId);
      if (!person) return fail("That person doesn't exist.");
      return done(
        {
          ...p,
          relationship: {
            ...p.relationship,
            isDating: true,
            partnerId: person.id,
            dateCount: 1,
            happiness: 30,
          },
        },
        `You've started dating ${person.name}!`,
        15,
      );
    }

    case "goOnDate": {
      const person = findDatingOption(action.personId);
      if (
        !p.relationship.isDating ||
        !person ||
        p.relationship.partnerId !== person.id
      ) {
        return fail("You can only go on dates with your partner.");
      }
      if (p.cash < person.datePrice)
        return fail("You don't have enough cash for this date.");
      return done(
        {
          ...p,
          cash: p.cash - person.datePrice,
          happiness: Math.min(p.happiness + person.happinessBoost, 100),
          relationship: {
            ...p.relationship,
            dateCount: p.relationship.dateCount + 1,
            happiness: Math.min(p.relationship.happiness + 15, 100),
            health: Math.min(p.relationship.health + person.healthBoost, 100),
          },
        },
        `You had a wonderful date with ${person.name}!`,
        20,
      );
    }

    case "breakUp": {
      if (!p.relationship.isDating) return fail("You're not dating anyone.");
      const partner =
        p.relationship.partnerId !== null
          ? findDatingOption(p.relationship.partnerId)
          : undefined;
      return done(
        {
          ...p,
          happiness: Math.max(p.happiness - 15, 0),
          relationship: {
            ...p.relationship,
            isDating: false,
            partnerId: null,
            dateCount: 0,
            happiness: 0,
          },
        },
        `You broke up with ${partner?.name ?? "your partner"}. It's for the best, but it still hurts.`,
        10,
      );
    }
  }
}

// ── Week rollover (what USE_TIME did when time ran out) ─────────────────────
function applyEventEffects(
  p: PlayerState,
  effects: Partial<Record<EventStat, number>>,
): PlayerState {
  const next = { ...p };
  for (const [stat, change] of Object.entries(effects) as [
    EventStat,
    number,
  ][]) {
    switch (stat) {
      case "cash":
        next.cash = Math.max(0, next.cash + change);
        break;
      case "happiness":
        next.happiness = clamp(next.happiness + change, 0, 100);
        break;
      case "energy":
        next.energy = clamp(next.energy + change, 0, 100);
        break;
      case "education":
        next.education = clamp(next.education + change, 0, 100);
        break;
      case "experience":
        next.experience = clamp(next.experience + change, 0, 100);
        break;
    }
  }
  return next;
}

function updateMarket(market: readonly Stock[], rng: () => number): Stock[] {
  return market.map((s) => {
    const changePercent = rng() * 35 - 15; // −15 % … +20 %
    const price = Math.max(
      5,
      round2(s.price + round2((s.price * changePercent) / 100)),
    );
    return { ...s, price, change: round2(changePercent) };
  });
}

// ── Public entry point ──────────────────────────────────────────────────────
export type ActionOutcome =
  | {
      readonly ok: true;
      readonly core: GameCore;
      readonly message: string;
      /** True when this action used up the week and a new one began. */
      readonly weekEnded: boolean;
    }
  | { readonly ok: false; readonly error: string };

function pushLog(
  core: GameCore,
  seat: number,
  text: string,
  now: number,
): GameCore {
  const log = [...core.log, { seat, text, at: now }].slice(-MAX_LOG_ENTRIES);
  return { ...core, log };
}

/**
 * Run one action for `seat`. The caller is responsible for verifying that the
 * authenticated user is allowed to act for that seat.
 */
export function performAction(
  core: GameCore,
  seat: number,
  action: GameAction,
  rng: () => number,
  now: number,
): ActionOutcome {
  if (core.status !== "active")
    return { ok: false, error: "This game is over." };
  if (seat !== core.currentSeat)
    return { ok: false, error: "It's not your turn." };
  const player = core.players[seat];
  if (!player) return { ok: false, error: "Unknown player." };

  const result = applyAction(player, action, core.market);
  if (!result.ok) return { ok: false, error: result.error };

  let next: GameCore = {
    ...core,
    players: setAt(core.players, seat, result.player),
  };
  let message = result.message;
  next = pushLog(next, seat, result.message, now);

  // Win check right after the action (before the week may roll over).
  if (evaluateGoals(result.player).achieved) {
    next = {
      ...next,
      status: "finished",
      winnerSeat: seat,
      log: [
        ...next.log,
        {
          seat,
          text: `🎉 ${result.player.name} reached every goal and won the game!`,
          at: now,
        },
      ].slice(-MAX_LOG_ENTRIES),
    };
    return {
      ok: true,
      core: next,
      message: `🎉 ${result.player.name} won the game!`,
      weekEnded: false,
    };
  }

  // Spend time; roll the week over when it runs out. Less than one trip's
  // worth of time left counts as "out": nothing useful can be done with it.
  let weekEnded = false;
  if (result.time > 0) {
    const timeLeft = result.player.timeLeft - result.time;
    if (timeLeft >= TRAVEL_TIME) {
      next = {
        ...next,
        players: setAt(next.players, seat, { ...result.player, timeLeft }),
      };
    } else {
      const rolled = rollWeek(next, seat, rng, now);
      next = rolled.core;
      message = `${message} ${rolled.summary}`.trim();
      weekEnded = true;
    }
  }
  return { ok: true, core: next, message, weekEnded };
}

function rollWeek(
  core: GameCore,
  seat: number,
  rng: () => number,
  now: number,
): { core: GameCore; summary: string } {
  const before = core.players[seat];
  let p: PlayerState = {
    ...before,
    week: before.week + 1,
    timeLeft: WEEK_LENGTH,
    // A new week starts at home, if they have one.
    location: before.rental.hasApartment ? "apartment" : before.location,
    energy: Math.min(before.energy + 20, 100),
    happiness: before.happiness > 50 ? before.happiness - 5 : before.happiness,
  };
  let summary = `Week ${p.week} begins for ${p.name}.`;
  if (p.location !== before.location)
    summary += " You went home for the weekend.";
  let next: GameCore = core;

  if (rng() < 0.7) {
    const ev = pickRandomEvent(p, rng);
    p = applyEventEffects(p, ev.effects);
    next = {
      ...next,
      lastEvent: {
        seat,
        eventId: ev.id,
        title: ev.title,
        description: ev.description,
        at: now,
      },
    };
    summary += ` ${ev.title}: ${ev.description}`;
    next = pushLog(next, seat, `${ev.title}: ${ev.description}`, now);
  }

  if (p.rental.hasApartment) {
    const weeksSince =
      p.rental.lastPaidWeek !== null ? p.week - p.rental.lastPaidWeek : 0;
    if (weeksSince >= RENT_INTERVAL_WEEKS) {
      p = {
        ...p,
        rental: {
          ...p.rental,
          rentDue: true,
          missedPayments: p.rental.missedPayments + 1,
        },
        happiness: Math.max(p.happiness - 10, 0),
      };
      summary += " Your rent is due!";
      next = pushLog(next, seat, `${p.name}'s rent is due.`, now);
    }
  }

  const players = setAt(next.players, seat, p);
  const total = players.length;
  const nextSeat = total > 1 ? (seat + 1) % total : seat;
  let round = next.round;
  let market = next.market;
  if (nextSeat <= seat) {
    // Everyone has had their week → a round passes and the stock market moves.
    round += 1;
    market = updateMarket(market, rng);
  }
  if (total > 1) summary += ` ${players[nextSeat].name}'s turn!`;

  next = { ...next, players, currentSeat: nextSeat, round, market };
  // Winner might emerge from a favourable random event.
  if (evaluateGoals(p).achieved) {
    next = {
      ...next,
      status: "finished",
      winnerSeat: seat,
      log: [
        ...next.log,
        {
          seat,
          text: `🎉 ${p.name} reached every goal and won the game!`,
          at: now,
        },
      ].slice(-MAX_LOG_ENTRIES),
    };
  }
  return { core: next, summary };
}

// ── Read-only helpers for the UI ────────────────────────────────────────────
export function jobIsAvailable(p: PlayerState, title: string): boolean {
  const job = findJob(title);
  if (!job) return false;
  if (p.experience < job.expReq) return false;
  return (Object.entries(job.requiredSubjects) as [SubjectId, number][]).every(
    ([s, level]) => p.subjects[s] >= level,
  );
}

/** Jobs worth showing by default (within reach), as the original filter did. */
export function jobsWithinReach(p: PlayerState): typeof jobs {
  return jobs.filter((job) => {
    if (job.expReq === 0 && Object.keys(job.requiredSubjects).length === 0)
      return true;
    if (job.expReq > p.experience + 30) return false;
    return (
      Object.entries(job.requiredSubjects) as [SubjectId, number][]
    ).every(([s, level]) => level <= p.subjects[s] + 20);
  });
}
