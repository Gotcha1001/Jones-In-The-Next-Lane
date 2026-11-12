// components/game/SoundToggle.tsx
"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isMuted, setMuted, subscribeMuted } from "@/lib/game/audio";

interface SoundToggleProps {
  className?: string;
}

export default function SoundToggle({ className = "" }: SoundToggleProps) {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => false);

  return (
    <button
      type="button"
      onClick={() => setMuted(!muted)}
      aria-pressed={muted}
      aria-label={muted ? "Unmute game sounds" : "Mute game sounds"}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/40 bg-black/50 backdrop-blur transition hover:bg-black/70 hover:border-cyan-400 hover:shadow-[0_0_14px_var(--accent-400)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
        muted ? "text-white/60" : "text-cyan-300"
      } ${className}`}
    >
      {muted ? (
        <VolumeX className="h-5 w-5" />
      ) : (
        <Volume2 className="h-5 w-5" />
      )}
    </button>
  );
}
