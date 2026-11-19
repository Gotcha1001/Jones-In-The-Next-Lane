import { jobs } from "./jobs";
import type {
  ApartmentTier,
  HomeActivity,
  LeisureId,
  SubjectId,
  Subjects,
} from "../validators";

export interface Meal {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  /** Energy restored (0-100 scale). Low energy cuts your pay and study gains. */
  readonly energy: number;
  readonly happiness: number;
  /**
   * Health change from the FIRST meal of the week (extra meals the same week
   * only restore energy and happiness). Cheap junk food is slightly bad for
   * you, premium food is good for you.
   */
  readonly health: number;
}
/**
 * Prices run from $4 to $18. The more you pay, the more the meal does for
 * you: energy, happiness and (mostly) health. A few cheap items are junk food
 * that fills the "ate this week" box but costs a little health.
 */
export const meals: readonly Meal[] = [
  { id: 1, name: "Value Meal", price: 5, energy: 10, happiness: 5, health: -2 },
  {
    id: 2,
    name: "Regular Combo",
    price: 10,
    energy: 20,
    happiness: 10,
    health: 1,
  },
  {
    id: 3,
    name: "Super Size Meal",
    price: 15,
    energy: 30,
    happiness: 15,
    health: 0,
  },
  {
    id: 4,
    name: "Healthy Option",
    price: 12,
    energy: 25,
    happiness: 8,
    health: 8,
  },
  {
    id: 5,
    name: "Code Crunch Burger",
    price: 8,
    energy: 15,
    happiness: 12,
    health: -1,
  },
  {
    id: 6,
    name: "Boolean Breakfast",
    price: 7,
    energy: 18,
    happiness: 9,
    health: 2,
  },
  {
    id: 7,
    name: "Algorithm Avocado Toast",
    price: 14,
    energy: 22,
    happiness: 14,
    health: 6,
  },
  {
    id: 8,
    name: "Recursive Ribs",
    price: 18,
    energy: 35,
    happiness: 18,
    health: 3,
  },
  {
    id: 9,
    name: "Function Fries",
    price: 4,
    energy: 8,
    happiness: 7,
    health: -3,
  },
  {
    id: 10,
    name: "Exception Enchiladas",
    price: 11,
    energy: 25,
    happiness: 13,
    health: 3,
  },
  {
    id: 11,
    name: "Python Protein Bowl",
    price: 16,
    energy: 30,
    happiness: 10,
    health: 10,
  },
  {
    id: 12,
    name: "Debugging Donuts",
    price: 6,
    energy: 12,
    happiness: 16,
    health: -3,
  },
  {
    id: 13,
    name: "Syntax Smoothie",
    price: 9,
    energy: 15,
    happiness: 14,
    health: 4,
  },
  {
    id: 14,
    name: "Loop Lasagna",
    price: 13,
    energy: 28,
    happiness: 17,
    health: 4,
  },
];
export const MEAL_TIME = 10;

/** One number for "how good is this meal for you" (used by the bots). */
export function mealValue(m: Meal): number {
  return m.energy + m.happiness + m.health * 2;
}

export interface HealingService {
  readonly id: number;
  readonly name: string;
  readonly price: number;
  readonly health: number;
  readonly happiness: number;
}
export const healingServices: readonly HealingService[] = [
  { id: 1, name: "Tarot Reading", price: 15, health: 5, happiness: 10 },
  { id: 2, name: "Massage Session", price: 25, health: 15, happiness: 15 },
  { id: 3, name: "Meditation Course", price: 20, health: 10, happiness: 20 },
  { id: 4, name: "Reiki Healing", price: 30, health: 20, happiness: 10 },
  { id: 5, name: "Hypnosis Therapy", price: 35, health: 15, happiness: 15 },
  { id: 6, name: "Counselling Session", price: 40, health: 20, happiness: 20 },
  {
    id: 8,
    name: "Acupuncture Treatment",
    price: 45,
    health: 25,
    happiness: 12,
  },
  { id: 9, name: "Yoga Class", price: 18, health: 18, happiness: 15 },
  { id: 10, name: "Crystal Healing", price: 22, health: 8, happiness: 22 },
  {
    id: 11,
    name: "Aromatherapy Session",
    price: 20,
    health: 12,
    happiness: 18,
  },
  { id: 12, name: "Chakra Balancing", price: 32, health: 18, happiness: 18 },
  {
    id: 13,
    name: "Reflexology Treatment",
    price: 30,
    health: 20,
    happiness: 12,
  },
  {
    id: 14,
    name: "Guided Visualization",
    price: 25,
    health: 10,
    happiness: 25,
  },
  { id: 15, name: "Energy Clearing", price: 35, health: 15, happiness: 20 },
];
export const HEALING_TIME = 15;

export interface LeisureActivity {
  readonly name: string;
  readonly description: string;
  readonly cost: number;
  readonly time: number;
  readonly energy: number;
  readonly happiness: number;
}
export const leisureActivities = {
  basic: {
    name: "Basic Relaxation",
    description: "Take a short break to unwind",
    cost: 0,
    time: 10,
    energy: 5,
    happiness: 15,
  },
  swimming: {
    name: "Swimming Session",
    description: "Enjoy the pool facilities",
    cost: 15,
    time: 20,
    energy: 10,
    happiness: 25,
  },
  gym: {
    name: "Gym Workout",
    description: "Build strength and fitness",
    cost: 10,
    time: 25,
    energy: 15,
    happiness: 20,
  },
  spa: {
    name: "Spa Treatment",
    description: "Luxury relaxation experience",
    cost: 40,
    time: 30,
    energy: 0,
    happiness: 40,
  },
  games: {
    name: "Gaming Zone",
    description: "Play the latest games",
    cost: 20,
    time: 15,
    energy: 10,
    happiness: 30,
  },
} as const satisfies Record<LeisureId, LeisureActivity>;

export interface HomeActivityDef {
  readonly name: string;
  readonly time: number;
  readonly energyCost: number;
  readonly happiness: number;
}
/** Negative energyCost restores energy (meditation). */
export const homeActivities = {
  tv: { name: "Watch TV", time: 15, energyCost: 5, happiness: 10 },
  games: { name: "Play Video Games", time: 20, energyCost: 8, happiness: 15 },
  meditate: { name: "Meditate", time: 15, energyCost: -5, happiness: 12 },
} as const satisfies Record<HomeActivity, HomeActivityDef>;
/** Minimum energy the original game required before each activity. */
export const homeActivityMinEnergy: Record<HomeActivity, number> = {
  tv: 5,
  games: 8,
  meditate: 3,
};

export interface TierDef {
  readonly rentAmount: number;
  readonly deposit: number;
  readonly label: string;
}
export const apartmentTiers = {
  basic: { rentAmount: 50, deposit: 100, label: "Basic Apartment" },
  standard: { rentAmount: 100, deposit: 200, label: "Standard Apartment" },
  luxury: { rentAmount: 200, deposit: 400, label: "Luxury Apartment" },
} as const satisfies Record<ApartmentTier, TierDef>;

export const tierOrder: readonly ApartmentTier[] = [
  "basic",
  "standard",
  "luxury",
];

export function tierFromRent(rentAmount: number): ApartmentTier {
  const hit = tierOrder.find(
    (t) => apartmentTiers[t].rentAmount === rentAmount,
  );
  return hit ?? "basic";
}

/** Fee to move from `from` to `to` (upgrade only). */
export function upgradeFee(from: ApartmentTier, to: ApartmentTier): number {
  if (to === "standard") return 150;
  if (to === "luxury") return from === "basic" ? 350 : 250;
  return 0;
}

export const SUBJECTS = [
  {
    id: "computerScience",
    name: "Computer Science",
    description: "Learn programming and algorithms",
    specialist: false,
  },
  {
    id: "engineering",
    name: "Engineering",
    description: "Develop technical problem-solving skills",
    specialist: false,
  },
  {
    id: "business",
    name: "Business Administration",
    description: "Study management and finance",
    specialist: false,
  },
  {
    id: "liberalArts",
    name: "Liberal Arts",
    description: "Broaden your horizons",
    specialist: false,
  },
  // ── Specialist subjects: unlock extra careers, but are NOT part of the
  //    education average (so the original win condition is unchanged). ──
  {
    id: "medicine",
    name: "Medicine",
    description: "Anatomy, diagnosis and patient care",
    specialist: true,
  },
  {
    id: "law",
    name: "Law",
    description: "Contracts, courtrooms and legal argument",
    specialist: true,
  },
  {
    id: "science",
    name: "Natural Sciences",
    description: "Run experiments and master research methods",
    specialist: true,
  },
  {
    id: "design",
    name: "Arts & Design",
    description: "Visual, product and creative design skills",
    specialist: true,
  },
] as const satisfies readonly {
  id: SubjectId;
  name: string;
  description: string;
  specialist: boolean;
}[];

/** The four original subjects; education is the average of exactly these. */
export const CORE_SUBJECT_IDS = [
  "computerScience",
  "engineering",
  "business",
  "liberalArts",
] as const;
export type CoreSubjectId = (typeof CORE_SUBJECT_IDS)[number];

/** Level (0–100) of a subject; older saves may not have specialist ones. */
export function subjectLevel(subjects: Subjects, id: SubjectId): number {
  return subjects[id] ?? 0;
}

/**
 * One-off tuition to register for a subject. It scales with the best salary
 * of any job that subject unlocks, so the subjects leading to the highest
 * paying careers cost the most. Derived from the job data, so it never drifts.
 */
const TUITION_RATE = 0.5;
export function subjectTuition(id: string): number {
  const top = jobs
    .filter((j) => id in j.requiredSubjects)
    .reduce((max, j) => Math.max(max, j.salary), 0);
  return Math.round((top * TUITION_RATE) / 10) * 10;
}

/**
 * Has this player registered (paid tuition) for the subject? Players who
 * already have points in it (older saves) count as registered.
 */
export function isEnrolled(
  p: { subjects: Subjects; enrolled?: readonly string[] },
  id: SubjectId,
): boolean {
  return (p.enrolled ?? []).includes(id) || subjectLevel(p.subjects, id) > 0;
}

/** Friendly name for a subject id (falls back to the id). */
export function subjectName(id: string): string {
  return SUBJECTS.find((s) => s.id === id)?.name ?? id;
}

export const INITIAL_STOCKS = [
  { id: 1, name: "TechCorp", price: 25, change: 0 },
  { id: 2, name: "GreenEnergy", price: 15, change: 0 },
  { id: 3, name: "MegaRetail", price: 40, change: 0 },
  { id: 4, name: "HealthPlus", price: 30, change: 0 },
  { id: 5, name: "DataSec", price: 20, change: 0 },
] as const;
