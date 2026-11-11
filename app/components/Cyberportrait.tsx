"use client";

import { useState } from "react";

interface CyberPortraitProps {
  src: string;
  name: string;
  className?: string;
}

/** Fills its parent. Falls back to a glitchy initial if the file is missing. */
export function CyberPortrait({
  src,
  name,
  className = "",
}: CyberPortraitProps) {
  const [broken, setBroken] = useState<boolean>(false);

  if (broken) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-fuchsia-700 to-cyan-600 font-mono text-3xl font-black text-white ${className}`}
      >
        {name.slice(0, 1).toUpperCase() || "?"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      onError={() => setBroken(true)}
      className={`h-full w-full object-cover object-top ${className}`}
    />
  );
}
