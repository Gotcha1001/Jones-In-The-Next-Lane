// convex/appearance.ts
//
// Stand-alone on purpose: it does not touch your existing convex/users.ts.
// It only needs the `users` table to have the optional `appearance` field
// (see INTEGRATION.md) and a `by_clerk_id` index.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { normalizeAppearance, type Appearance } from "./lib/appearance";

const appearanceArg = v.object({
  accent: v.string(),
  rainMode: v.string(),
  rainDensity: v.number(),
  rainSpeed: v.number(),
  rainSize: v.number(),
  rainOpacity: v.number(),
  glow: v.boolean(),
  uiSize: v.string(),
});

/** The signed-in user's saved look, or null if they never saved one. */
export const getMyAppearance = query({
  args: {},
  handler: async (ctx): Promise<Appearance | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    return user?.appearance ? normalizeAppearance(user.appearance) : null;
  },
});

export const setMyAppearance = mutation({
  args: { appearance: appearanceArg },
  handler: async (ctx, { appearance }): Promise<void> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Validate / clamp on the server too, so bad values can never be stored.
    await ctx.db.patch(user._id, {
      appearance: normalizeAppearance(appearance),
    });
  },
});
