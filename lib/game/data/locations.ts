import type { LocationId } from "../validators";

export interface LocationDef {
  readonly name: string;
  readonly description: string;
  readonly image: string;
  readonly emoji: string;
  /** % position on the map */
  readonly mapX: number;
  readonly mapY: number;
}

export const locations = {
  rentoffice: {
    name: "Rental Office",
    description: "Manage your apartment rental and pay your rent here.",
    image: "/rent.jpg",
    emoji: "🏢",
    mapX: 90,
    mapY: 13,
  },
  apartment: {
    name: "Apartment",
    description: "Your humble abode",
    image: "/home.jpg",
    emoji: "🏠",
    mapX: 45,
    mapY: 14,
  },
  university: {
    name: "University",
    description: "Increase your education",
    image: "/universityimage.jpg",
    emoji: "🎓",
    mapX: 15,
    mapY: 15,
  },
  employmentOffice: {
    name: "Employment Office",
    description: "Find a job",
    image: "/employment.jpg",
    emoji: "💼",
    mapX: 88,
    mapY: 65,
  },
  workplace: {
    name: "Workplace",
    description: "Earn money at your job",
    image: "/boss.jpg",
    emoji: "🏭",
    mapX: 88,
    mapY: 40,
  },
  mall: {
    name: "Shopping Mall",
    description: "Buy items to improve your life",
    image: "/mall.jpg",
    emoji: "🛍️",
    mapX: 15,
    mapY: 65,
  },
  leisureCenter: {
    name: "Leisure Center",
    description: "Have fun and relax",
    image: "/leisure.jpg",
    emoji: "🏊",
    mapX: 20,
    mapY: 88,
  },
  bank: {
    name: "Python Bank",
    description: "Manage your finances and save for the future",
    image: "/banklady.jpg",
    emoji: "🏦",
    mapX: 88,
    mapY: 88,
  },
  fastFood: {
    name: "Python Burgers",
    description: "Grab a quick bite to eat",
    image: "/fastfood.jpg",
    emoji: "🍔",
    mapX: 15,
    mapY: 40,
  },
  datingOffice: {
    name: "Dating Office",
    description: "Find your special someone",
    image: "/datingoffice.jpg",
    emoji: "💘",
    mapX: 69,
    mapY: 15,
  },
  healingCentre: {
    name: "Zen Healing Centre",
    description: "Boost your health and happiness",
    image: "/meditate.jpg",
    emoji: "🧘",
    mapX: 57,
    mapY: 88,
  },
} as const satisfies Record<LocationId, LocationDef>;

export const locationIds = Object.keys(locations) as LocationId[];

/** Time units spent walking between any two locations. */
export const TRAVEL_TIME = 5;

/** Chance (0–1) that a trip costs no time at all (a lift, a shortcut…). */
export const FREE_TRAVEL_CHANCE = 0.3;
