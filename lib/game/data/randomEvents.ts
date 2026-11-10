import type { PlayerState } from "../validators";

export type EventCategory =
  | "financial_positive"
  | "financial_negative"
  | "health"
  | "happiness"
  | "mixed"
  | "neutral";

export type EventStat =
  | "cash"
  | "happiness"
  | "energy"
  | "education"
  | "experience";

export interface RandomEvent {
  readonly id: string;
  readonly category: EventCategory;
  readonly title: string;
  readonly description: string;
  readonly effects: Partial<Record<EventStat, number>>;
  /** Higher numbers = more likely. */
  readonly probability: number;
  readonly condition?: (player: PlayerState) => boolean;
}

// Collection of possible random events that can occur between weeks
// Collection of possible random events that can occur between weeks
export const randomEvents: readonly RandomEvent[] = [
  {
    id: "found_money",
    category: "financial_positive",
    title: "Found Money!",
    description: "You found $50 on the street!",
    effects: {
      cash: 50,
    },
    probability: 10, // Higher numbers = more likely
  },
  {
    id: "lost_keys",
    category: "financial_negative",
    title: "Lost Your Keys",
    description: "You had to replace your house keys and locks. Not cheap!",
    effects: {
      cash: -90,
      happiness: -5,
    },
    probability: 6,
  },
  {
    id: "gym_progress",
    category: "health",
    title: "Gym Progress!",
    description: "You've been consistent with your workouts and feel stronger.",
    effects: {
      energy: 10,
      happiness: 5,
    },
    probability: 7,
  },
  {
    id: "won_contest",
    category: "financial_positive",
    title: "Won a Contest!",
    description: "You entered a random contest and surprisingly won $125!",
    effects: {
      cash: 125,
      happiness: 10,
    },
    probability: 4,
  },
  {
    id: "overslept_work",
    category: "mixed",
    title: "Overslept for Work",
    description: "You slept in and missed an important meeting.",
    effects: {
      happiness: -5,
      energy: 20,
    },
    condition: (p) => p.jobTitle !== null,
    probability: 6,
  },
  {
    id: "new_hobby",
    category: "happiness",
    title: "Discovered a New Hobby",
    description: "You tried painting for the first time and loved it.",
    effects: {
      happiness: 12,
      energy: -5,
    },
    probability: 9,
  },
  {
    id: "burnt_dinner",
    category: "neutral",
    title: "Burnt Your Dinner",
    description:
      "Tried cooking something new. Let's just say... it didn’t work.",
    effects: {
      happiness: -3,
    },
    probability: 8,
  },
  {
    id: "random_tip",
    category: "financial_positive",
    title: "Generous Tip",
    description: "A stranger tipped you $40 for a kind gesture.",
    effects: {
      cash: 40,
      happiness: 5,
    },
    probability: 9,
  },
  {
    id: "bike_flat",
    category: "financial_negative",
    title: "Flat Tire",
    description: "Your bike got a flat and needed a quick repair.",
    effects: {
      cash: -30,
      energy: -5,
    },
    probability: 8,
  },
  {
    id: "early_payment",
    category: "financial_positive",
    title: "Early Payment",
    description: "You received an early payment for freelance work.",
    effects: {
      cash: 85,
      happiness: 5,
    },
    condition: (p) => p.jobTitle === "freelancer",
    probability: 5,
  },
  {
    id: "too_much_coffee",
    category: "mixed",
    title: "Too Much Coffee",
    description: "You drank way too much coffee... jittery but focused.",
    effects: {
      energy: -10,
      education: 3,
    },
    probability: 7,
  },
  {
    id: "tax_refund",
    category: "financial_positive",
    title: "Tax Refund",
    description: "You received a tax refund of $100!",
    effects: {
      cash: 100,
    },
    probability: 5,
  },
  {
    id: "relatives_gift",
    category: "financial_positive",
    title: "Gift from Relatives",
    description: "Your relatives sent you $75 as a gift!",
    effects: {
      cash: 75,
      happiness: 5,
    },
    probability: 7,
  },
  {
    id: "won_lottery",
    category: "financial_positive",
    title: "Small Lottery Win",
    description: "You won $200 in a small lottery!",
    effects: {
      cash: 200,
      happiness: 10,
    },
    probability: 3,
  },
  {
    id: "stolen_wallet",
    category: "financial_negative",
    title: "Wallet Stolen",
    description: "Your wallet was stolen with $60 inside.",
    effects: {
      cash: -60,
      happiness: -10,
    },
    probability: 7,
  },
  {
    id: "car_repair",
    category: "financial_negative",
    title: "Unexpected Car Repair",
    description: "Your car needed repairs costing $120.",
    effects: {
      cash: -120,
      happiness: -5,
    },
    probability: 8,
  },
  {
    id: "broke_phone",
    category: "financial_negative",
    title: "Broken Phone",
    description: "You dropped and broke your phone. Repairs cost $80.",
    effects: {
      cash: -80,
      happiness: -5,
    },
    probability: 6,
  },
  {
    id: "doctor_visit",
    category: "health",
    title: "Doctor Visit",
    description: "You had to visit the doctor. The bill came to $70.",
    effects: {
      cash: -70,
      energy: -10,
    },
    probability: 8,
  },
  {
    id: "found_old_savings",
    category: "financial_positive",
    title: "Found Old Savings",
    description: "You discovered an old savings account with $60 in it!",
    effects: {
      cash: 60,
      happiness: 4,
    },
    probability: 6,
  },
  {
    id: "missed_bus",
    category: "mixed",
    title: "Missed the Bus",
    description: "You missed the bus and had to walk. Tiring but refreshing.",
    effects: {
      energy: -10,
      happiness: 2,
    },
    probability: 9,
  },
  {
    id: "free_subscription",
    category: "financial_positive",
    title: "Free Subscription",
    description: "You won a free 3-month subscription to your favorite app!",
    effects: {
      happiness: 8,
      cash: 10,
    },
    probability: 5,
  },
  {
    id: "bad_sleep",
    category: "health",
    title: "Poor Sleep",
    description: "You tossed and turned all night and feel drained.",
    effects: {
      energy: -20,
    },
    probability: 8,
  },
  {
    id: "volunteer_event",
    category: "neutral",
    title: "Volunteered at a Shelter",
    description: "You helped out at a local shelter. Felt good, but tiring.",
    effects: {
      energy: -10,
      happiness: 10,
    },
    probability: 7,
  },
  {
    id: "overcooked_lunch",
    category: "neutral",
    title: "Overcooked Lunch",
    description: "You forgot about your lunch on the stove. Oops.",
    effects: {
      cash: -15,
    },
    probability: 7,
  },
  {
    id: "work_praise",
    category: "happiness",
    title: "Praised at Work",
    description: "Your boss complimented your work. You feel proud!",
    effects: {
      happiness: 12,
    },
    condition: (p) => p.jobTitle !== null,
    probability: 6,
  },
  {
    id: "short_vacation",
    category: "happiness",
    title: "Weekend Getaway",
    description: "You took a short vacation and feel refreshed.",
    effects: {
      happiness: 20,
      energy: 15,
      cash: -100,
    },
    probability: 4,
  },
  {
    id: "random_checkup",
    category: "health",
    title: "Health Check-Up",
    description: "You had a surprise check-up. Everything looks good!",
    effects: {
      cash: -40,
      energy: -5,
      happiness: 3,
    },
    probability: 7,
  },
  {
    id: "impulse_buy",
    category: "financial_negative",
    title: "Impulse Shopping",
    description: "You couldn't resist and bought something expensive online.",
    effects: {
      cash: -70,
      happiness: 6,
    },
    probability: 6,
  },
  {
    id: "caught_cold",
    category: "health",
    title: "Caught a Cold",
    description: "You caught a cold over the weekend. You feel a bit tired.",
    effects: {
      energy: -15,
    },
    probability: 10,
  },
  {
    id: "free_dinner",
    category: "happiness",
    title: "Free Dinner",
    description: "A friend treated you to dinner at a nice restaurant!",
    effects: {
      happiness: 15,
    },
    probability: 10,
  },
  {
    id: "great_weekend",
    category: "happiness",
    title: "Great Weekend!",
    description: "You had an amazing weekend relaxing and having fun!",
    effects: {
      happiness: 20,
      energy: 10,
    },
    probability: 9,
  },
  {
    id: "met_friend",
    category: "happiness",
    title: "Met an Old Friend",
    description: "You bumped into an old friend and had a great conversation.",
    effects: {
      happiness: 10,
    },
    probability: 10,
  },
  {
    id: "productive_weekend",
    category: "mixed",
    title: "Productive Weekend",
    description: "You spent the weekend studying and learning new skills.",
    effects: {
      education: 5,
      energy: -10,
      happiness: 5,
    },
    probability: 8,
  },
  {
    id: "party_hangover",
    category: "mixed",
    title: "Party Hangover",
    description: "You went to an amazing party but now you're exhausted.",
    effects: {
      happiness: 15,
      energy: -25,
    },
    probability: 7,
  },
  {
    id: "helped_neighbor",
    category: "neutral",
    title: "Helped a Neighbor",
    description:
      "You helped a neighbor move some furniture. Tiring but satisfying.",
    effects: {
      energy: -10,
      happiness: 10,
    },
    probability: 8,
  },
  {
    id: "power_outage",
    category: "neutral",
    title: "Power Outage",
    description: "A power outage meant a quiet evening with no electricity.",
    effects: {
      energy: 5,
      happiness: -5,
    },
    probability: 6,
  },
  {
    id: "job_bonus",
    category: "financial_positive",
    title: "Job Bonus",
    description: "You received a small bonus from your job!",
    effects: {
      cash: 150,
      happiness: 10,
    },
    condition: (p) => p.jobTitle !== null,
    probability: 6,
  },
  {
    id: "networking_event",
    category: "mixed",
    title: "Networking Event",
    description: "You attended a networking event that could help your career.",
    effects: {
      experience: 3,
      energy: -15,
    },
    condition: (p) => p.jobTitle !== null,
    probability: 7,
  },
];

/** Weighted random pick among the events whose condition the player meets. */
export function pickRandomEvent(
  player: PlayerState,
  rng: () => number,
): RandomEvent {
  const eligible = randomEvents.filter(
    (ev) => !ev.condition || ev.condition(player),
  );
  const total = eligible.reduce((sum, ev) => sum + ev.probability, 0);
  let roll = rng() * total;
  for (const ev of eligible) {
    roll -= ev.probability;
    if (roll <= 0) return ev;
  }
  return eligible[Math.floor(rng() * eligible.length)] ?? randomEvents[0];
}
