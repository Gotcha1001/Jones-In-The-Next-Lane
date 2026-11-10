import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { vGameCore, vGameMode, vGoals, vSeat } from "../lib/game/validators";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    createdAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  // ── Lobby ────────────────────────────────────────────────────────────────
  rooms: defineTable({
    name: v.string(),
    hostId: v.id("users"),
    status: v.union(
      v.literal("waiting"),
      v.literal("playing"),
      v.literal("finished"),
    ),
    maxPlayers: v.number(),
    goals: vGoals,
    /** Set once the host presses Start. */
    gameId: v.optional(v.id("games")),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  roomMembers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    /** Public path of the chosen in-game avatar, e.g. /avatars/avatar30.jpg */
    avatar: v.string(),
    isReady: v.boolean(),
    joinedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_user", ["roomId", "userId"])
    .index("by_user", ["userId"]),

  messages: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    userName: v.string(),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),

  // ── Game state (server-authoritative) ────────────────────────────────────
  games: defineTable({
    /** Absent for local (hot-seat / solo) games. */
    roomId: v.optional(v.id("rooms")),
    ownerId: v.id("users"),
    mode: vGameMode,
    seats: v.array(vSeat),
    core: vGameCore,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_room", ["roomId"]),

  // ── Saved games (the sidebar list) ───────────────────────────────────────
  savedGames: defineTable({
    userId: v.id("users"),
    title: v.string(),
    mode: vGameMode,
    seats: v.array(vSeat),
    core: vGameCore,
    /** Denormalised for the sidebar so it never has to parse `core`. */
    summary: v.object({
      playerNames: v.array(v.string()),
      week: v.number(),
      round: v.number(),
      leaderCash: v.number(),
    }),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
