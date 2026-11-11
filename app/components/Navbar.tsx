"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";

const CUT =
  "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between gap-3 overflow-hidden border-b border-cyan-400/20 bg-black/80 px-4 py-3 backdrop-blur">
      {/* TV static + scanlines + travelling beam */}
      <div aria-hidden className="cyber-noise" />
      <div aria-hidden className="cyber-scanlines" />
      <div aria-hidden className="cyber-beam" />

      <div className="relative z-10 flex items-center gap-3">
        <SignedIn>
          <SidebarTrigger className="text-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-200" />
        </SignedIn>

        <Link
          href="/"
          className="group flex items-center gap-2 text-lg font-black uppercase tracking-tight"
        >
          <span className="text-2xl drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
            🏎️
          </span>
          <span
            data-text="JONES"
            className="cyber-glitch cyber-flicker text-cyan-300"
            style={{ textShadow: "0 0 8px currentColor" }}
          >
            JONES
          </span>
          <span
            data-text="IN THE FAST LANE"
            className="cyber-glitch cyber-flicker-slow hidden text-fuchsia-400 sm:inline-block"
            style={{ textShadow: "0 0 8px currentColor" }}
          >
            IN THE FAST LANE
          </span>
        </Link>
      </div>

      <div className="relative z-10 flex items-center gap-2">
        <ThemeToggle />
        <SignedOut>
          <Link
            href="/sign-in"
            style={{ clipPath: CUT }}
            className="border border-white/10 bg-white/5 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            style={{
              clipPath: CUT,
              boxShadow: "0 0 18px rgba(34,211,238,0.45)",
            }}
            className="bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2 font-mono text-xs font-black uppercase tracking-widest text-black transition hover:brightness-110"
          >
            Sign up
          </Link>
        </SignedOut>
        <SignedIn>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-[0_0_14px_rgba(232,121,249,0.6)] ring-2 ring-fuchsia-400/70">
            <UserButton
              appearance={{
                elements: {
                  userButtonBox: "flex items-center justify-center",
                  userButtonTrigger: "rounded-full focus:shadow-none",
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </div>
        </SignedIn>
      </div>
    </nav>
  );
}
