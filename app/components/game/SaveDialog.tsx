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
        <Button variant="outline" size="sm" className="gap-1">
          <Save size={14} /> Save
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save this game</DialogTitle>
        </DialogHeader>
        <input
          value={title}
          maxLength={60}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Name this save (optional)"
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none"
        />
        <DialogFooter>
          <Button disabled={busy} onClick={() => void onSave()}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
