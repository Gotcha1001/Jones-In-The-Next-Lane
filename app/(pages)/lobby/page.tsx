"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, LogIn, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/game/constants";
import { DEFAULT_GOALS } from "@/lib/game/engine";
import type { Goals } from "@/lib/game/validators";
import { GoalsEditor } from "@/app/components/GoalsEditor";

// Inline style on purpose: html[data-glow="off"] strips any [style*="text-shadow"]
const GLOW_TEXT = {
  textShadow:
    "0 0 12px color-mix(in oklab, var(--accent-400) 70%, transparent)",
} as const;

const BTN_ACCENT =
  "accent-gradient-bg border-0 text-white shadow-[0_0_18px_-4px_color-mix(in_oklab,var(--accent-400)_70%,transparent)] hover:brightness-110 disabled:shadow-none";

const FIELD =
  "rounded-xl border border-cyan-400/30 bg-background px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400";

export default function LobbyPage() {
  const router = useRouter();
  const rooms = useQuery(api.rooms.listOpenRooms);
  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [busy, setBusy] = useState(false);

  const errorText = (e: unknown, fallback: string): string => {
    if (e instanceof Error) {
      // Convex wraps server errors; show the human part.
      const m = /Uncaught Error: (.*?)(?:\n|$)/.exec(e.message);
      return m?.[1] ?? e.message;
    }
    return fallback;
  };

  const onCreate = async (): Promise<void> => {
    if (!name.trim()) return void toast.error("Give your room a name");
    setBusy(true);
    try {
      const roomId = await createRoom({ name, maxPlayers, goals });
      router.push(`/room/${roomId}`);
    } catch (e) {
      toast.error(errorText(e, "Couldn't create the room"));
    } finally {
      setBusy(false);
    }
  };

  const onJoin = async (roomId: Id<"rooms">): Promise<void> => {
    try {
      await joinRoom({ roomId });
      router.push(`/room/${roomId}`);
    } catch (e) {
      toast.error(errorText(e, "Couldn't join the room"));
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1
            className="accent-gradient-text text-2xl font-bold"
            style={GLOW_TEXT}
          >
            Game lobby
          </h1>
          <p className="text-muted-foreground">
            Join an open room or host your own.
          </p>
        </div>
        <Button
          className={`gap-2 ${BTN_ACCENT}`}
          onClick={() => setShowCreate((s) => !s)}
        >
          <Plus size={18} /> Create room
        </Button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="accent-card mb-6 overflow-hidden rounded-2xl bg-card p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-cyan-300">
              New room
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void onCreate()}
                maxLength={40}
                placeholder="Room name (e.g. Friday Night Race)"
                className={`flex-1 ${FIELD}`}
              />
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className={FIELD}
              >
                {Array.from(
                  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
                  (_, i) => MIN_PLAYERS + i,
                ).map((n) => (
                  <option key={n} value={n}>
                    {n} players
                  </option>
                ))}
              </select>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground transition hover:text-cyan-300">
                Win conditions (optional)
              </summary>
              <div className="mt-3">
                <GoalsEditor goals={goals} onChange={setGoals} />
              </div>
            </details>
            <Button
              className={`mt-4 ${BTN_ACCENT}`}
              disabled={busy}
              onClick={() => void onCreate()}
            >
              {busy ? "Creating…" : "Create & enter"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {rooms === undefined && (
        <p className="text-cyan-300/70">Loading rooms…</p>
      )}
      {rooms !== undefined && rooms.length === 0 && (
        <div className="rounded-2xl border border-dashed border-cyan-400/40 bg-cyan-500/5 p-10 text-center text-muted-foreground">
          No open rooms yet — create one and invite your friends!
        </div>
      )}
      <div className="grid gap-3">
        {(rooms ?? []).map((r) => (
          <motion.div
            key={r._id}
            layout
            className="accent-card flex items-center justify-between rounded-2xl bg-card p-4 transition-colors hover:bg-cyan-500/5"
          >
            <div>
              <p className="font-semibold text-cyan-300">{r.name}</p>
              <p className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users size={12} className="text-cyan-400" /> {r.playerCount}/
                  {r.maxPlayers}
                </span>
                <span>Host: {r.hostName}</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-cyan-400" />{" "}
                  {new Date(r.createdAt).toLocaleTimeString()}
                </span>
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2 border-cyan-400/40 text-cyan-300 hover:border-fuchsia-400 hover:bg-fuchsia-500/10 hover:text-fuchsia-300"
              disabled={r.playerCount >= r.maxPlayers}
              onClick={() => void onJoin(r._id)}
            >
              <LogIn size={16} />{" "}
              {r.playerCount >= r.maxPlayers ? "Full" : "Join"}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
