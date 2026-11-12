"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SaveDialog({ gameId }: { gameId: Id<"games"> }) {
  const save = useMutation(api.saves.saveGame);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const onSave = async (): Promise<void> => {
    setBusy(true);
    try {
      await save({ gameId, title: title.trim() || undefined });
      toast.success("Game saved — find it in the sidebar");
      setOpen(false);
      setTitle("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 border-cyan-400/40 bg-black/40 text-cyan-300 transition hover:border-cyan-400 hover:bg-black/60 hover:text-cyan-200 hover:shadow-[0_0_14px_var(--accent-400)]"
        >
          <Save size={14} /> Save
        </Button>
      </DialogTrigger>
      <DialogContent className="accent-card border-cyan-400/40 bg-black/80 text-white backdrop-blur shadow-[0_0_24px_var(--accent-400)]">
        <DialogHeader>
          <DialogTitle className="accent-gradient-text">
            Save this game
          </DialogTitle>
        </DialogHeader>
        <input
          value={title}
          maxLength={60}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Name this save (optional)"
          className="rounded-lg border border-cyan-400/40 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-cyan-300/50 outline-none transition focus:border-cyan-400 focus:shadow-[0_0_12px_var(--accent-400)]"
        />
        <DialogFooter>
          <Button
            disabled={busy}
            onClick={() => void onSave()}
            className="border border-cyan-400/60 bg-cyan-500/20 text-cyan-100 transition hover:bg-cyan-500/30 hover:shadow-[0_0_14px_var(--accent-400)]"
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
