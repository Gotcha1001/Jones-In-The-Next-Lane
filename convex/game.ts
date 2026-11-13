import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getCurrentUser, requireUser } from "./lib/auth";
import {
  vBotLevel,
  vGameAction,
  vGoals,
  vLocationId,
} from "../lib/game/validators";
import type { Goals, Seat } from "../lib/game/validators";
import type { GameAction } from "../lib/game/validators";
import { AVATARS } from "../lib/avatars";
import { chooseBotPlan } from "../lib/game/bot";
import type { BotPlan } from "../lib/game/bot";
import { createGame, DEFAULT_GOALS, performAction } from "../lib/game/engine";
import { MAX_LOCAL_PLAYERS } from "../lib/game/constants";

type Ctx = QueryCtx | MutationCtx;

/** May this user look at / act in this game? */
async function canView(
  ctx: Ctx,
  game: Doc<"games">,
  userId: Id<"users">,
): Promise<boolean> {
  if (game.ownerId === userId) return true;
  return game.seats.some((s) => s.userId === userId);
}

/** Which seat (if any) is `userId` allowed to act as right now? */
function actingSeat(game: Doc<"games">, userId: Id<"users">): number | null {
  const current = game.core.currentSeat;
  // Mr Jones plays his own turns (see botStep) — nobody else can.
  if (game.seats.find((s: Seat) => s.seat === current)?.bot) return null;
  if (game.mode === "local") return game.ownerId === userId ? current : null;
  const seat = game.seats.find((s: Seat) => s.seat === current);
  return seat?.userId === userId ? current : null;
}

// ── Queries ─────────────────────────────────────────────────────────────────
export interface GameView {
  game: Doc<"games">;
  meId: Id<"users">;
  /** The seat the viewer controls this very moment (null → spectating/waiting). */
  mySeat: number | null;
  /** Seats the viewer owns at all (one in online games, every one in local). */
  ownedSeats: number[];
}

export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }): Promise<GameView | null> => {
    const me = await getCurrentUser(ctx);
    if (!me) return null;
    const game = await ctx.db.get(gameId);
    if (!game || !(await canView(ctx, game, me._id))) return null;
    const ownedSeats =
      game.mode === "local"
        ? game.seats.filter((s) => !s.bot).map((s) => s.seat)
        : game.seats.filter((s) => s.userId === me._id).map((s) => s.seat);
    return { game, meId: me._id, mySeat: actingSeat(game, me._id), ownedSeats };
  },
});

export interface MyGameSummary {
  _id: Id<"games">;
  mode: "online" | "local";
  roomId: Id<"rooms"> | undefined;
  status: "active" | "finished";
  playerNames: string[];
  round: number;
  updatedAt: number;
}

/** Everything the signed-in user is currently part of (sidebar "My games"). */
export const listMyGames = query({
  args: {},
  handler: async (ctx): Promise<MyGameSummary[]> => {
    const me = await getCurrentUser(ctx);
    if (!me) return [];

    const owned = await ctx.db
      .query("games")
      .withIndex("by_owner", (q) => q.eq("ownerId", me._id))
      .order("desc")
      .take(20);

    // Online games where I'm a player but not the host.
    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .order("desc")
      .take(20);
    const joined: Doc<"games">[] = [];
    for (const m of memberships) {
      const room = await ctx.db.get(m.roomId);
      if (room?.gameId) {
        const g = await ctx.db.get(room.gameId);
        if (g) joined.push(g);
      }
    }

    const byId = new Map<Id<"games">, Doc<"games">>();
    for (const g of [...owned, ...joined]) byId.set(g._id, g);
    return [...byId.values()]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 20)
      .map((g) => ({
        _id: g._id,
        mode: g.mode,
        roomId: g.roomId,
        status: g.core.status,
        playerNames: g.seats.map((s) => s.name),
        round: g.core.round,
        updatedAt: g.updatedAt,
      }));
  },
});

// ── Mutations ───────────────────────────────────────────────────────────────
const vLocalPlayer = v.object({
  name: v.string(),
  avatar: v.string(),
  goals: v.optional(vGoals),
});

/** Solo / hot-seat game on one device (the original Jones experience). */
export const createLocalGame = mutation({
  args: {
    players: v.array(vLocalPlayer),
    /** Play a solo game against Mr Jones (the computer) at this level. */
    vsComputer: v.optional(vBotLevel),
  },
  handler: async (ctx, { players, vsComputer }): Promise<Id<"games">> => {
    const me = await requireUser(ctx);
    if (players.length < 1 || players.length > MAX_LOCAL_PLAYERS) {
      throw new Error(`Local games take 1–${MAX_LOCAL_PLAYERS} players.`);
    }
    const named = players.map((p, i) => ({
      name: p.name.trim().slice(0, 24) || `Player ${i + 1}`,
      avatar: p.avatar,
      goals: (p.goals ?? DEFAULT_GOALS) satisfies Goals,
    }));
    if (vsComputer) {
      if (named.length !== 1)
        throw new Error("The computer opponent is for solo games.");
      // Mr Jones plays for the same win conditions, with a different face.
      named.push({
        name: "Mr Jones",
        avatar: AVATARS.find((a) => a !== named[0].avatar) ?? AVATARS[0],
        goals: named[0].goals,
      });
    }
    const now = Date.now();
    return await ctx.db.insert("games", {
      ownerId: me._id,
      mode: "local",
      seats: named.map((p, i) => ({
        seat: i,
        userId: null,
        name: p.name,
        avatar: p.avatar,
        ...(vsComputer && i === 1 ? { bot: vsComputer } : {}),
      })),
      core: createGame(named),
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ── Mr Jones (the computer opponent) ────────────────────────────────────────
const BOT_START_MS = 2500; // pause so everyone can read the weekend recap
const BOT_TICK_MS = 1100; // time between visible steps
const BOT_WALK_MS = 2000; // time for the walking animation

const vUiValue = v.union(v.string(), v.number(), v.boolean());
const vBotPlan = v.object({
  action: vGameAction,
  at: vLocationId,
  ui: v.optional(v.record(v.string(), vUiValue)),
});

/**
 * One visible step of Mr Jones' turn, then schedules the next one. A "plan"
 * (e.g. study Business at the university) is carried through the steps:
 * close the old place → walk → open the place → pick the options → press the
 * button. Every step is written to the shared game state, so other players
 * see exactly what he does.
 */
export const botStep = internalMutation({
  args: { gameId: v.id("games"), plan: v.optional(vBotPlan) },
  handler: async (ctx, { gameId, plan }): Promise<void> => {
    const game = await ctx.db.get(gameId);
    if (!game || game.core.status !== "active") return;
    const seat = game.core.currentSeat;
    const level = game.seats.find((s: Seat) => s.seat === seat)?.bot;
    if (!level) return; // not his turn (any more)

    const now = Date.now();
    const rng = Math.random;
    let core = game.core;
    const me = core.players[seat];
    const chosen: BotPlan = plan ??
      chooseBotPlan(core, seat, level, rng) ?? {
        action: { type: "endTurn" },
        at: me.location,
      };

    let next: BotPlan | undefined = chosen;
    let delay = BOT_TICK_MS;
    let step: GameAction | null = null;

    if (chosen.action.type === "endTurn") {
      step = chosen.action;
      next = undefined;
    } else if (me.location !== chosen.at) {
      if (core.openPlace) {
        step = { type: "closePlace" };
      } else {
        step = { type: "moveTo", locationId: chosen.at };
        delay = BOT_WALK_MS;
      }
    } else if (!core.openPlace) {
      step = { type: "openPlace", locationId: chosen.at };
    } else if (
      chosen.ui &&
      Object.entries(chosen.ui).some(([k, val]) => core.ui?.[k] !== val)
    ) {
      // Show his selections on the shared place screen before he acts.
      core = { ...core, ui: { ...(core.ui ?? {}), ...chosen.ui } };
    } else {
      step = chosen.action;
      next = undefined;
    }

    let weekEnded = false;
    if (step) {
      let out = performAction(core, seat, step, rng, now);
      if (!out.ok) {
        // Never get stuck: if a plan fails, he just ends his week.
        out = performAction(core, seat, { type: "endTurn" }, rng, now);
        next = undefined;
      }
      if (!out.ok) return;
      core = out.core;
      weekEnded = out.weekEnded;
      if (weekEnded) next = undefined;
    }

    await ctx.db.patch(gameId, { core, updatedAt: now });
    if (core.status !== "active") return;

    const stillBot = game.seats.find(
      (s: Seat) => s.seat === core.currentSeat,
    )?.bot;
    if (stillBot) {
      await ctx.scheduler.runAfter(
        weekEnded ? BOT_START_MS : delay,
        internal.game.botStep,
        { gameId, plan: next },
      );
    }
  },
});

/**
 * Safety net: if a game is opened while it is Mr Jones' turn but nothing has
 * happened for a while (e.g. the server was restarted), restart his turn.
 */
export const resumeBot = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }): Promise<void> => {
    const me = await requireUser(ctx);
    const game = await ctx.db.get(gameId);
    if (!game || game.ownerId !== me._id || game.core.status !== "active")
      return;
    const isBot = game.seats.find(
      (s: Seat) => s.seat === game.core.currentSeat,
    )?.bot;
    if (!isBot || Date.now() - game.updatedAt < 8000) return;
    await ctx.db.patch(gameId, { updatedAt: Date.now() });
    await ctx.scheduler.runAfter(0, internal.game.botStep, { gameId });
  },
});

export type ActResult =
  | { ok: true; message: string; weekEnded: boolean }
  | { ok: false; error: string };

export const act = mutation({
  args: { gameId: v.id("games"), action: vGameAction },
  handler: async (ctx, { gameId, action }): Promise<ActResult> => {
    const me = await requireUser(ctx);
    const game = await ctx.db.get(gameId);
    if (!game) return { ok: false, error: "Game not found." };

    const seat = actingSeat(game, me._id);
    if (seat === null) return { ok: false, error: "It's not your turn." };

    const outcome = performAction(
      game.core,
      seat,
      action,
      Math.random,
      Date.now(),
    );
    if (!outcome.ok) {
      // Broadcast the error toast so everyone sees what the player sees.
      await ctx.db.patch(gameId, {
        core: {
          ...game.core,
          lastNotice: {
            seat,
            kind: "error",
            text: outcome.error,
            at: Date.now(),
          },
        },
      });
      return { ok: false, error: outcome.error };
    }

    await ctx.db.patch(gameId, { core: outcome.core, updatedAt: Date.now() });
    if (outcome.core.status === "finished" && game.roomId) {
      await ctx.db.patch(game.roomId, { status: "finished" });
    }
    // The turn just passed to the computer: let him start playing.
    if (
      outcome.core.status === "active" &&
      game.seats.find((s: Seat) => s.seat === outcome.core.currentSeat)?.bot
    ) {
      await ctx.scheduler.runAfter(BOT_START_MS, internal.game.botStep, {
        gameId,
      });
    }
    return {
      ok: true,
      message: outcome.message,
      weekEnded: outcome.weekEnded,
    };
  },
});

/**
 * The acting player changed a control on a place screen (selected a subject,
 * typed an amount…). Stored so every other player sees it too.
 */
export const setUi = mutation({
  args: {
    gameId: v.id("games"),
    key: v.string(),
    value: v.union(v.string(), v.number(), v.boolean()),
  },
  handler: async (ctx, { gameId, key, value }): Promise<void> => {
    const me = await requireUser(ctx);
    const game = await ctx.db.get(gameId);
    if (!game || game.core.status !== "active") return;
    if (actingSeat(game, me._id) === null) return;
    if (key.length === 0 || key.length > 60) return;
    await ctx.db.patch(gameId, {
      core: { ...game.core, ui: { ...(game.core.ui ?? {}), [key]: value } },
    });
  },
});

export const deleteGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }): Promise<void> => {
    const me = await requireUser(ctx);
    const game = await ctx.db.get(gameId);
    if (!game) return;
    if (game.ownerId !== me._id)
      throw new Error("Only the owner can delete a game.");
    if (game.roomId)
      throw new Error("Online games are removed by resetting the room.");
    await ctx.db.delete(gameId);
  },
});
