"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { GameAction } from "@/lib/game/validators";
import type { LocationId } from "@/lib/game/places";
import { useUserContext } from "@/app/context/UserContext";
import { ChatBox } from "../ChatBox";
import { VideoLobby } from "../VideoLobby";
import CityMap from "./CityMap";
import { GameCtx, type GameCtxValue } from "./GameContext";
import { GoalsPanel } from "./GoalsPanel";
import { PlayersStrip, StatsPanel } from "./Hud";
import { LocationPanel } from "./LocationPanel";
import PlaceModal from "./PlaceModal";
import { SaveDialog } from "./SaveDialog";
import { WeekMeter } from "./ui";

import { WinScreen } from "./WinScreen";
import WeekendModal, { WeekendInfo } from "./WeekendModal";

interface Props {
  gameId: Id<"games">;
  /** Present for online games. */
  roomId?: Id<"rooms">;
  isHost?: boolean;
}

/** Which place modal is open, and for whose turn it was opened. */
interface OpenPlace {
  seat: number;
  place: LocationId;
}

export function GameView({ gameId, roomId, isHost }: Props) {
  const router = useRouter();
  const me = useUserContext(); // User | null, with me._id: Id<"users">
  const view = useQuery(api.game.getGame, { gameId });
  const act = useMutation(api.game.act);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState<OpenPlace | null>(null);
  const [weekend, setWeekend] = useState<WeekendInfo | null>(null);

  const run = useCallback(
    async (action: GameAction): Promise<boolean> => {
      setPending(true);
      try {
        const res = await act({ gameId, action });
        if (res.ok) {
          if (res.weekEnded) {
            // Week is over: cancel whatever place they were in. The engine
            // has already moved them home; the weekend modal opens from the
            // lastEvent effect below.
            setOpen(null);
            toast.info("📅 The week has ended", { duration: 5000 });
          } else {
            toast.success(res.message);
          }
        } else toast.error(res.error);
        return res.ok;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong");
        return false;
      } finally {
        setPending(false);
      }
    },
    [act, gameId],
  );

  // Announce each week-rollover event once, to every player (also remote ones).
  const lastEventAt = useRef<number | null>(null);
  const event = view?.game.core.lastEvent ?? null;
  useEffect(() => {
    if (!event) return;
    if (lastEventAt.current === null) {
      lastEventAt.current = event.at; // don't replay history on first load
      return;
    }
    if (event.at > lastEventAt.current) {
      lastEventAt.current = event.at;
      // The player whose week ended gets the weekend modal; everyone else
      // (remote players) just gets a toast.
      if (view?.ownedSeats.includes(event.seat)) {
        setOpen(null);
        setWeekend({
          playerName: view.game.core.players[event.seat]?.name ?? "You",
          week: (view.game.core.players[event.seat]?.week ?? 2) - 1,
          title: event.title,
          description: event.description,
        });
      } else {
        toast.info(`🎲 ${event.title}`, {
          description: event.description,
          duration: 7000,
        });
      }
    }
  }, [event, view]);

  const ctx = useMemo<GameCtxValue | null>(() => {
    if (!view) return null;
    const { game, mySeat } = view;
    const player = game.core.players[game.core.currentSeat];
    if (!player) return null;
    return {
      gameId,
      core: game.core,
      seats: game.seats,
      player,
      canAct: game.core.status === "active" && mySeat !== null && !pending,
      pending,
      run,
    };
  }, [view, gameId, pending, run]);

  if (view === undefined)
    return <p className="text-cyan-300/80">Loading game…</p>;

  if (view === null || !ctx) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="mb-3 text-white">
          This game doesn&apos;t exist, or you&apos;re not part of it.
        </p>
        <button
          className="text-cyan-300 underline transition hover:text-cyan-100 hover:drop-shadow-[0_0_8px_var(--accent-400)]"
          onClick={() => router.push("/lobby")}
        >
          Back to the lobby
        </button>
      </div>
    );
  }

  const { game } = view;
  const finished = game.core.status === "finished";
  const waitingFor = game.seats[game.core.currentSeat]?.name;

  // The modal is only shown while it belongs to the current turn AND the
  // player is still standing at that place. Passing the turn or moving
  // closes it automatically, with no effect needed.
  // VERIFY: `player.location` is the field MapView reads for "where am I".
  const currentLocation = ctx.player.location as LocationId;
  const modalPlace: LocationId | null =
    open &&
    open.seat === game.core.currentSeat &&
    open.place === currentLocation
      ? open.place
      : null;

  return (
    <GameCtx.Provider value={ctx}>
      {finished ? (
        <WinScreen roomId={roomId} isHost={isHost} />
      ) : (
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <PlayersStrip />
            <StatsPanel />
            <GoalsPanel />
            {roomId && me && (
              <>
                <VideoLobby
                  roomId={roomId}
                  userName={me.name}
                  defaultCollapsed
                />
                <ChatBox roomId={roomId} meId={me._id} />
              </>
            )}
          </div>

          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p
                className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ${
                  ctx.canAct
                    ? "bg-cyan-500/15 text-cyan-200 ring-cyan-400/50 shadow-[0_0_14px_var(--accent-400)]"
                    : "bg-black/40 text-cyan-300/70 ring-cyan-400/20"
                }`}
              >
                {ctx.canAct
                  ? "Your turn"
                  : `Waiting for ${waitingFor ?? "another player"}…`}
              </p>
              <SaveDialog gameId={gameId} />
            </div>

            {/*
              key = current seat: the map shows the active player, so when the
              turn passes we remount it. Otherwise it would "walk" the avatar
              from one player's location to the next player's.
            */}
            <WeekMeter />

            <CityMap
              key={game.core.currentSeat}
              currentLocationId={currentLocation}
              // VERIFY: avatar field name on the player type (old repo: `avatar`)
              player={{ name: ctx.player.name, avatarUrl: ctx.player.avatar }}
              // VERIFY: copy the exact move action from MapView's run({ ... }) call
              onTravel={(id) => void run({ type: "moveTo", locationId: id })}
              onEnter={(id) =>
                setOpen({ seat: game.core.currentSeat, place: id })
              }
              onArrive={(id) => {
                if (ctx.canAct)
                  setOpen({ seat: game.core.currentSeat, place: id });
              }}
              disabled={!ctx.canAct}
              disabledReason={`Waiting for ${waitingFor ?? "another player"}…`}
            />

            <WeekendModal info={weekend} onClose={() => setWeekend(null)} />

            <PlaceModal locationId={modalPlace} onClose={() => setOpen(null)}>
              <LocationPanel />
            </PlaceModal>

            <div className="accent-card rounded-2xl border border-cyan-400/40 bg-black/40 p-3 shadow-[0_0_20px_var(--accent-400)] backdrop-blur">
              <h3 className="accent-gradient-text mb-1 text-xs font-bold uppercase tracking-widest">
                Activity
              </h3>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-cyan-100/90">
                {[...game.core.log].reverse().map((l, i) => (
                  <li key={`${l.at}-${i}`}>
                    <span className="font-semibold text-white">
                      {game.core.players[l.seat]?.name}:{" "}
                    </span>
                    {l.text}
                  </li>
                ))}
                {game.core.log.length === 0 && (
                  <li className="text-cyan-300/70">
                    Nothing yet — make a move!
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </GameCtx.Provider>
  );
}
