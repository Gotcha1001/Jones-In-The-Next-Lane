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
];

function gameHref(g: {
  _id: Id<"games">;
  roomId: Id<"rooms"> | undefined;
}): string {
  return g.roomId ? `/room/${g.roomId}` : `/play/${g._id}`;
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

  const activeGames = (myGames ?? []).filter((g) => g.status === "active");

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-3 py-3">
          <span className="text-2xl">🏎️</span>
          <div>
            <p className="text-sm font-semibold">
              Jones <span className="text-indigo-500">Fast Lane</span>
            </p>
            <p className="text-[10px] text-muted-foreground">
              Online multiplayer
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Play</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton asChild isActive={pathname === href}>
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
          <SidebarGroupLabel>Continue playing</SidebarGroupLabel>
          <SidebarMenu>
            {myGames === undefined && (
              <p className="px-3 py-1 text-xs text-muted-foreground">
                Loading…
              </p>
            )}
            {myGames !== undefined && activeGames.length === 0 && (
              <p className="px-3 py-1 text-xs text-muted-foreground">
                No games in progress.
              </p>
            )}
            {activeGames.map((g) => (
              <SidebarMenuItem key={g._id}>
                <SidebarMenuButton asChild isActive={pathname === gameHref(g)}>
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
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Saved games</SidebarGroupLabel>
          <SidebarMenu>
            {saves === undefined && (
              <p className="px-3 py-1 text-xs text-muted-foreground">
                Loading…
              </p>
            )}
            {saves !== undefined && saves.length === 0 && (
              <p className="px-3 py-1 text-xs text-muted-foreground">
                Nothing saved yet — use “Save” while playing.
              </p>
            )}
            {(saves ?? []).slice(0, 8).map((s) => (
              <SidebarMenuItem key={s._id}>
                <SidebarMenuButton
                  onClick={() => void onLoad(s._id)}
                  tooltip={s.title}
                >
                  <Trophy size={16} />
                  <span className="truncate">{s.title}</span>
                </SidebarMenuButton>
                <SidebarMenuAction
                  aria-label={`Delete ${s.title}`}
                  onClick={() => void onDelete(s._id)}
                  showOnHover
                >
                  <Trash2 size={14} />
                </SidebarMenuAction>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <div className="flex items-center gap-2 border-t px-3 py-2">
            <PlayerAvatar
              src={user.imageUrl}
              name={user.fullName ?? user.username ?? "U"}
              size={28}
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">
                {user.fullName ?? user.username}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
