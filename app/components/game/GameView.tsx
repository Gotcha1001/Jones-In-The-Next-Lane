// "use client";

// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useMutation, useQuery } from "convex/react";
// import { toast } from "sonner";
// import { api } from "@/convex/_generated/api";
// import type { Id } from "@/convex/_generated/dataModel";
// import type { GameAction } from "@/lib/game/validators";
// import type { LocationId } from "@/lib/game/places";
// import { useUserContext } from "@/app/context/UserContext";
// import { ChatBox } from "../ChatBox";
// import { VideoLobby } from "../VideoLobby";
// import CityMap from "./CityMap";
// import { GameCtx, type GameCtxValue } from "./GameContext";
// import { GoalsPanel } from "./GoalsPanel";
// import { PlayersStrip, StatsPanel } from "./Hud";
// import { LocationPanel } from "./LocationPanel";
// import PlaceModal from "./PlaceModal";
// import { SaveDialog } from "./SaveDialog";
// import { WinScreen } from "./WinScreen";

// interface Props {
//   gameId: Id<"games">;
//   /** Present for online games. */
//   roomId?: Id<"rooms">;
//   isHost?: boolean;
// }

// /** Which place modal is open, and for whose turn it was opened. */
// interface OpenPlace {
//   seat: number;
//   place: LocationId;
// }

// export function GameView({ gameId, roomId, isHost }: Props) {
//   const router = useRouter();
//   const me = useUserContext(); // User | null, with me._id: Id<"users">
//   const view = useQuery(api.game.getGame, { gameId });
//   const act = useMutation(api.game.act);
//   const [pending, setPending] = useState(false);
//   const [open, setOpen] = useState<OpenPlace | null>(null);

//   const run = useCallback(
//     async (action: GameAction): Promise<boolean> => {
//       setPending(true);
//       try {
//         const res = await act({ gameId, action });
//         if (res.ok) toast.success(res.message);
//         else toast.error(res.error);
//         return res.ok;
//       } catch (e) {
//         toast.error(e instanceof Error ? e.message : "Something went wrong");
//         return false;
//       } finally {
//         setPending(false);
//       }
//     },
//     [act, gameId],
//   );

//   // Announce each week-rollover event once, to every player (also remote ones).
//   const lastEventAt = useRef<number | null>(null);
//   const event = view?.game.core.lastEvent ?? null;
//   useEffect(() => {
//     if (!event) return;
//     if (lastEventAt.current === null) {
//       lastEventAt.current = event.at; // don't replay history on first load
//       return;
//     }
//     if (event.at > lastEventAt.current) {
//       lastEventAt.current = event.at;
//       toast.info(`🎲 ${event.title}`, {
//         description: event.description,
//         duration: 7000,
//       });
//     }
//   }, [event]);

//   const ctx = useMemo<GameCtxValue | null>(() => {
//     if (!view) return null;
//     const { game, mySeat } = view;
//     const player = game.core.players[game.core.currentSeat];
//     if (!player) return null;
//     return {
//       gameId,
//       core: game.core,
//       seats: game.seats,
//       player,
//       canAct: game.core.status === "active" && mySeat !== null && !pending,
//       pending,
//       run,
//     };
//   }, [view, gameId, pending, run]);

//   if (view === undefined)
//     return <p className="text-muted-foreground">Loading game…</p>;

//   if (view === null || !ctx) {
//     return (
//       <div className="mx-auto max-w-md text-center">
//         <p className="mb-3">
//           This game doesn&apos;t exist, or you&apos;re not part of it.
//         </p>
//         <button className="underline" onClick={() => router.push("/lobby")}>
//           Back to the lobby
//         </button>
//       </div>
//     );
//   }

//   const { game } = view;
//   const finished = game.core.status === "finished";
//   const waitingFor = game.seats[game.core.currentSeat]?.name;

//   // The modal is only shown while it belongs to the current turn AND the
//   // player is still standing at that place. Passing the turn or moving
//   // closes it automatically, with no effect needed.
//   // VERIFY: `player.location` is the field MapView reads for "where am I".
//   const currentLocation = ctx.player.location as LocationId;
//   const modalPlace: LocationId | null =
//     open &&
//     open.seat === game.core.currentSeat &&
//     open.place === currentLocation
//       ? open.place
//       : null;

//   return (
//     <GameCtx.Provider value={ctx}>
//       {finished ? (
//         <WinScreen roomId={roomId} isHost={isHost} />
//       ) : (
//         <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[320px_1fr]">
//           <div className="space-y-4">
//             <PlayersStrip />
//             <StatsPanel />
//             <GoalsPanel />
//             {roomId && me && (
//               <>
//                 <VideoLobby
//                   roomId={roomId}
//                   userName={me.name}
//                   defaultCollapsed
//                 />
//                 <ChatBox roomId={roomId} meId={me._id} />
//               </>
//             )}
//           </div>

//           <div className="min-w-0 space-y-4">
//             <div className="flex flex-wrap items-center justify-between gap-2">
//               <p
//                 className={`rounded-full px-3 py-1 text-sm font-medium ${
//                   ctx.canAct
//                     ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
//                     : "bg-muted text-muted-foreground"
//                 }`}
//               >
//                 {ctx.canAct
//                   ? "Your turn"
//                   : `Waiting for ${waitingFor ?? "another player"}…`}
//               </p>
//               <SaveDialog gameId={gameId} />
//             </div>

//             {/*
//               key = current seat: the map shows the active player, so when the
//               turn passes we remount it. Otherwise it would "walk" the avatar
//               from one player's location to the next player's.
//             */}
//             <CityMap
//               key={game.core.currentSeat}
//               currentLocationId={currentLocation}
//               // VERIFY: avatar field name on the player type (old repo: `avatar`)
//               player={{ name: ctx.player.name, avatarUrl: ctx.player.avatar }}
//               // VERIFY: copy the exact move action from MapView's run({ ... }) call
//               onTravel={(id) => void run({ type: "moveTo", locationId: id })}
//               onEnter={(id) =>
//                 setOpen({ seat: game.core.currentSeat, place: id })
//               }
//               onArrive={(id) => {
//                 if (ctx.canAct)
//                   setOpen({ seat: game.core.currentSeat, place: id });
//               }}
//               disabled={!ctx.canAct}
//               disabledReason={`Waiting for ${waitingFor ?? "another player"}…`}
//             />

//             <PlaceModal locationId={modalPlace} onClose={() => setOpen(null)}>
//               <LocationPanel />
//             </PlaceModal>

//             <div className="rounded-2xl border bg-card p-3">
//               <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
//                 Activity
//               </h3>
//               <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
//                 {[...game.core.log].reverse().map((l, i) => (
//                   <li key={`${l.at}-${i}`}>
//                     <span className="font-semibold">
//                       {game.core.players[l.seat]?.name}:{" "}
//                     </span>
//                     {l.text}
//                   </li>
//                 ))}
//                 {game.core.log.length === 0 && (
//                   <li className="text-muted-foreground">
//                     Nothing yet — make a move!
//                   </li>
//                 )}
//               </ul>
//             </div>
//           </div>
//         </div>
//       )}
//     </GameCtx.Provider>
//   );
// }
// "use client";

// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useMutation, useQuery } from "convex/react";
// import { toast } from "sonner";
// import { api } from "@/convex/_generated/api";
// import type { Id } from "@/convex/_generated/dataModel";
// import type { GameAction } from "@/lib/game/validators";
// import type { LocationId } from "@/lib/game/places";
// import { useUserContext } from "@/app/context/UserContext";
// import { ChatBox } from "../ChatBox";
// import { VideoLobby } from "../VideoLobby";
// import CityMap from "./CityMap";
// import { GameCtx, type GameCtxValue } from "./GameContext";
// import { GoalsPanel } from "./GoalsPanel";
// import { PlayersStrip, StatsPanel } from "./Hud";
// import { LocationPanel } from "./LocationPanel";
// import PlaceModal from "./PlaceModal";
// import { SaveDialog } from "./SaveDialog";
// import { WinScreen } from "./WinScreen";

// interface Props {
//   gameId: Id<"games">;
//   /** Present for online games. */
//   roomId?: Id<"rooms">;
//   isHost?: boolean;
// }

// /** Which place modal is open, and for whose turn it was opened. */
// interface OpenPlace {
//   seat: number;
//   place: LocationId;
// }

// export function GameView({ gameId, roomId, isHost }: Props) {
//   const router = useRouter();
//   const me = useUserContext(); // User | null, with me._id: Id<"users">
//   const view = useQuery(api.game.getGame, { gameId });
//   const act = useMutation(api.game.act);
//   const [pending, setPending] = useState(false);
//   const [open, setOpen] = useState<OpenPlace | null>(null);

//   const run = useCallback(
//     async (action: GameAction): Promise<boolean> => {
//       setPending(true);
//       try {
//         const res = await act({ gameId, action });
//         if (res.ok) toast.success(res.message);
//         else toast.error(res.error);
//         return res.ok;
//       } catch (e) {
//         toast.error(e instanceof Error ? e.message : "Something went wrong");
//         return false;
//       } finally {
//         setPending(false);
//       }
//     },
//     [act, gameId],
//   );

//   // Announce each week-rollover event once, to every player (also remote ones).
//   const lastEventAt = useRef<number | null>(null);
//   const event = view?.game.core.lastEvent ?? null;
//   useEffect(() => {
//     if (!event) return;
//     if (lastEventAt.current === null) {
//       lastEventAt.current = event.at; // don't replay history on first load
//       return;
//     }
//     if (event.at > lastEventAt.current) {
//       lastEventAt.current = event.at;
//       toast.info(`🎲 ${event.title}`, {
//         description: event.description,
//         duration: 7000,
//       });
//     }
//   }, [event]);

//   const ctx = useMemo<GameCtxValue | null>(() => {
//     if (!view) return null;
//     const { game, mySeat } = view;
//     const player = game.core.players[game.core.currentSeat];
//     if (!player) return null;
//     return {
//       gameId,
//       core: game.core,
//       seats: game.seats,
//       player,
//       canAct: game.core.status === "active" && mySeat !== null && !pending,
//       pending,
//       run,
//     };
//   }, [view, gameId, pending, run]);

//   if (view === undefined)
//     return <p className="text-muted-foreground">Loading game…</p>;

//   if (view === null || !ctx) {
//     return (
//       <div className="mx-auto max-w-md text-center">
//         <p className="mb-3">
//           This game doesn&apos;t exist, or you&apos;re not part of it.
//         </p>
//         <button className="underline" onClick={() => router.push("/lobby")}>
//           Back to the lobby
//         </button>
//       </div>
//     );
//   }

//   const { game } = view;
//   const finished = game.core.status === "finished";
//   const waitingFor = game.seats[game.core.currentSeat]?.name;

//   // The modal is only shown while it belongs to the current turn AND the
//   // player is still standing at that place. Passing the turn or moving
//   // closes it automatically, with no effect needed.
//   // VERIFY: `player.location` is the field MapView reads for "where am I".
//   const currentLocation = ctx.player.location as LocationId;
//   const modalPlace: LocationId | null =
//     open &&
//     open.seat === game.core.currentSeat &&
//     open.place === currentLocation
//       ? open.place
//       : null;

//   return (
//     <GameCtx.Provider value={ctx}>
//       {finished ? (
//         <WinScreen roomId={roomId} isHost={isHost} />
//       ) : (
//         <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[320px_1fr]">
//           <div className="space-y-4">
//             <PlayersStrip />
//             <StatsPanel />
//             <GoalsPanel />
//             {roomId && me && (
//               <>
//                 <VideoLobby
//                   roomId={roomId}
//                   userName={me.name}
//                   defaultCollapsed
//                 />
//                 <ChatBox roomId={roomId} meId={me._id} />
//               </>
//             )}
//           </div>

//           <div className="min-w-0 space-y-4">
//             <div className="flex flex-wrap items-center justify-between gap-2">
//               <p
//                 className={`rounded-full px-3 py-1 text-sm font-medium ${
//                   ctx.canAct
//                     ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
//                     : "bg-muted text-muted-foreground"
//                 }`}
//               >
//                 {ctx.canAct
//                   ? "Your turn"
//                   : `Waiting for ${waitingFor ?? "another player"}…`}
//               </p>
//               <SaveDialog gameId={gameId} />
//             </div>

//             {/*
//               key = current seat: the map shows the active player, so when the
//               turn passes we remount it. Otherwise it would "walk" the avatar
//               from one player's location to the next player's.
//             */}
//             <CityMap
//               key={game.core.currentSeat}
//               currentLocationId={currentLocation}
//               // VERIFY: avatar field name on the player type (old repo: `avatar`)
//               player={{ name: ctx.player.name, avatarUrl: ctx.player.avatar }}
//               // VERIFY: copy the exact move action from MapView's run({ ... }) call
//               onTravel={(id) => void run({ type: "moveTo", locationId: id })}
//               onEnter={(id) =>
//                 setOpen({ seat: game.core.currentSeat, place: id })
//               }
//               onArrive={(id) => {
//                 if (ctx.canAct)
//                   setOpen({ seat: game.core.currentSeat, place: id });
//               }}
//               disabled={!ctx.canAct}
//               disabledReason={`Waiting for ${waitingFor ?? "another player"}…`}
//             />

//             <PlaceModal locationId={modalPlace} onClose={() => setOpen(null)}>
//               <LocationPanel />
//             </PlaceModal>

//             <div className="rounded-2xl border bg-card p-3">
//               <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
//                 Activity
//               </h3>
//               <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
//                 {[...game.core.log].reverse().map((l, i) => (
//                   <li key={`${l.at}-${i}`}>
//                     <span className="font-semibold">
//                       {game.core.players[l.seat]?.name}:{" "}
//                     </span>
//                     {l.text}
//                   </li>
//                 ))}
//                 {game.core.log.length === 0 && (
//                   <li className="text-muted-foreground">
//                     Nothing yet — make a move!
//                   </li>
//                 )}
//               </ul>
//             </div>
//           </div>
//         </div>
//       )}
//     </GameCtx.Provider>
//   );
// }
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
import WeekendModal, { type WeekendInfo } from "./WeekendModal";
import { WinScreen } from "./WinScreen";

interface Props {
  gameId: Id<"games">;
  /** Present for online games. */
  roomId?: Id<"rooms">;
  isHost?: boolean;
}

export function GameView({ gameId, roomId, isHost }: Props) {
  const router = useRouter();
  const me = useUserContext(); // User | null, with me._id: Id<"users">
  const view = useQuery(api.game.getGame, { gameId });
  const act = useMutation(api.game.act);
  const setUiMutation = useMutation(api.game.setUi);
  const [pending, setPending] = useState(false);
  // Place modals are shared through the game state; this only remembers a
  // modal a *watching* player has dismissed for themselves.
  const [hiddenKey, setHiddenKey] = useState<string | null>(null);
  const [weekend, setWeekend] = useState<WeekendInfo | null>(null);

  const run = useCallback(
    async (action: GameAction): Promise<boolean> => {
      setPending(true);
      try {
        const res = await act({ gameId, action });
        if (res.ok) {
          if (res.weekEnded) {
            // Nothing to do here: the engine already closed the place and
            // sent the player home, and the toast + weekend modal reach
            // every player through the shared game state (effects below).
          }
        }
        // Success and error toasts also come from the shared state.
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

  // Show every toast the active player sees, to every player.
  const lastNoticeAt = useRef<number | null>(null);
  const notice = view?.game.core.lastNotice ?? null;
  useEffect(() => {
    if (!notice || !view) return;
    if (lastNoticeAt.current === null) {
      lastNoticeAt.current = notice.at; // don't replay history on first load
      return;
    }
    if (notice.at <= lastNoticeAt.current) return;
    lastNoticeAt.current = notice.at;
    const mine = view.ownedSeats.includes(notice.seat);
    const who = view.game.core.players[notice.seat]?.name ?? "Player";
    const text = mine ? notice.text : `${who}: ${notice.text}`;
    if (notice.kind === "error") toast.error(text);
    else if (notice.kind === "weekEnd")
      toast.info("📅 The week has ended", {
        description: text,
        duration: 6000,
      });
    else toast.success(text);
  }, [notice, view]);

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
      // Everyone sees the weekend recap of the player whose week just ended.
      if (view) {
        setWeekend({
          playerName: view.game.core.players[event.seat]?.name ?? "Player",
          week: (view.game.core.players[event.seat]?.week ?? 2) - 1,
          nextPlayerName:
            view.game.core.players.length > 1
              ? (view.game.core.players[view.game.core.currentSeat]?.name ??
                null)
              : null,
          doctor: event.doctor,
          title: event.title,
          description: event.description,
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
      setUi: (key, value) => void setUiMutation({ gameId, key, value }),
    };
  }, [view, gameId, pending, run, setUiMutation]);

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
  const shared = game.core.openPlace ?? null;
  const sharedKey = shared
    ? `${shared.seat}-${shared.place}-${shared.at}`
    : null;
  const modalPlace: LocationId | null =
    shared &&
    shared.seat === game.core.currentSeat &&
    shared.place === currentLocation &&
    sharedKey !== hiddenKey
      ? (shared.place as LocationId)
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
              onEnter={(id) => void run({ type: "openPlace", locationId: id })}
              onArrive={(id) => {
                if (ctx.canAct && !weekend)
                  void run({ type: "openPlace", locationId: id });
              }}
              disabled={!ctx.canAct}
              disabledReason={`Waiting for ${waitingFor ?? "another player"}…`}
            />

            <WeekendModal info={weekend} onClose={() => setWeekend(null)} />

            <PlaceModal
              locationId={modalPlace}
              onClose={() => {
                // The active player closes it for everyone; a watcher only
                // hides it on their own screen.
                if (ctx.canAct) void run({ type: "closePlace" });
                else setHiddenKey(sharedKey);
              }}
            >
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
