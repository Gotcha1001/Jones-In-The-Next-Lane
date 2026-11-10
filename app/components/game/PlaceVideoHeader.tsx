// components/game/PlaceVideoHeader.tsx
"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Place } from "@/lib/game/places";

interface PlaceVideoHeaderProps {
  place: Place;
}

/**
 * Full-bleed looping video behind the place title. If the place has no video,
 * the video fails to load, or the user prefers reduced motion, it shows the
 * place image instead (slow Ken Burns zoom unless reduced motion is on).
 */
export default function PlaceVideoHeader({ place }: PlaceVideoHeaderProps) {
  const reduceMotion = useReducedMotion();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const src = place.media.video;
  const showVideo = Boolean(src) && src !== failedSrc && !reduceMotion;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {showVideo && src ? (
        <video
          key={src}
          src={src}
          poster={place.image}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onError={() => setFailedSrc(src)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <motion.img
          src={place.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          animate={reduceMotion ? undefined : { scale: [1, 1.12] }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
        />
      )}

      {/* Colour tint per place + readability gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${place.media.accent} mix-blend-soft-light`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />
    </div>
  );
}
