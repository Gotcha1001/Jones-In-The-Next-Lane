"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { Trophy } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "../PlayerAvatar";
import { useGame } from "./GameContext";
import { SaveDialog } from "./SaveDialog";

interface Props {
  roomId?: Id<"rooms">;
  isHost?: boolean;
}

export function WinScreen({ roomId, isHost }: Props) {
  const { core, gameId } = useGame();
  const router = useRouter();
  const playAgain = useMutation(api.rooms.playAgain);
  const winner =
    core.winnerSeat !== null ? core.players[core.winnerSeat] : undefined;
  const standings = [...core.players].sort((a, b) => b.cash - a.cash);

  return (
    <div className="mx-auto max-w-lg rounded-3xl border bg-card p-8 text-center shadow-xl accent-card">
      <Trophy
        className="mx-auto mb-2 text-amber-400 drop-shadow-[0_0_12px_color-mix(in_oklab,var(--accent-400)_40%,transparent)]"
        size={48}
      />
      <h1 className="text-3xl font-black accent-gradient-text">
        {winner ? `${winner.name} wins!` : "Game over"}
      </h1>
      <p className="mb-6 text-muted-foreground">
        Career success, luxury living and a happy life.
      </p>
      {winner && (
        <PlayerAvatar
          src={winner.avatar}
          name={winner.name}
          size={96}
          className="mx-auto mb-6 ring-4 ring-amber-400/80 shadow-[0_0_24px_color-mix(in_oklab,var(--accent-400)_35%,transparent)]"
        />
      )}
      <ol className="mb-6 space-y-2 text-left">
        {standings.map((p, i) => (
          <li
            key={p.seat}
            className="flex items-center gap-3 rounded-xl border border-cyan-400/15 bg-card/50 p-2"
          >
            <span className="w-5 text-center font-bold text-cyan-300">
              {i + 1}
            </span>
            <PlayerAvatar src={p.avatar} name={p.name} size={32} />
            <span className="flex-1 font-medium">{p.name}</span>
            <span className="text-sm text-muted-foreground">
              {p.jobTitle ?? "No job"} · ${Math.round(p.cash).toLocaleString()}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap justify-center gap-2">
        <SaveDialog gameId={gameId} />
        {roomId ? (
          isHost ? (
            <Button
              className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black shadow-[0_0_20px_color-mix(in_oklab,var(--accent-400)_45%,transparent)] hover:brightness-110"
              onClick={() =>
                void playAgain({ roomId }).catch((e: unknown) =>
                  toast.error(
                    e instanceof Error ? e.message : "Couldn't reset",
                  ),
                )
              }
            >
              Play again
            </Button>
          ) : (
            <p className="self-center text-sm text-muted-foreground">
              Waiting for the host to start another round…
            </p>
          )
        ) : (
          <Button
            className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black shadow-[0_0_20px_color-mix(in_oklab,var(--accent-400)_45%,transparent)] hover:brightness-110"
            onClick={() => router.push("/local/new")}
          >
            New game
          </Button>
        )}
        <Button variant="outline" onClick={() => router.push("/lobby")}>
          Lobby
        </Button>
      </div>
    </div>
  );
}
