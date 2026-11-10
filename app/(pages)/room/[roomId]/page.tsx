"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { WaitingRoom } from "@/app/components/WaitingRoom";
import { GameView } from "@/app/components/game/GameView";

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
    return <p className="text-muted-foreground">Loading room…</p>;
  if (view === null) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="mb-4">That room doesn&apos;t exist (or was closed).</p>
        <button className="underline" onClick={() => router.push("/lobby")}>
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

import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
    <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center">
      <p className="mb-4 text-lg font-semibold">
        You&apos;ve been invited to a room
      </p>
      {(full || started) && (
        <p className="mb-4 text-sm text-muted-foreground">
          {started ? "This game has already started." : "This room is full."}
        </p>
      )}
      <Button
        disabled={full || started}
        className="bg-indigo-600 text-white hover:bg-indigo-500"
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
