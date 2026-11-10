"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { AVATARS } from "@/lib/avatars";
import { MAX_LOCAL_PLAYERS } from "@/lib/game/constants";
import { DEFAULT_GOALS } from "@/lib/game/engine";
import type { Goals } from "@/lib/game/validators";
import { GoalsEditor } from "@/app/components/GoalsEditor";
import { PlayerAvatar } from "@/app/components/PlayerAvatar";

interface Draft {
  name: string;
  avatar: string;
  goals: Goals;
}

const draft = (i: number): Draft => ({
  name: i === 0 ? "Jones" : `Player ${i + 1}`,
  avatar: AVATARS[i % AVATARS.length],
  goals: DEFAULT_GOALS,
});

export default function NewLocalGamePage() {
  const router = useRouter();
  const create = useMutation(api.game.createLocalGame);
  const [count, setCount] = useState(1);
  const [players, setPlayers] = useState<Draft[]>(() =>
    Array.from({ length: MAX_LOCAL_PLAYERS }, (_, i) => draft(i)),
  );
  const [busy, setBusy] = useState(false);

  const update = (i: number, patch: Partial<Draft>): void =>
    setPlayers((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    );

  const start = async (): Promise<void> => {
    setBusy(true);
    try {
      const gameId = await create({ players: players.slice(0, count) });
      router.push(`/play/${gameId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't start the game");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Solo / hot-seat game</h1>
        <p className="text-muted-foreground">
          Everyone shares this screen and takes turns. Want to play remotely?
          Use the online lobby.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Players:</span>
        {Array.from({ length: MAX_LOCAL_PLAYERS }, (_, i) => i + 1).map((n) => (
          <Button
            key={n}
            size="sm"
            variant={n === count ? "default" : "outline"}
            onClick={() => setCount(n)}
          >
            {n}
          </Button>
        ))}
      </div>

      {players.slice(0, count).map((p, i) => (
        <div key={i} className="space-y-3 rounded-2xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <PlayerAvatar src={p.avatar} name={p.name} size={48} />
            <input
              value={p.name}
              maxLength={24}
              onChange={(e) => update(i, { name: e.target.value })}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none"
            />
          </div>
          <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
            {AVATARS.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => update(i, { avatar: src })}
                className={`rounded-full ring-2 ${p.avatar === src ? "ring-indigo-500" : "ring-transparent"}`}
              >
                <PlayerAvatar src={src} name="?" size={32} />
              </button>
            ))}
          </div>
          <details>
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Custom win conditions
            </summary>
            <div className="mt-3">
              <GoalsEditor
                goals={p.goals}
                onChange={(g) => update(i, { goals: g })}
              />
            </div>
          </details>
        </div>
      ))}

      <Button
        disabled={busy}
        className="bg-indigo-600 text-white hover:bg-indigo-500"
        onClick={() => void start()}
      >
        {busy ? "Starting…" : "Start game"}
      </Button>
    </div>
  );
}
