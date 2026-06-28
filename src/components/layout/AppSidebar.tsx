import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Rocket,
  Users,
  Clock,
  Bell,
  BarChart3,
  Sparkles,
  Settings,
  Shield,
  ChevronDown,
  Plus,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useActiveOrgId } from "@/hooks/use-organizations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "My Tasks", url: "/tasks", icon: ListTodo },
  { title: "Sprints", url: "/sprints", icon: Rocket },
  { title: "Team", url: "/team", icon: Users },
  { title: "Time Tracking", url: "/time", icon: Clock },
];

const insightsNav = [
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "AI Assistant", url: "/ai", icon: Sparkles },
  { title: "Notifications", url: "/notifications", icon: Bell },
];

const adminNav = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Admin Panel", url: "/admin", icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (p: string) => pathname === p || pathname.startsWith(p + "/");
  const { orgs, orgId, setOrgId } = useActiveOrgId();
  const activeOrg = orgs.find((o) => o.id === orgId);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b p-3">
        <Link to="/dashboard" className="flex items-center gap-2 px-1">
          <div className="grid h-8 w-8 place-items-center rounded-lg gradient-brand text-primary-foreground shadow-sm">
            <Rocket className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">TaskForge AI</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Enterprise
              </span>
            </div>
          )}
        </Link>
        {!collapsed && orgs.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="mt-3 w-full justify-between text-xs font-medium"
                size="sm"
              >
                <span className="truncate">{activeOrg?.name ?? "Select workspace"}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              {orgs.map((o) => (
                <DropdownMenuItem key={o.id} onClick={() => setOrgId(o.id)}>
                  {o.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/onboarding">
                  <Plus className="mr-2 h-4 w-4" /> New workspace
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {insightsNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3 text-[11px] text-muted-foreground">
        {!collapsed && <span>v1.0 · TaskForge AI</span>}
      </SidebarFooter>
    </Sidebar>
  );
}
