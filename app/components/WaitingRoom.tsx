"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Crown, Lock, LogOut, Play } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { RoomView } from "@/convex/rooms";
import { Button } from "@/components/ui/button";
import { AVATARS } from "@/lib/avatars";
import { MIN_PLAYERS } from "@/lib/game/constants";
import { CyberPortrait } from "./Cyberportrait";
import { VideoLobby } from "./VideoLobby";
import { ChatBox } from "./ChatBox";

const ACCENT = "var(--accent-400)";

const clip = (c: number = 14): string =>
  `polygon(0 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, ${c}px 100%, 0 calc(100% - ${c}px))`;

const mix = (color: string, pct: number): string =>
  `color-mix(in oklab, ${color} ${pct}%, transparent)`;

const SCANLINES =
  "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px)";

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
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_340px]">
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
              className="flex items-center gap-3 rounded-2xl border bg-card p-4 accent-card"
            >
              <span
                className="relative block aspect-[4/5] w-20 shrink-0 overflow-hidden bg-black"
                style={{ clipPath: clip(8) }}
              >
                <CyberPortrait src={m.avatar} name={m.name} />
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{ backgroundImage: SCANLINES }}
                />
              </span>
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
              className="rounded-2xl border border-dashed border-cyan-400/20 p-4 text-sm text-muted-foreground"
            >
              Waiting for a player…
            </div>
          ))}
        </div>

        {me && (
          <div className="rounded-2xl border bg-card p-4 accent-card md:p-6">
            <div className="grid gap-6 md:grid-cols-[260px_1fr]">
              {/* hero portrait */}
              <div className="space-y-3">
                <div
                  className="relative mx-auto aspect-[3/4] w-full max-w-[260px]"
                  style={{ filter: `drop-shadow(0 0 22px ${mix(ACCENT, 53)})` }}
                >
                  <div
                    className="absolute inset-0 overflow-hidden bg-black"
                    style={{ clipPath: clip(26) }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={me.avatar}
                        initial={{
                          opacity: 0,
                          scale: 1.08,
                          filter: "blur(6px)",
                        }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0"
                      >
                        <CyberPortrait src={me.avatar} name={me.name} />
                      </motion.div>
                    </AnimatePresence>
                    <div
                      className="absolute inset-0"
                      style={{ backgroundImage: SCANLINES }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <motion.div
                      aria-hidden
                      className="absolute inset-x-0 h-16"
                      style={{
                        background: `linear-gradient(to bottom, transparent, ${mix(ACCENT, 20)}, transparent)`,
                      }}
                      initial={{ top: "-20%" }}
                      animate={{ top: "110%" }}
                      transition={{
                        duration: 3.2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p
                        className="font-mono text-[10px] tracking-[0.35em]"
                        style={{ color: ACCENT }}
                      >
                        YOU
                      </p>
                      <p className="truncate text-xl font-black uppercase text-white">
                        {me.name}
                      </p>
                    </div>
                  </div>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 border-2"
                    style={{ borderColor: ACCENT, clipPath: clip(26) }}
                  />
                </div>
              </div>

              {/* avatar grid */}
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <p
                    className="font-mono text-xs tracking-[0.35em]"
                    style={{ color: ACCENT }}
                  >
                    {"// SELECT AVATAR"}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {AVATARS.length} AVAILABLE
                  </p>
                </div>

                <div className="grid max-h-[560px] grid-cols-3 gap-3 overflow-y-auto p-1 pr-2 sm:grid-cols-4">
                  {AVATARS.map((src) => {
                    const selected = me.avatar === src;
                    const taken = takenAvatars.has(src);
                    return (
                      <motion.button
                        key={src}
                        type="button"
                        disabled={taken}
                        onClick={() =>
                          void setAvatar({
                            roomId: room._id,
                            avatar: src,
                          }).catch((e: unknown) =>
                            toast.error(message(e, "Couldn't change avatar")),
                          )
                        }
                        whileHover={taken ? undefined : { scale: 1.05, y: -3 }}
                        whileTap={taken ? undefined : { scale: 0.97 }}
                        aria-pressed={selected}
                        aria-label={
                          taken ? "Taken by another player" : "Choose avatar"
                        }
                        className="relative aspect-[4/5] w-full"
                        style={{
                          filter: selected
                            ? `drop-shadow(0 0 12px ${ACCENT})`
                            : undefined,
                        }}
                      >
                        <span
                          className="absolute inset-0 overflow-hidden bg-black"
                          style={{
                            clipPath: clip(12),
                            outline: selected
                              ? `3px solid ${ACCENT}`
                              : "1px solid rgba(255,255,255,0.12)",
                            outlineOffset: "-3px",
                          }}
                        >
                          <span
                            className={`block h-full w-full transition ${taken ? "opacity-30 grayscale" : selected ? "" : "opacity-80 hover:opacity-100"}`}
                          >
                            <CyberPortrait src={src} name="?" />
                          </span>
                          <span
                            className="absolute inset-0"
                            style={{ backgroundImage: SCANLINES }}
                          />
                          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        </span>

                        {selected && (
                          <span
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-sm text-black"
                            style={{ backgroundColor: ACCENT }}
                          >
                            <Check className="h-4 w-4" strokeWidth={3} />
                          </span>
                        )}
                        {taken && (
                          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 font-mono text-[10px] tracking-widest text-white/80">
                            <Lock className="h-4 w-4" />
                            TAKEN
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
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
              className="gap-2 bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-black shadow-[0_0_20px_color-mix(in_oklab,var(--accent-400)_45%,transparent)] hover:brightness-110"
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
