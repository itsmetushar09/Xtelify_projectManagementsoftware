import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Rocket,
  Users,
  Clock,
  BarChart3,
  Sparkles,
  Bell,
  Settings,
  Plus,
} from "lucide-react";

const items = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  { label: "My Tasks", to: "/tasks", icon: ListTodo },
  { label: "Sprints", to: "/sprints", icon: Rocket },
  { label: "Team", to: "/team", icon: Users },
  { label: "Time Tracking", to: "/time", icon: Clock },
  { label: "Reports", to: "/reports", icon: BarChart3 },
  { label: "AI Assistant", to: "/ai", icon: Sparkles },
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "Settings", to: "/settings", icon: Settings },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const navigate = useNavigate();
  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {items.map((i) => (
            <CommandItem key={i.to} onSelect={() => go(i.to)}>
              <i.icon className="mr-2 h-4 w-4" />
              {i.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go("/projects?new=1")}>
            <Plus className="mr-2 h-4 w-4" /> New project
          </CommandItem>
          <CommandItem onSelect={() => go("/tasks?new=1")}>
            <Plus className="mr-2 h-4 w-4" /> New task
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
