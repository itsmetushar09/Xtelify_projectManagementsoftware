import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Moon, Search, Sun, LogOut, User as UserIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { CommandPalette } from "./CommandPalette";
import { useQuery } from "@tanstack/react-query";

function titleFromPath(p: string) {
  const seg = p.split("/").filter(Boolean)[0] ?? "dashboard";
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}

export function AppHeader() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const { data: unread = 0 } = useQuery({
    queryKey: ["notif-unread", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth/login" });
  };

  const initials =
    (user?.user_metadata?.full_name || user?.email || "U")
      .split(" ")
      .map((s: string) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-3 backdrop-blur md:px-5">
        <SidebarTrigger />
        <div className="hidden text-sm font-medium md:block">{titleFromPath(pathname)}</div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden h-9 w-64 justify-start gap-2 text-muted-foreground md:flex"
            onClick={() => setCmdOpen(true)}
          >
            <Search className="h-4 w-4" /> Search…
            <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/notifications" })}
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                {unread}
              </span>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full outline-none ring-ring focus-visible:ring-2">
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {user?.user_metadata?.full_name || "Account"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                <UserIcon className="mr-2 h-4 w-4" /> Profile & settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </>
  );
}
