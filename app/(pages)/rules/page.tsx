import { DEFAULT_GOALS } from "@/lib/game/engine";

// Inline style on purpose: html[data-glow="off"] strips any [style*="text-shadow"]
const GLOW_TEXT = {
  textShadow:
    "0 0 12px color-mix(in oklab, var(--accent-400) 70%, transparent)",
} as const;

export default function RulesPage() {
  const g = DEFAULT_GOALS;
  return (
    <div
      className={[
        "prose prose-sm mx-auto max-w-2xl dark:prose-invert",
        // typography plugin colours -> accent (follow the picker)
        "[--tw-prose-bold:var(--color-cyan-300)]",
        "[--tw-prose-bullets:var(--color-cyan-400)]",
        "[--tw-prose-counters:var(--color-cyan-400)]",
        "[--tw-prose-headings:var(--color-cyan-300)]",
        "[--tw-prose-invert-bold:var(--color-cyan-300)]",
        "[--tw-prose-invert-bullets:var(--color-cyan-400)]",
        "[--tw-prose-invert-counters:var(--color-cyan-400)]",
        "[--tw-prose-invert-headings:var(--color-cyan-300)]",
      ].join(" ")}
    >
      <h1 className="accent-gradient-text !text-transparent" style={GLOW_TEXT}>
        How to win
      </h1>
      <p>
        Be the first to satisfy <strong>all</strong> of these at once:
      </p>
      <div className="accent-card rounded-2xl bg-cyan-500/5 px-4 py-1">
        <ul>
          <li>
            Cash of at least <strong>${g.cash.toLocaleString()}</strong>
          </li>
          <li>
            A winning job: {g.winningJobs.join(", ")} (with the required subject
            levels)
          </li>
          <li>
            A <strong>Luxury apartment</strong> (rent $200)
          </li>
          <li>
            Relationship health of <strong>80+</strong>
          </li>
          <li>
            Happiness of at least <strong>{g.happiness}</strong>
          </li>
          <li>
            Average subject level (education) of at least{" "}
            <strong>{g.education}</strong>
          </li>
        </ul>
      </div>
      <h2 style={GLOW_TEXT}>Turns</h2>
      <p>
        Every week you get 100 time units. Walking costs 5, most actions cost
        5–30. When time runs out the week rolls over (a random event may strike,
        rent may fall due) and the next player takes over. Rent is due every 4
        weeks — overdue rent garnishes 20% of your wages.
      </p>
      <h2 style={GLOW_TEXT}>Money</h2>
      <p>
        Savings pay 5% interest, collectable once per week. Stock prices move
        once every full round of turns.
      </p>
    </div>
  );
}
