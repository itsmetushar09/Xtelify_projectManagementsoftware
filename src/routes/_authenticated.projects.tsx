import {
  createFileRoute,
  useNavigate,
  Outlet,
} from "@tanstack/react-router";
import { useState } from "react";
import { useActiveOrgId } from "@/hooks/use-organizations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderKanban, Calendar, Users } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects")({
  component: ProjectsPage,
});

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/15 text-info",
  high: "bg-warning/20 text-warning-foreground",
  critical: "bg-destructive/15 text-destructive",
};

function ProjectsPage() {
  const { orgId } = useActiveOrgId();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    status: "planning" as const,
    priority: "medium" as const,
    client_name: "",
    color: "#4F46E5",
  });

  const create = async () => {
    if (!orgId || !form.name.trim() || !form.key.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("projects").insert({
      organization_id: orgId,
      name: form.name.trim(),
      key: form.key.trim().toUpperCase().slice(0, 6),
      description: form.description,
      status: form.status,
      priority: form.priority,
      client_name: form.client_name || null,
      color: form.color,
      created_by: u.user?.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Project created");
    setOpen(false);
    setForm({ name: "", key: "", description: "", status: "planning", priority: "medium", client_name: "", color: "#4F46E5" });
    qc.invalidateQueries({ queryKey: ["projects", orgId] });
  };

 

  return (
    <div>
      <PageHeader
        title="Projects"
        description="All projects in your workspace."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New project
                
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create project</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Mobile App Redesign" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Key</Label>
                    <Input value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} placeholder="MAR" maxLength={6} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as any }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_hold">On hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as any }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Client (optional)</Label>
                  <Input value={form.client_name} onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))} placeholder="Acme Corp" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={create}>Create project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="p-5 md:p-8">
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Spin up your first project to organize sprints, tasks and time."
            action={{ label: "Create project", onClick: () => setOpen(true) }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {projects.map((p) => (
    <Card
      key={p.id}
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => {
        console.log("CLICKED PROJECT:", p.id);

        navigate({
          to: "/projects/$projectId",
          params: {
            projectId: p.id,
          },
        });
      }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-lg text-sm font-semibold text-white"
              style={{
                background: p.color ?? "var(--color-primary)",
              }}
            >
              {p.key.slice(0, 2)}
            </div>

            <div>
              <h3 className="text-sm font-semibold">{p.name}</h3>
              <p className="text-xs text-muted-foreground">
                {p.key}
              </p>
            </div>
          </div>

          <Badge
            variant="secondary"
            className={
              priorityColors[
                p.priority as keyof typeof priorityColors
              ]
            }
          >
            {p.priority}
          </Badge>
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {p.description || "No description yet."}
        </p>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 capitalize">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {p.status.replace("_", " ")}
          </span>

          {p.client_name && (
            <span className="flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              {p.client_name}
            </span>
          )}

          {p.end_date && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {new Date(
                p.end_date
              ).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  ))}
</div>
        )}
      </div>
    </div>
  
  );
}
