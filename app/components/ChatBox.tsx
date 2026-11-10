"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Send } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

export function ChatBox({
  roomId,
  meId,
}: {
  roomId: Id<"rooms">;
  meId: Id<"users">;
}) {
  const messages = useQuery(api.chat.list, { roomId });
  const send = useMutation(api.chat.send);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const submit = async (): Promise<void> => {
    const t = text.trim();
    if (!t) return;
    setText("");
    await send({ roomId, text: t });
  };

  return (
    <div className="flex h-64 flex-col rounded-2xl border bg-card/60">
      <div className="border-b px-4 py-2 text-xs font-bold uppercase tracking-widest">
        Chat
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-2 text-sm">
        {(messages ?? []).map((m) => (
          <p key={m._id} className={m.userId === meId ? "text-indigo-500" : ""}>
            <span className="font-semibold">{m.userName}: </span>
            {m.text}
          </p>
        ))}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 border-t p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          maxLength={300}
          placeholder="Say something…"
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none"
        />
        <Button size="icon" onClick={() => void submit()} aria-label="Send">
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
