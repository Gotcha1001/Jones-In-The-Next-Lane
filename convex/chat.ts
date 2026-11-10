import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { getCurrentUser, requireUser } from "./lib/auth";

export const list = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, { roomId }): Promise<Doc<"messages">[]> => {
    const me = await getCurrentUser(ctx);
    if (!me) return [];
    const member = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", roomId).eq("userId", me._id),
      )
      .first();
    if (!member) return [];
    return await ctx.db
      .query("messages")
      .withIndex("by_room", (q) => q.eq("roomId", roomId))
      .order("desc")
      .take(50)
      .then((rows) => rows.reverse());
  },
});

export const send = mutation({
  args: { roomId: v.id("rooms"), text: v.string() },
  handler: async (ctx, { roomId, text }): Promise<void> => {
    const me = await requireUser(ctx);
    const member = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", roomId).eq("userId", me._id),
      )
      .first();
    if (!member) throw new Error("You're not in this room.");
    const clean = text.trim().slice(0, 300);
    if (!clean) return;
    await ctx.db.insert("messages", {
      roomId,
      userId: me._id,
      userName: me.name,
      text: clean,
      createdAt: Date.now(),
    });
  },
});
