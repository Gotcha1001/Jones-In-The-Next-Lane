/**
 * app/api/livekit-token/route.ts
 * Issues a LiveKit access token — but only to signed-in members of the room.
 *
 * Env (.env.local):
 *   LIVEKIT_API_KEY, LIVEKIT_API_SECRET, NEXT_PUBLIC_LIVEKIT_URL
 *   NEXT_PUBLIC_CONVEX_URL
 *
 * Unlike the first-draft version, the identity is taken from the Clerk session
 * (never from the query string) and room membership is verified in Convex, so
 * nobody can mint a token for someone else or sit in a stranger's room.
 */
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { AccessToken } from "livekit-server-sdk";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { userId, getToken } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const room = searchParams.get("room");
  const userName = (searchParams.get("userName") ?? "Player").slice(0, 40);
  if (!room)
    return NextResponse.json({ error: "room is required" }, { status: 400 });

  const convexToken = await getToken({ template: "convex" });
  if (!convexToken)
    return NextResponse.json({ error: "No Convex token" }, { status: 401 });

  const isMember = await fetchQuery(
    api.rooms.isMember,
    { roomId: room as Id<"rooms"> },
    { token: convexToken },
  ).catch(() => false);
  if (!isMember)
    return NextResponse.json(
      { error: "Not a member of this room" },
      { status: 403 },
    );

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit keys are not configured" },
      { status: 500 },
    );
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: userName,
    ttl: "4h",
  });
  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return NextResponse.json({ token: await at.toJwt() });
}
