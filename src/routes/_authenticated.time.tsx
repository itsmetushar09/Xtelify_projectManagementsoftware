import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useActiveOrgId } from "@/hooks/use-organizations";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/time")({
  component: TimePage,
});

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function TimePage() {
  const { user } = useAuth();
  const { orgId } = useActiveOrgId();
  const qc = useQueryClient();
  const [selectedProject, setSelectedProject] = useState("");
  const [description, setDescription] = useState("");
  const [tick, setTick] = useState(0);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-min", orgId],
    enabled: !!orgId,
    queryFn: async () => (await supabase.from("projects").select("id,name").eq("organization_id", orgId!)).data ?? [],
  });

  const { data: running } = useQuery({
    queryKey: ["running-timer", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user!.id)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: entries = [] } = useQuery({
    queryKey: ["time-entries", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("time_entries")
        .select("*, projects(name)")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!running) return;
    const i = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(i);
  }, [running]);

  const elapsed = running ? Math.floor((Date.now() - new Date(running.started_at).getTime()) / 1000) : 0;

  const start = async () => {
    if (!user || !selectedProject) return toast.error("Pick a project");
    const { error } = await supabase.from("time_entries").insert({
      user_id: user.id, project_id: selectedProject, description, started_at: new Date().toISOString(),
    });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["running-timer", user.id] });
    qc.invalidateQueries({ queryKey: ["time-entries", user.id] });
  };

  const stop = async () => {
    if (!running) return;
    const ended = new Date();
    const dur = Math.floor((ended.getTime() - new Date(running.started_at).getTime()) / 1000);
    const { error } = await supabase.from("time_entries").update({
      ended_at: ended.toISOString(), duration_seconds: dur,
    }).eq("id", running.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["running-timer", user!.id] });
    qc.invalidateQueries({ queryKey: ["time-entries", user!.id] });
  };

  return (
    <div>
      <PageHeader title="Time Tracking" description="Track time per project. Start a timer or log entries manually." />
      <div className="space-y-6 p-5 md:p-8">
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center">
            <div className="flex-shrink-0 rounded-xl bg-primary/10 p-4 text-primary">
              <Clock className="h-6 w-6" />
            </div>
            <div className="flex-1">
              {running ? (
                <>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Running timer</p>
                  <p className="font-mono text-3xl font-semibold tabular-nums">{formatDuration(elapsed)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{running.description || "Working…"}</p>
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">No timer running</p>
                  <p className="text-sm text-muted-foreground">Pick a project and hit start.</p>
                </>
              )}
            </div>
            {!running ? (
              <div className="flex flex-col gap-2 md:flex-row">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="md:w-56"><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="What are you working on?" value={description} onChange={(e) => setDescription(e.target.value)} className="md:w-64" />
                <Button onClick={start}><Play className="mr-2 h-4 w-4" /> Start</Button>
              </div>
            ) : (
              <Button variant="destructive" onClick={stop}><Square className="mr-2 h-4 w-4" /> Stop</Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent entries</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Project</TableHead><TableHead>Description</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Duration</TableHead></TableRow></TableHeader>
              <TableBody>
                {entries.filter((e: any) => e.ended_at).map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.projects?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{e.description ?? "—"}</TableCell>
                    <TableCell>{new Date(e.started_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{formatDuration(e.duration_seconds ?? 0)}</TableCell>
                  </TableRow>
                ))}
                {entries.length === 0 && <TableRow><TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">No time tracked yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
