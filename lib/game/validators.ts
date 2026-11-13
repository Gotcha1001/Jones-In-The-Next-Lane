/**
 * lib/game/validators.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for every shape that is stored in Convex.
 * TypeScript types are DERIVED from these validators with `Infer`, so the
 * database schema, the server rules engine and the React UI can never drift.
 */
import { v, type Infer } from "convex/values";

export const vSubjectId = v.union(
  v.literal("engineering"),
  v.literal("computerScience"),
  v.literal("business"),
  v.literal("liberalArts"),
);

export const vSubjects = v.object({
  engineering: v.number(),
  computerScience: v.number(),
  business: v.number(),
  liberalArts: v.number(),
});

export const vLocationId = v.union(
  v.literal("rentoffice"),
  v.literal("apartment"),
  v.literal("university"),
  v.literal("employmentOffice"),
  v.literal("workplace"),
  v.literal("mall"),
  v.literal("leisureCenter"),
  v.literal("bank"),
  v.literal("fastFood"),
  v.literal("datingOffice"),
  v.literal("healingCentre"),
);

export const vApartmentTier = v.union(
  v.literal("basic"),
  v.literal("standard"),
  v.literal("luxury"),
);

export const vLeisureId = v.union(
  v.literal("basic"),
  v.literal("swimming"),
  v.literal("gym"),
  v.literal("spa"),
  v.literal("games"),
);

export const vHomeActivity = v.union(
  v.literal("tv"),
  v.literal("games"),
  v.literal("meditate"),
);

export const vGoals = v.object({
  cash: v.number(),
  education: v.number(),
  happiness: v.number(),
  winningJobs: v.array(v.string()),
});

export const vRental = v.object({
  hasApartment: v.boolean(),
  lastPaidWeek: v.union(v.number(), v.null()),
  rentAmount: v.number(),
  rentDue: v.boolean(),
  missedPayments: v.number(),
});

export const vBankAccount = v.object({
  savings: v.number(),
  /** Player-week in which interest was last collected (once per week). */
  lastInterestWeek: v.union(v.number(), v.null()),
});

export const vRelationship = v.object({
  isDating: v.boolean(),
  partnerId: v.union(v.number(), v.null()),
  dateCount: v.number(),
  happiness: v.number(),
  health: v.number(),
});

export const vShareHolding = v.object({
  id: v.number(),
  owned: v.number(),
});

export const vPlayer = v.object({
  seat: v.number(),
  name: v.string(),
  avatar: v.string(),
  cash: v.number(),
  subjects: vSubjects,
  experience: v.number(),
  rental: vRental,
  bankAccount: vBankAccount,
  relationship: vRelationship,
  shares: v.array(vShareHolding),
  education: v.number(),
  happiness: v.number(),
  energy: v.number(),
  jobTitle: v.union(v.string(), v.null()),
  possessions: v.array(v.string()),
  location: vLocationId,
  week: v.number(),
  timeLeft: v.number(),
  goals: vGoals,
});

export const vSeat = v.object({
  seat: v.number(),
  /** null in local (hot-seat) games where one account controls every seat. */
  userId: v.union(v.id("users"), v.null()),
  name: v.string(),
  avatar: v.string(),
});

export const vStock = v.object({
  id: v.number(),
  name: v.string(),
  price: v.number(),
  change: v.number(),
});

export const vLogEntry = v.object({
  seat: v.number(),
  text: v.string(),
  at: v.number(),
});

export const vLastEvent = v.union(
  v.null(),
  v.object({
    seat: v.number(),
    eventId: v.string(),
    title: v.string(),
    description: v.string(),
    at: v.number(),
  }),
);

export const vGameStatus = v.union(v.literal("active"), v.literal("finished"));
export const vGameMode = v.union(v.literal("online"), v.literal("local"));

/** Everything the rules engine reads and writes. */
export const vGameCore = v.object({
  status: vGameStatus,
  players: v.array(vPlayer),
  currentSeat: v.number(),
  round: v.number(),
  market: v.array(vStock),
  log: v.array(vLogEntry),
  lastEvent: vLastEvent,
  winnerSeat: v.union(v.number(), v.null()),
});

// ── Actions (what a client may ask the server to do) ────────────────────────
export const vGameAction = v.union(
  v.object({ type: v.literal("moveTo"), locationId: vLocationId }),
  v.object({ type: v.literal("endTurn") }),
  v.object({ type: v.literal("sleep") }),
  v.object({ type: v.literal("homeActivity"), activity: vHomeActivity }),
  v.object({
    type: v.literal("studySubject"),
    subject: vSubjectId,
    hours: v.number(),
  }),
  v.object({ type: v.literal("work") }),
  v.object({ type: v.literal("workRest") }),
  v.object({ type: v.literal("applyJob"), jobTitle: v.string() }),
  v.object({ type: v.literal("buyItem"), itemName: v.string() }),
  v.object({ type: v.literal("buyMeal"), mealId: v.number() }),
  v.object({ type: v.literal("healing"), serviceId: v.number() }),
  v.object({ type: v.literal("leisure"), activity: vLeisureId }),
  v.object({ type: v.literal("rentApartment"), tier: vApartmentTier }),
  v.object({ type: v.literal("upgradeApartment"), tier: vApartmentTier }),
  v.object({ type: v.literal("payRent") }),
  v.object({ type: v.literal("deposit"), amount: v.number() }),
  v.object({ type: v.literal("withdraw"), amount: v.number() }),
  v.object({ type: v.literal("collectInterest") }),
  v.object({
    type: v.literal("buyShares"),
    shareId: v.number(),
    amount: v.number(),
  }),
  v.object({
    type: v.literal("sellShares"),
    shareId: v.number(),
    amount: v.number(),
  }),
  v.object({ type: v.literal("startDating"), personId: v.number() }),
  v.object({ type: v.literal("goOnDate"), personId: v.number() }),
  v.object({ type: v.literal("breakUp") }),
);

// ── Derived TypeScript types ────────────────────────────────────────────────
export type SubjectId = Infer<typeof vSubjectId>;
export type Subjects = Infer<typeof vSubjects>;
export type LocationId = Infer<typeof vLocationId>;
export type ApartmentTier = Infer<typeof vApartmentTier>;
export type LeisureId = Infer<typeof vLeisureId>;
export type HomeActivity = Infer<typeof vHomeActivity>;
export type Goals = Infer<typeof vGoals>;
export type PlayerState = Infer<typeof vPlayer>;
export type Seat = Infer<typeof vSeat>;
export type Stock = Infer<typeof vStock>;
export type LogEntry = Infer<typeof vLogEntry>;
export type LastEvent = Infer<typeof vLastEvent>;
export type GameCore = Infer<typeof vGameCore>;
export type GameAction = Infer<typeof vGameAction>;
export type GameMode = Infer<typeof vGameMode>;
