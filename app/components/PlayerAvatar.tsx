"use client";

import { useState } from "react";

interface Props {
  src: string;
  name: string;
  size?: number;
  className?: string;
}

/** Avatar image with a lettered fallback when the file isn't in /public. */
export function PlayerAvatar({ src, name, size = 40, className = "" }: Props) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size };
  if (broken) {
    return (
      <div
        style={style}
        className={`flex items-center justify-center rounded-full bg-indigo-600 text-white font-bold ${className}`}
      >
        {name.slice(0, 1).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      style={style}
      onError={() => setBroken(true)}
      className={`rounded-full object-cover ${className}`}
    />
  );
}
