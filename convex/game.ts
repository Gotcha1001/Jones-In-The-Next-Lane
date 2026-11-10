import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getCurrentUser, requireUser } from "./lib/auth";
import { vGameAction, vGoals } from "../lib/game/validators";
import type { Goals, Seat } from "../lib/game/validators";
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
        ? game.seats.map((s) => s.seat)
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
  args: { players: v.array(vLocalPlayer) },
  handler: async (ctx, { players }): Promise<Id<"games">> => {
    const me = await requireUser(ctx);
    if (players.length < 1 || players.length > MAX_LOCAL_PLAYERS) {
      throw new Error(`Local games take 1–${MAX_LOCAL_PLAYERS} players.`);
    }
    const named = players.map((p, i) => ({
      name: p.name.trim().slice(0, 24) || `Player ${i + 1}`,
      avatar: p.avatar,
      goals: (p.goals ?? DEFAULT_GOALS) satisfies Goals,
    }));
    const now = Date.now();
    return await ctx.db.insert("games", {
      ownerId: me._id,
      mode: "local",
      seats: named.map((p, i) => ({
        seat: i,
        userId: null,
        name: p.name,
        avatar: p.avatar,
      })),
      core: createGame(named),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export type ActResult =
  | { ok: true; message: string }
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
    if (!outcome.ok) return { ok: false, error: outcome.error };

    await ctx.db.patch(gameId, { core: outcome.core, updatedAt: Date.now() });
    if (outcome.core.status === "finished" && game.roomId) {
      await ctx.db.patch(game.roomId, { status: "finished" });
    }
    return { ok: true, message: outcome.message };
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
