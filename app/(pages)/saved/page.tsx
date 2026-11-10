"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

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
      <h1 className="mb-1 text-2xl font-bold">Saved games</h1>
      <p className="mb-6 text-muted-foreground">
        Loading a save starts a fresh hot-seat game from that snapshot.
      </p>
      {saves === undefined && <p className="text-muted-foreground">Loading…</p>}
      {saves?.length === 0 && (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No saves yet. Press “Save” in any game to keep a snapshot.
        </div>
      )}
      <div className="grid gap-3">
        {(saves ?? []).map((s) => (
          <div
            key={s._id}
            className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">{s.title}</p>
              <p className="text-xs text-muted-foreground">
                {s.summary.playerNames.join(", ")} · week {s.summary.week} ·
                leader ${Math.round(s.summary.leaderCash).toLocaleString()} ·{" "}
                {new Date(s.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                className="gap-1"
                onClick={() => void onLoad(s._id)}
              >
                <Play size={14} /> Resume
              </Button>
              <Button
                size="icon"
                variant="outline"
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
