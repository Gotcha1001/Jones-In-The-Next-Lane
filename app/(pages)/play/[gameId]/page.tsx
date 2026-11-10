"use client";

import { use } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { GameView } from "@/app/components/game/GameView";

export default function PlayPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  return <GameView gameId={gameId as Id<"games">} />;
}
