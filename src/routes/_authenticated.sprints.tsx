import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveOrgId } from "@/hooks/use-organizations";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Rocket, Calendar, Target, Play, CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/app/EmptyState";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sprints")({
  component: SprintsPage,
});

function SprintsPage() {
  const { orgId } = useActiveOrgId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-min", orgId],
    enabled: !!orgId,
    queryFn: async () => (await supabase.from("projects").select("id,name").eq("organization_id", orgId!)).data ?? [],
  });

  const { data: sprints = [] } = useQuery({
    queryKey: ["sprints", orgId],
    enabled: !!orgId && projects.length > 0,
    queryFn: async () => {
      const ids = projects.map((p) => p.id);
      const { data } = await supabase.from("sprints").select("*, projects(name)").in("project_id", ids).order("start_date", { ascending: false });
      return data ?? [];
    },
  });

  const [form, setForm] = useState({ name: "", goal: "", project_id: "", start_date: "", end_date: "" });

  const create = async () => {
    if (!form.name || !form.project_id) return;
    const { error } = await supabase.from("sprints").insert({
      name: form.name, goal: form.goal, project_id: form.project_id,
      start_date: form.start_date || null, end_date: form.end_date || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Sprint created");
    setOpen(false);
    setForm({ name: "", goal: "", project_id: "", start_date: "", end_date: "" });
    qc.invalidateQueries({ queryKey: ["sprints", orgId] });
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("sprints").update({ status: status as any }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["sprints", orgId] });
  };

  return (
    <div>
      <PageHeader title="Sprints" description="Agile sprint planning and tracking across all projects."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={projects.length === 0}><Plus className="mr-2 h-4 w-4" /> New sprint</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create sprint</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Sprint 12" /></div>
                <div className="space-y-1.5"><Label>Project</Label>
                  <Select value={form.project_id} onValueChange={(v) => setForm((f) => ({ ...f, project_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Goal</Label><Textarea value={form.goal} onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))} rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Start</Label><Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} /></div>
                  <div className="space-y-1.5"><Label>End</Label><Input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} /></div>
                </div>
              </div>
              <DialogFooter><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-5 md:p-8">
        {sprints.length === 0 ? (
          <EmptyState icon={Rocket} title="No sprints yet" description="Create a sprint to start planning your team's work in time-boxed iterations." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sprints.map((s: any) => (
              <Card key={s.id}>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <Badge variant="secondary" className="capitalize">{s.status}</Badge>
                    <span className="text-xs text-muted-foreground">{s.projects?.name}</span>
                  </div>
                  <h3 className="text-base font-semibold">{s.name}</h3>
                  {s.goal && <p className="mt-1 line-clamp-2 flex items-start gap-1.5 text-sm text-muted-foreground"><Target className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" /> {s.goal}</p>}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {s.start_date ? new Date(s.start_date).toLocaleDateString() : "—"} → {s.end_date ? new Date(s.end_date).toLocaleDateString() : "—"}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {s.status === "planned" && <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "active")}><Play className="mr-1 h-3 w-3" /> Start</Button>}
                    {s.status === "active" && <Button size="sm" variant="outline" onClick={() => setStatus(s.id, "completed")}><CheckCircle2 className="mr-1 h-3 w-3" /> Complete</Button>}
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
