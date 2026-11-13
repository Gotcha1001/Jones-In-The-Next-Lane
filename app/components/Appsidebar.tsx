"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import {
  BookOpen,
  Gamepad2,
  Home,
  Play,
  Save,
  Trash2,
  Users,
  Trophy,
  Settings,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { PlayerAvatar } from "./PlayerAvatar";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/lobby", label: "Online Lobby", icon: Users },
  { href: "/local/new", label: "New Solo / Hot-seat", icon: Gamepad2 },
  { href: "/saved", label: "Saved Games", icon: Save },
  { href: "/rules", label: "How to Win", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

const CUT =
  "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))";

function gameHref(g: {
  _id: Id<"games">;
  roomId: Id<"rooms"> | undefined;
}): string {
  return g.roomId ? `/room/${g.roomId}` : `/play/${g._id}`;
}

function GroupLabel({ children }: { children: string }) {
  return (
    <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.3em] text-fuchsia-400/90">
      {` ${children}`}
    </SidebarGroupLabel>
  );
}

function EmptyNote({ children }: { children: string }) {
  return (
    <p className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white/40">
      {children}
    </p>
  );
}

export function AppSidebar() {
  const { user, isSignedIn } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();

  const myGames = useQuery(api.game.listMyGames, isSignedIn ? {} : "skip");
  const saves = useQuery(api.saves.listSaves, isSignedIn ? {} : "skip");
  const loadSave = useMutation(api.saves.loadSave);
  const deleteSave = useMutation(api.saves.deleteSave);
  const deleteGame = useMutation(api.game.deleteGame);

  if (!isSignedIn) return null;

  const closeOnMobile = (): void => {
    if (isMobile) setOpenMobile(false);
  };

  const onLoad = async (saveId: Id<"savedGames">): Promise<void> => {
    try {
      const gameId = await loadSave({ saveId });
      closeOnMobile();
      router.push(`/play/${gameId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't load that save");
    }
  };

  const onDelete = async (saveId: Id<"savedGames">): Promise<void> => {
    await deleteSave({ saveId });
    toast.success("Save deleted");
  };

  const onDeleteGame = async (
    gameId: Id<"games">,
    label: string,
    href: string,
  ): Promise<void> => {
    if (!window.confirm(`Delete "${label}"? This can't be undone.`)) return;
    try {
      await deleteGame({ gameId });
      toast.success("Game deleted");
      // If that's the game on screen, leave it.
      if (pathname === href) router.push("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete that game");
    }
  };

  const activeGames = (myGames ?? []).filter((g) => g.status === "active");

  return (
    <Sidebar>
      <SidebarHeader className="relative overflow-hidden border-b border-cyan-400/20 p-0">
        <div aria-hidden className="cyber-noise" />
        <div aria-hidden className="cyber-scanlines" />
        <div aria-hidden className="cyber-beam" />
        <div className="relative z-10 flex items-center gap-3 px-4 py-4">
          <span className="text-3xl drop-shadow-[0_0_10px_rgba(34,211,238,0.9)]">
            🏎️
          </span>
          <div className="group">
            <p className="text-sm font-black uppercase leading-tight tracking-wide">
              <span
                data-text="Jones"
                className="cyber-glitch cyber-flicker text-cyan-300"
                style={{ textShadow: "0 0 8px currentColor" }}
              >
                Jones
              </span>{" "}
              <span
                data-text="Fast Lane"
                className="cyber-glitch cyber-flicker-slow text-fuchsia-400"
                style={{ textShadow: "0 0 8px currentColor" }}
              >
                Fast Lane
              </span>
            </p>
            <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
              <span className="cyber-dot inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Online multiplayer
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent">
        <SidebarGroup>
          <GroupLabel>Play</GroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === href}
                  className="cyber-nav"
                >
                  <Link href={href} onClick={closeOnMobile}>
                    <Icon size={16} />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <GroupLabel>Continue playing</GroupLabel>
          <SidebarMenu>
            {myGames === undefined && <EmptyNote>Loading…</EmptyNote>}
            {myGames !== undefined && activeGames.length === 0 && (
              <EmptyNote>No games in progress.</EmptyNote>
            )}
            {activeGames.map((g) => (
              <SidebarMenuItem key={g._id}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === gameHref(g)}
                  className="cyber-nav"
                >
                  <Link href={gameHref(g)} onClick={closeOnMobile}>
                    {g.mode === "online" ? (
                      <Users size={16} />
                    ) : (
                      <Play size={16} />
                    )}
                    <span className="truncate">
                      {g.playerNames.join(", ")} · R{g.round}
                    </span>
                  </Link>
                </SidebarMenuButton>
                {/* Online games are removed by resetting the room, not here. */}
                {g.mode === "local" && (
                  <SidebarMenuAction
                    aria-label={`Delete ${g.playerNames.join(", ")} · R${g.round}`}
                    onClick={() =>
                      void onDeleteGame(
                        g._id,
                        `${g.playerNames.join(", ")} · R${g.round}`,
                        gameHref(g),
                      )
                    }
                    showOnHover
                    className="text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
                  >
                    <Trash2 size={14} />
                  </SidebarMenuAction>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <GroupLabel>Saved games</GroupLabel>
          <SidebarMenu>
            {saves === undefined && <EmptyNote>Loading…</EmptyNote>}
            {saves !== undefined && saves.length === 0 && (
              <EmptyNote>
                Nothing saved yet — use “Save” while playing.
              </EmptyNote>
            )}
            {(saves ?? []).slice(0, 8).map((s) => (
              <SidebarMenuItem key={s._id}>
                <SidebarMenuButton
                  onClick={() => void onLoad(s._id)}
                  tooltip={s.title}
                  className="cyber-nav"
                >
                  <Trophy size={16} />
                  <span className="truncate">{s.title}</span>
                </SidebarMenuButton>
                <SidebarMenuAction
                  aria-label={`Delete ${s.title}`}
                  onClick={() => void onDelete(s._id)}
                  showOnHover
                  className="text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
                >
                  <Trash2 size={14} />
                </SidebarMenuAction>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {user && (
          <div
            style={{ clipPath: CUT }}
            className="relative flex items-center gap-3 border border-fuchsia-400/40 bg-black/60 px-3 py-2"
          >
            <div aria-hidden className="cyber-scanlines" />
            <div className="relative rounded-full p-0.5 shadow-[0_0_12px_rgba(232,121,249,0.7)] ring-2 ring-fuchsia-400/80">
              <PlayerAvatar
                src={user.imageUrl}
                name={user.fullName ?? user.username ?? "U"}
                size={32}
              />
              <span className="cyber-dot absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-black bg-cyan-400" />
            </div>
            <div className="relative min-w-0">
              <p className="truncate text-xs font-bold uppercase tracking-wide text-white">
                {user.fullName ?? user.username}
              </p>
              <p className="truncate font-mono text-[10px] text-cyan-300/70">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
