"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

// Inline style on purpose: html[data-glow="off"] strips any [style*="text-shadow"]
const GLOW_TEXT = {
  textShadow:
    "0 0 12px color-mix(in oklab, var(--accent-400) 70%, transparent)",
} as const;

export default function SavedGamesPage() {
  const router = useRouter();
  const saves = useQuery(api.saves.listSaves);
  const load = useMutation(api.saves.loadSave);
  const remove = useMutation(api.saves.deleteSave);

  const onLoad = async (saveId: Id<"savedGames">): Promise<void> => {
    try {
      router.push(`/play/${await load({ saveId })}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't load that save");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1
        className="accent-gradient-text mb-1 text-2xl font-bold"
        style={GLOW_TEXT}
      >
        Saved games
      </h1>
      <p className="mb-6 text-muted-foreground">
        Loading a save starts a fresh hot-seat game from that snapshot.
      </p>
      {saves === undefined && <p className="text-cyan-300/70">Loading…</p>}
      {saves?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-cyan-400/40 bg-cyan-500/5 p-10 text-center text-muted-foreground">
          No saves yet. Press “Save” in any game to keep a snapshot.
        </div>
      )}
      <div className="grid gap-3">
        {(saves ?? []).map((s) => (
          <div
            key={s._id}
            className="accent-card flex items-center justify-between gap-3 rounded-2xl bg-card p-4 transition-colors hover:bg-cyan-500/5"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-cyan-300">{s.title}</p>
              <p className="text-xs text-muted-foreground">
                {s.summary.playerNames.join(", ")} · week {s.summary.week} ·
                leader{" "}
                <span className="text-cyan-300">
                  ${Math.round(s.summary.leaderCash).toLocaleString()}
                </span>{" "}
                · {new Date(s.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                className="accent-gradient-bg gap-1 border-0 text-white shadow-[0_0_16px_-4px_color-mix(in_oklab,var(--accent-400)_70%,transparent)] hover:brightness-110"
                onClick={() => void onLoad(s._id)}
              >
                <Play size={14} /> Resume
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="border-cyan-400/40 text-cyan-300 hover:border-fuchsia-400 hover:bg-fuchsia-500/10 hover:text-fuchsia-300"
                aria-label="Delete save"
                onClick={() => void remove({ saveId: s._id })}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
