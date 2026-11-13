"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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

/* -------------------------------------------------------------------------- */
/*  Cyberpunk styling — same look as the landing page (app/page.tsx).         */
/*  Self-contained so no other file needs to change. Colors follow the        */
/*  accent chosen on the Appearance page via --accent-400.                    */
/* -------------------------------------------------------------------------- */
const CSS = `
.dark .cp{--c1:var(--accent-400,#2dd4bf);--c2:#00e5ff;--c3:#ff2e97;
  --cp-bg:#05060a;--cp-surface:#070a11;--cp-fg:#f5f5f4;--cp-muted:#d6d3d1;--cp-faint:#a8a29e;
  --cp-line:rgba(255,255,255,.14);--cp-tint:rgba(255,255,255,.04);color-scheme:dark}
.cp-cut{clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px))}
.cp-frame{background:linear-gradient(135deg,var(--c1),var(--cp-tint) 45%,var(--c2));padding:1px;
  clip-path:polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,16px 100%,0 calc(100% - 16px))}
.cp-inner{background:var(--cp-surface);
  clip-path:polygon(0 0,calc(100% - 15px) 0,100% 15px,100% 100%,15px 100%,0 calc(100% - 15px))}
/* Panels placed inside a frame drop their own rounded border / glow / fill */
.cp-flat>*{border-radius:0;border-width:0;box-shadow:none;background-color:transparent;
  backdrop-filter:none;max-width:none}
.cp-flat>p{margin:0}
.cp-glow{filter:drop-shadow(0 0 14px color-mix(in oklab,var(--c1) 55%,transparent))}
.cp-scan{background:repeating-linear-gradient(0deg,color-mix(in oklab,var(--cp-fg) 4%,transparent) 0,color-mix(in oklab,var(--cp-fg) 4%,transparent) 1px,transparent 1px,transparent 3px)}
.cp-floor{background-image:linear-gradient(var(--c1) 1px,transparent 1px),linear-gradient(90deg,var(--c1) 1px,transparent 1px);
  background-size:64px 64px;transform:perspective(420px) rotateX(62deg);transform-origin:center top;
  animation:cp-grid 2.2s linear infinite;
  -webkit-mask-image:linear-gradient(to bottom,transparent,#000 35%,#000);mask-image:linear-gradient(to bottom,transparent,#000 35%,#000)}
@keyframes cp-grid{from{background-position:0 0}to{background-position:0 64px}}
@keyframes cp-blink{0%,100%{opacity:1}50%{opacity:.2}}
@media (prefers-reduced-motion:reduce){.cp *,.cp *::before,.cp *::after{animation:none!important}}
`;

/** Clipped-corner neon frame (gradient border) around a panel. */
function Frame({
  children,
  className = "",
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  // The glow sits on a wrapper: a filter on the clipped element itself
  // would be cut off by its own clip-path.
  return (
    <div className={`${glow ? "cp-glow" : ""} ${className}`}>
      <div className="cp-frame h-full">
        <div className="cp-inner cp-flat h-full">{children}</div>
      </div>
    </div>
  );
}

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
  const resumeBot = useMutation(api.game.resumeBot);
  const releaseBot = useMutation(api.game.releaseBot);
  const [pending, setPending] = useState(false);
  // Place modals are shared through the game state; this only remembers a
  // modal a *watching* player has dismissed for themselves.
  const [hiddenKey, setHiddenKey] = useState<string | null>(null);
  const [weekend, setWeekend] = useState<WeekendInfo | null>(null);

  // Closing the weekend recap is what lets Mr Jones start his turn.
  const closeWeekend = useCallback(() => {
    setWeekend(null);
    void releaseBot({ gameId });
  }, [releaseBot, gameId]);

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

  // Mr Jones' turn but nothing has happened for a while (e.g. the game was
  // just re-opened)? Ask the server to wake him up. Checked every few seconds.
  const viewRef = useRef(view);
  const weekendRef = useRef(weekend);
  useEffect(() => {
    viewRef.current = view;
    weekendRef.current = weekend;
  }, [view, weekend]);
  useEffect(() => {
    const id = setInterval(() => {
      const v = viewRef.current;
      if (!v || v.game.core.status !== "active") return;
      // Mr Jones is waiting for the weekend recap to be closed — don't wake him.
      if (weekendRef.current) return;
      const botTurn = v.game.seats.find(
        (s) => s.seat === v.game.core.currentSeat,
      )?.bot;
      if (botTurn && Date.now() - v.game.updatedAt > 10000) {
        void resumeBot({ gameId });
      }
    }, 5000);
    return () => clearInterval(id);
  }, [gameId, resumeBot]);

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
    const text = mine
      ? notice.text
      : notice.text.startsWith("You ")
        ? `${who} ${notice.text.slice(4)}`
        : `${who}: ${notice.text}`;
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
        const seatInfo = view.game.seats.find((st) => st.seat === event.seat);
        setWeekend({
          playerName: view.game.core.players[event.seat]?.name ?? "Player",
          playerAvatar:
            view.game.core.players[event.seat]?.avatar ?? seatInfo?.avatar,
          // Mr Jones' recap closes itself; humans still press Continue.
          isBot: Boolean(seatInfo?.bot),
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
    return (
      <p className="font-mono text-sm uppercase tracking-[0.3em] text-cyan-300/80">
        Loading game…
      </p>
    );

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
  const waitingSeat = game.seats[game.core.currentSeat];
  const waitingFor = waitingSeat?.bot
    ? `🤖 ${waitingSeat.name} (${waitingSeat.bot})`
    : waitingSeat?.name;

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
      <style>{CSS}</style>
      {/* The game board is always drawn in the dark neon look. */}
      <div className="dark">
        <div className="cp relative -m-4 min-h-screen overflow-hidden bg-[var(--cp-bg)] p-4 text-[color:var(--cp-fg)] lg:-m-6 lg:p-6">
          {/* Ambient neon blobs, floor grid and scanlines */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div
              className="absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full opacity-25 blur-[120px]"
              style={{ background: "var(--c1)" }}
            />
            <div
              className="absolute -right-48 top-1/4 h-[520px] w-[520px] rounded-full opacity-20 blur-[120px]"
              style={{ background: "var(--c3)" }}
            />
            <div
              className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full opacity-15 blur-[120px]"
              style={{ background: "var(--c2)" }}
            />
            <div className="absolute inset-x-0 bottom-0 h-[26rem] overflow-hidden opacity-[0.14]">
              <div className="cp-floor h-[160%] w-full" />
            </div>
            <div className="cp-scan absolute inset-0" />
          </div>

          <div className="relative z-10">
            {finished ? (
              <WinScreen roomId={roomId} isHost={isHost} />
            ) : (
              <div className="mx-auto grid w-full max-w-[2000px] gap-4 lg:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
                <div className="space-y-4">
                  <PlayersStrip />
                  <Frame glow>
                    <StatsPanel />
                  </Frame>
                  <Frame glow>
                    <GoalsPanel />
                  </Frame>
                  {roomId && me && (
                    <>
                      <Frame>
                        <VideoLobby
                          roomId={roomId}
                          userName={me.name}
                          defaultCollapsed
                        />
                      </Frame>
                      <Frame>
                        <ChatBox roomId={roomId} meId={me._id} />
                      </Frame>
                    </>
                  )}
                </div>

                <div className="min-w-0 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={ctx.canAct ? "cp-glow" : ""}>
                      <p
                        className={`cp-cut inline-flex items-center gap-2 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.25em] ${
                          ctx.canAct
                            ? "bg-[color:var(--c2)]/15 text-[color:var(--c2)] shadow-[inset_0_0_0_1px_var(--c2)]"
                            : "bg-white/5 text-[color:var(--cp-faint)] shadow-[inset_0_0_0_1px_var(--cp-line)]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            ctx.canAct
                              ? "bg-[color:var(--c1)]"
                              : "bg-[color:var(--cp-faint)]"
                          }`}
                          style={
                            ctx.canAct
                              ? { animation: "cp-blink 1.4s infinite" }
                              : undefined
                          }
                        />
                        {ctx.canAct
                          ? "Your turn"
                          : `Waiting for ${waitingFor ?? "another player"}…`}
                      </p>
                    </span>
                    <SaveDialog gameId={gameId} />
                  </div>

                  <Frame>
                    <WeekMeter />
                  </Frame>

                  {/*
                    key = current seat: the map shows the active player, so when
                    the turn passes we remount it. Otherwise it would "walk" the
                    avatar from one player's location to the next player's.
                  */}
                  <Frame>
                    <CityMap
                      key={game.core.currentSeat}
                      currentLocationId={currentLocation}
                      // VERIFY: avatar field name on the player type (old repo: `avatar`)
                      player={{
                        name: ctx.player.name,
                        avatarUrl: ctx.player.avatar,
                      }}
                      // VERIFY: copy the exact move action from MapView's run({ ... }) call
                      onTravel={(id) =>
                        void run({ type: "moveTo", locationId: id })
                      }
                      onEnter={(id) =>
                        void run({ type: "openPlace", locationId: id })
                      }
                      onArrive={(id) => {
                        if (ctx.canAct && !weekend)
                          void run({ type: "openPlace", locationId: id });
                      }}
                      disabled={!ctx.canAct}
                      disabledReason={`Waiting for ${waitingFor ?? "another player"}…`}
                    />
                  </Frame>

                  <WeekendModal info={weekend} onClose={closeWeekend} />

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

                  <Frame>
                    <div className="p-3">
                      <h3 className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-[color:var(--c2)]">
                        {"// Activity log"}
                      </h3>
                      <ul className="max-h-40 space-y-1.5 overflow-y-auto text-sm text-[color:var(--cp-muted)]">
                        {[...game.core.log].reverse().map((l, i) => (
                          <li
                            key={`${l.at}-${i}`}
                            className="border-l-2 border-[color:var(--c1)] pl-2"
                          >
                            <span className="font-bold text-[color:var(--cp-fg)]">
                              {game.core.players[l.seat]?.name}:{" "}
                            </span>
                            {l.text}
                          </li>
                        ))}
                        {game.core.log.length === 0 && (
                          <li className="border-l-2 border-[color:var(--cp-line)] pl-2 text-[color:var(--cp-faint)]">
                            Nothing yet — make a move!
                          </li>
                        )}
                      </ul>
                    </div>
                  </Frame>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </GameCtx.Provider>
  );
}
