"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <SignedIn>
          <SidebarTrigger />
        </SignedIn>
        <Link href="/" className="text-lg font-black tracking-tight">
          🏎️ <span className="text-indigo-500">JONES</span>{" "}
          <span className="text-teal-500">IN THE FAST LANE</span>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <SignedOut>
          <Link href="/sign-in">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-indigo-600 text-white hover:bg-indigo-500">
              Sign up
            </Button>
          </Link>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
}
