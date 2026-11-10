"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: "🌐",
    title: "Online lobbies",
    description:
      "Create or join a room, pick an avatar, ready up and race friends to the top — live, synced by Convex.",
  },
  {
    icon: "🎥",
    title: "Video & voice",
    description:
      "Trash-talk face to face. Every room has built-in LiveKit video chat and text chat.",
  },
  {
    icon: "💾",
    title: "Cloud saves",
    description:
      "Games persist automatically. Save snapshots from the sidebar and pick up on any device.",
  },
] as const;

export default function Home() {
  const { isSignedIn } = useUser();
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center px-2 py-10 text-center">
      <motion.h1
        className="text-5xl font-black tracking-tight md:text-7xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="text-indigo-500">Jones</span> in the{" "}
        <span className="text-teal-500">Fast Lane</span>
      </motion.h1>
      <p className="mt-5 max-w-xl text-lg text-muted-foreground">
        Land the career, move into the luxury apartment, stay healthy and happy
        — and do it before your friends do.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {isSignedIn ? (
          <>
            <Link href="/lobby">
              <Button
                size="lg"
                className="bg-indigo-600 px-8 text-white hover:bg-indigo-500"
              >
                Online lobby →
              </Button>
            </Link>
            <Link href="/local/new">
              <Button size="lg" variant="outline" className="px-8">
                Solo / hot-seat
              </Button>
            </Link>
          </>
        ) : (
          <>
            <SignInButton mode="modal" forceRedirectUrl="/lobby">
              <Button
                size="lg"
                className="bg-indigo-600 px-8 text-white hover:bg-indigo-500"
              >
                Sign in to play
              </Button>
            </SignInButton>
            <Link href="/sign-up">
              <Button size="lg" variant="outline" className="px-8">
                Create account
              </Button>
            </Link>
          </>
        )}
      </div>

      <div className="mt-16 grid w-full gap-5 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border bg-card/60 p-6 text-left shadow-sm"
          >
            <div className="mb-3 text-4xl">{f.icon}</div>
            <h3 className="mb-1 text-lg font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
