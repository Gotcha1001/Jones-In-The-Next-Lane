import { DEFAULT_GOALS } from "@/lib/game/engine";

export default function RulesPage() {
  const g = DEFAULT_GOALS;
  return (
    <div className="prose prose-sm mx-auto max-w-2xl dark:prose-invert">
      <h1>How to win</h1>
      <p>
        Be the first to satisfy <strong>all</strong> of these at once:
      </p>
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
      <h2>Turns</h2>
      <p>
        Every week you get 100 time units. Walking costs 5, most actions cost
        5–30. When time runs out the week rolls over (a random event may strike,
        rent may fall due) and the next player takes over. Rent is due every 4
        weeks — overdue rent garnishes 20% of your wages.
      </p>
      <h2>Money</h2>
      <p>
        Savings pay 5% interest, collectable once per week. Stock prices move
        once every full round of turns.
      </p>
    </div>
  );
}
