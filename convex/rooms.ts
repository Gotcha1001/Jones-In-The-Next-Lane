import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getCurrentUser, requireUser } from "./lib/auth";
import { vGoals } from "../lib/game/validators";
import type { Goals } from "../lib/game/validators";
import { createGame, DEFAULT_GOALS } from "../lib/game/engine";

import {
  DEFAULT_AVATAR,
  MAX_PLAYERS,
  MIN_PLAYERS,
} from "../lib/game/constants";

export interface OpenRoom {
  _id: Id<"rooms">;
  name: string;
  hostName: string;
  maxPlayers: number;
  playerCount: number;
  createdAt: number;
}

export interface RoomView {
  room: Doc<"rooms">;
  members: Doc<"roomMembers">[];
  /** Id of the signed-in user, so the client can find "me" in `members`. */
  meId: Id<"users">;
}

// ── Queries ─────────────────────────────────────────────────────────────────
export const listOpenRooms = query({
  args: {},
  handler: async (ctx): Promise<OpenRoom[]> => {
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .order("desc")
      .take(30);

    return await Promise.all(
      rooms.map(async (room): Promise<OpenRoom> => {
        const members = await ctx.db
          .query("roomMembers")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect();
        const host = members.find((m) => m.userId === room.hostId);
        return {
          _id: room._id,
          name: room.name,
          hostName: host?.name ?? "Host",
          maxPlayers: room.maxPlayers,
          playerCount: members.length,
          createdAt: room.createdAt,
        };
      }),
    );
  },
});

/** Room + members; null if the room is gone. Members only → players only. */
export const getRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }): Promise<RoomView | null> => {
    const me = await getCurrentUser(ctx);
    if (!me) return null;
    const room = await ctx.db.get(roomId);
    if (!room) return null;
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();
    return { room, members, meId: me._id };
  },
});

/** Used by /api/livekit-token to make sure only room members can join video. */
export const isMember = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }): Promise<boolean> => {
    const me = await getCurrentUser(ctx);
    if (!me) return false;
    const m = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", roomId).eq("userId", me._id),
      )
      .first();
    return m !== null;
  },
});

// ── Mutations ───────────────────────────────────────────────────────────────
export const createRoom = mutation({
  args: {
    name: v.string(),
    maxPlayers: v.number(),
    goals: v.optional(vGoals),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"rooms">> => {
    const me = await requireUser(ctx);
    const name = args.name.trim();
    if (!name) throw new Error("Give the room a name.");
    if (args.maxPlayers < MIN_PLAYERS || args.maxPlayers > MAX_PLAYERS) {
      throw new Error(`Rooms hold ${MIN_PLAYERS}–${MAX_PLAYERS} players.`);
    }
    const goals: Goals = args.goals ?? DEFAULT_GOALS;

    const roomId = await ctx.db.insert("rooms", {
      name: name.slice(0, 40),
      hostId: me._id,
      status: "waiting",
      maxPlayers: args.maxPlayers,
      goals,
      createdAt: Date.now(),
    });
    await ctx.db.insert("roomMembers", {
      roomId,
      userId: me._id,
      name: me.name,
      imageUrl: me.imageUrl,
      avatar: args.avatar ?? DEFAULT_AVATAR,
      isReady: true, // the host is implicitly ready
      joinedAt: Date.now(),
    });
    return roomId;
  },
});

export const joinRoom = mutation({
  args: { roomId: v.id("rooms"), avatar: v.optional(v.string()) },
  handler: async (ctx, { roomId, avatar }): Promise<Id<"rooms">> => {
    const me = await requireUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found.");

    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();
    if (members.some((m) => m.userId === me._id)) return roomId; // rejoin
    if (room.status !== "waiting")
      throw new Error("That game has already started.");
    if (members.length >= room.maxPlayers) throw new Error("Room is full.");

    await ctx.db.insert("roomMembers", {
      roomId,
      userId: me._id,
      name: me.name,
      imageUrl: me.imageUrl,
      avatar: avatar ?? DEFAULT_AVATAR,
      isReady: false,
      joinedAt: Date.now(),
    });
    return roomId;
  },
});

export const setReady = mutation({
  args: { roomId: v.id("rooms"), isReady: v.boolean() },
  handler: async (ctx, { roomId, isReady }): Promise<void> => {
    const me = await requireUser(ctx);
    const member = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", roomId).eq("userId", me._id),
      )
      .first();
    if (member) await ctx.db.patch(member._id, { isReady });
  },
});

export const setAvatar = mutation({
  args: { roomId: v.id("rooms"), avatar: v.string() },
  handler: async (ctx, { roomId, avatar }): Promise<void> => {
    const me = await requireUser(ctx);
    const member = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", roomId).eq("userId", me._id),
      )
      .first();
    if (!member) throw new Error("You're not in this room.");
    const taken = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();
    if (taken.some((m) => m.userId !== me._id && m.avatar === avatar)) {
      throw new Error("Someone already picked that avatar.");
    }
    await ctx.db.patch(member._id, { avatar });
  },
});

export const leaveRoom = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }): Promise<void> => {
    const me = await requireUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) return;
    // Once the game is running, seats are fixed; leaving just navigates away.
    if (room.status !== "waiting") return;

    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();
    const mine = members.find((m) => m.userId === me._id);
    if (mine) await ctx.db.delete(mine._id);

    const rest = members.filter((m) => m.userId !== me._id);
    if (rest.length === 0) {
      await ctx.db.delete(roomId);
      return;
    }
    if (room.hostId === me._id) {
      const next = [...rest].sort((a, b) => a.joinedAt - b.joinedAt)[0];
      await ctx.db.patch(roomId, { hostId: next.userId });
      await ctx.db.patch(next._id, { isReady: true });
    }
  },
});

export const startGame = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }): Promise<Id<"games">> => {
    const me = await requireUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found.");
    if (room.hostId !== me._id)
      throw new Error("Only the host can start the game.");
    if (room.status !== "waiting") throw new Error("Already started.");

    const members = (
      await ctx.db
        .query("roomMembers")
        .withIndex("by_room", (q) => q.eq("roomId", roomId))
        .collect()
    ).sort((a, b) => a.joinedAt - b.joinedAt);

    if (members.length < MIN_PLAYERS)
      throw new Error(`Need at least ${MIN_PLAYERS} players.`);
    if (members.some((m) => !m.isReady))
      throw new Error("Everyone must be ready.");

    const core = createGame(
      members.map((m) => ({
        name: m.name,
        avatar: m.avatar,
        goals: room.goals,
      })),
    );
    const now = Date.now();
    const gameId = await ctx.db.insert("games", {
      roomId,
      ownerId: room.hostId,
      mode: "online",
      seats: members.map((m, i) => ({
        seat: i,
        userId: m.userId,
        name: m.name,
        avatar: m.avatar,
      })),
      core,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(roomId, { status: "playing", gameId });
    return gameId;
  },
});

/** After a finished game: delete it and return everyone to the waiting room. */
export const playAgain = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }): Promise<void> => {
    const me = await requireUser(ctx);
    const room = await ctx.db.get(roomId);
    if (!room) throw new Error("Room not found.");
    if (room.hostId !== me._id)
      throw new Error("Only the host can reset the room.");
    if (room.gameId) await ctx.db.delete(room.gameId);
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .collect();
    for (const m of members) {
      await ctx.db.patch(m._id, { isReady: m.userId === room.hostId });
    }
    await ctx.db.patch(roomId, { status: "waiting", gameId: undefined });
  },
});
