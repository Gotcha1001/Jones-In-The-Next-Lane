"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { Check, Copy, Crown, LogOut, Play } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { RoomView } from "@/convex/rooms";
import { Button } from "@/components/ui/button";
import { AVATARS } from "@/lib/avatars";
import { MIN_PLAYERS } from "@/lib/game/constants";
import { PlayerAvatar } from "./PlayerAvatar";
import { VideoLobby } from "./VideoLobby";
import { ChatBox } from "./ChatBox";

function message(e: unknown, fallback: string): string {
  if (!(e instanceof Error)) return fallback;
  const m = /Uncaught Error: (.*?)(?:\n|$)/.exec(e.message);
  return m?.[1] ?? e.message;
}

export function WaitingRoom({ view }: { view: RoomView }) {
  const { room, members, meId } = view;
  const router = useRouter();
  const setReady = useMutation(api.rooms.setReady);
  const setAvatar = useMutation(api.rooms.setAvatar);
  const leave = useMutation(api.rooms.leaveRoom);
  const start = useMutation(api.rooms.startGame);

  const me = members.find((m) => m.userId === meId);
  const isHost = room.hostId === meId;
  const allReady =
    members.length >= MIN_PLAYERS && members.every((m) => m.isReady);
  const takenAvatars = new Set(
    members.filter((m) => m.userId !== meId).map((m) => m.avatar),
  );

  const onLeave = async (): Promise<void> => {
    await leave({ roomId: room._id });
    router.push("/lobby");
  };

  const onStart = async (): Promise<void> => {
    try {
      await start({ roomId: room._id });
    } catch (e) {
      toast.error(message(e, "Couldn't start the game"));
    }
  };

  const copyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Invite link copied");
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{room.name}</h1>
            <p className="text-sm text-muted-foreground">
              {members.length}/{room.maxPlayers} players · goal $
              {room.goals.cash.toLocaleString()}, education{" "}
              {room.goals.education}, happiness {room.goals.happiness}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => void copyLink()}
            >
              <Copy size={14} /> Invite
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => void onLeave()}
            >
              <LogOut size={14} /> Leave
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <motion.div
              key={m._id}
              layout
              className="flex items-center gap-3 rounded-2xl border bg-card p-4"
            >
              <PlayerAvatar src={m.avatar} name={m.name} size={48} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate font-semibold">
                  {m.name}
                  {m.userId === room.hostId && (
                    <Crown size={14} className="text-amber-500" />
                  )}
                  {m.userId === meId && (
                    <span className="text-xs text-muted-foreground">(you)</span>
                  )}
                </p>
                <p
                  className={`text-xs ${m.isReady ? "text-emerald-500" : "text-muted-foreground"}`}
                >
                  {m.isReady ? "Ready" : "Not ready"}
                </p>
              </div>
              {m.isReady && <Check size={18} className="text-emerald-500" />}
            </motion.div>
          ))}
          {Array.from({ length: room.maxPlayers - members.length }, (_, i) => (
            <div
              key={`empty-${i}`}
              className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground"
            >
              Waiting for a player…
            </div>
          ))}
        </div>

        {me && (
          <div className="rounded-2xl border bg-card p-4">
            <p className="mb-3 text-sm font-semibold">Pick your avatar</p>
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
              {AVATARS.map((src) => {
                const taken = takenAvatars.has(src);
                return (
                  <button
                    key={src}
                    type="button"
                    disabled={taken}
                    onClick={() =>
                      void setAvatar({ roomId: room._id, avatar: src }).catch(
                        (e: unknown) =>
                          toast.error(message(e, "Couldn't change avatar")),
                      )
                    }
                    className={`rounded-full ring-2 transition ${
                      me.avatar === src ? "ring-indigo-500" : "ring-transparent"
                    } ${taken ? "opacity-30" : "hover:ring-indigo-300"}`}
                  >
                    <PlayerAvatar src={src} name="?" size={40} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {!isHost && me && (
            <Button
              className={
                me.isReady
                  ? ""
                  : "bg-emerald-600 text-white hover:bg-emerald-500"
              }
              variant={me.isReady ? "outline" : "default"}
              onClick={() =>
                void setReady({ roomId: room._id, isReady: !me.isReady })
              }
            >
              {me.isReady ? "Not ready" : "I'm ready"}
            </Button>
          )}
          {isHost && (
            <Button
              className="gap-2 bg-indigo-600 text-white hover:bg-indigo-500"
              disabled={!allReady}
              onClick={() => void onStart()}
            >
              <Play size={16} />
              {allReady ? "Start game" : `Need ${MIN_PLAYERS}+ ready players`}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <VideoLobby roomId={room._id} userName={me?.name ?? "Player"} />
        <ChatBox roomId={room._id} meId={meId} />
      </div>
    </div>
  );
}
