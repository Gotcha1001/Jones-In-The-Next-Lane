import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { getCurrentUser, requireUser } from "./lib/auth";

export const MAX_SAVES = 25;

export const listSaves = query({
  args: {},
  handler: async (ctx): Promise<Doc<"savedGames">[]> => {
    const me = await getCurrentUser(ctx);
    if (!me) return [];
    // Strip nothing: the sidebar only reads `title` + `summary`, but returning
    // the doc keeps this one typed shape for the /saved page too.
    return await ctx.db
      .query("savedGames")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .order("desc")
      .take(MAX_SAVES);
  },
});

/** Snapshot a game you're part of into a named save slot. */
export const saveGame = mutation({
  args: { gameId: v.id("games"), title: v.optional(v.string()) },
  handler: async (ctx, { gameId, title }): Promise<Id<"savedGames">> => {
    const me = await requireUser(ctx);
    const game = await ctx.db.get(gameId);
    if (!game) throw new Error("Game not found.");
    const allowed =
      game.ownerId === me._id || game.seats.some((s) => s.userId === me._id);
    if (!allowed) throw new Error("You're not part of that game.");

    const existing = await ctx.db
      .query("savedGames")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .collect();
    if (existing.length >= MAX_SAVES) {
      throw new Error(`You can keep ${MAX_SAVES} saves — delete one first.`);
    }

    const players = game.core.players;
    const leader = players.reduce(
      (a, b) => (b.cash > a.cash ? b : a),
      players[0],
    );
    const label =
      title?.trim() ||
      `${players.map((p) => p.name).join(" & ")} · Round ${game.core.round}`;

    return await ctx.db.insert("savedGames", {
      userId: me._id,
      title: label.slice(0, 60),
      mode: game.mode,
      seats: game.seats,
      core: game.core,
      summary: {
        playerNames: players.map((p) => p.name),
        week: Math.max(...players.map((p) => p.week)),
        round: game.core.round,
        leaderCash: leader.cash,
      },
      createdAt: Date.now(),
    });
  },
});

/**
 * Resume a save as a fresh LOCAL game. (Online saves resume as hot-seat: seats
 * lose their account binding, which keeps resuming possible when friends are
 * offline.)
 */
export const loadSave = mutation({
  args: { saveId: v.id("savedGames") },
  handler: async (ctx, { saveId }): Promise<Id<"games">> => {
    const me = await requireUser(ctx);
    const save = await ctx.db.get(saveId);
    if (!save || save.userId !== me._id) throw new Error("Save not found.");
    const now = Date.now();
    const gameId = await ctx.db.insert("games", {
      ownerId: me._id,
      mode: "local",
      seats: save.seats.map((s) => ({ ...s, userId: null })),
      core: save.core,
      createdAt: now,
      updatedAt: now,
    });
    // Resuming in the middle of Mr Jones' turn: let him carry on.
    if (
      save.core.status === "active" &&
      save.seats.find((s) => s.seat === save.core.currentSeat)?.bot
    ) {
      await ctx.scheduler.runAfter(2500, internal.game.botStep, { gameId });
    }
    return gameId;
  },
});

export const renameSave = mutation({
  args: { saveId: v.id("savedGames"), title: v.string() },
  handler: async (ctx, { saveId, title }): Promise<void> => {
    const me = await requireUser(ctx);
    const save = await ctx.db.get(saveId);
    if (!save || save.userId !== me._id) throw new Error("Save not found.");
    const clean = title.trim().slice(0, 60);
    if (clean) await ctx.db.patch(saveId, { title: clean });
  },
});

export const deleteSave = mutation({
  args: { saveId: v.id("savedGames") },
  handler: async (ctx, { saveId }): Promise<void> => {
    const me = await requireUser(ctx);
    const save = await ctx.db.get(saveId);
    if (!save || save.userId !== me._id) return;
    await ctx.db.delete(saveId);
  },
});
