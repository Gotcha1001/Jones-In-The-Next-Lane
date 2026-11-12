"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { WaitingRoom } from "@/app/components/WaitingRoom";
import { GameView } from "@/app/components/game/GameView";
import { Button } from "@/components/ui/button";

// Inline style on purpose: html[data-glow="off"] strips any [style*="text-shadow"]
const GLOW_TEXT = {
  textShadow:
    "0 0 12px color-mix(in oklab, var(--accent-400) 70%, transparent)",
} as const;

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId: raw } = use(params);
  const roomId = raw as Id<"rooms">;
  const router = useRouter();
  const view = useQuery(api.rooms.getRoom, { roomId });

  if (view === undefined)
    return <p className="text-cyan-300/70">Loading room…</p>;
  if (view === null) {
    return (
      <div className="accent-card mx-auto max-w-md rounded-2xl bg-card p-8 text-center">
        <p className="mb-4">That room doesn&apos;t exist (or was closed).</p>
        <button
          className="text-cyan-300 underline underline-offset-4 hover:text-fuchsia-300"
          style={GLOW_TEXT}
          onClick={() => router.push("/lobby")}
        >
          Back to the lobby
        </button>
      </div>
    );
  }
  const isMember = view.members.some((m) => m.userId === view.meId);
  if (!isMember) {
    return (
      <JoinPrompt
        roomId={roomId}
        full={view.members.length >= view.room.maxPlayers}
        started={view.room.status !== "waiting"}
      />
    );
  }
  if (view.room.gameId) {
    return (
      <GameView
        gameId={view.room.gameId}
        roomId={roomId}
        isHost={view.room.hostId === view.meId}
      />
    );
  }
  return <WaitingRoom view={view} />;
}

function JoinPrompt({
  roomId,
  full,
  started,
}: {
  roomId: Id<"rooms">;
  full: boolean;
  started: boolean;
}) {
  const join = useMutation(api.rooms.joinRoom);
  return (
    <div className="accent-card mx-auto max-w-md rounded-2xl bg-card p-8 text-center">
      <p
        className="accent-gradient-text mb-4 text-lg font-semibold"
        style={GLOW_TEXT}
      >
        You&apos;ve been invited to a room
      </p>
      {(full || started) && (
        <p className="mb-4 text-sm text-muted-foreground">
          {started ? "This game has already started." : "This room is full."}
        </p>
      )}
      <Button
        disabled={full || started}
        className="accent-gradient-bg border-0 text-white shadow-[0_0_18px_-4px_color-mix(in_oklab,var(--accent-400)_70%,transparent)] hover:brightness-110 disabled:shadow-none"
        onClick={() =>
          void join({ roomId }).catch((e: unknown) =>
            toast.error(e instanceof Error ? e.message : "Couldn't join"),
          )
        }
      >
        Join room
      </Button>
    </div>
  );
}
