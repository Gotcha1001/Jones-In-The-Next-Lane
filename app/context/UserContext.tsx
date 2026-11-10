"use client";

import { createContext, useContext } from "react";
import type { Doc } from "@/convex/_generated/dataModel";

/**
 * The signed-in user, exactly as Convex stores it.
 * Doc<"users"> gives `_id: Id<"users">` (a branded id, not a plain string),
 * which is what ChatBox, queries and mutations expect.
 */
export type User = Doc<"users">;

export const UserContext = createContext<User | null>(null);

export function useUserContext(): User | null {
  return useContext(UserContext);
}
