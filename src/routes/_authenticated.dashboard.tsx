import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useActiveOrgId } from "@/hooks/use-organizations";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import {
  FolderKanban,
  ListTodo,
  CheckCircle2,
  Users,
  Rocket,
  TrendingUp,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/app/EmptyState";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orgId, orgs } = useActiveOrgId();

  // Redirect to onboarding if no orgs
  useEffect(() => {
    if (orgs !== undefined && orgs.length === 0) {
      navigate({ to: "/onboarding" });
    }
  }, [orgs, navigate]);

  const stats = useQuery({
    queryKey: ["dashboard-stats", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [projects, tasks, members] = await Promise.all([
        supabase.from("projects").select("id,status", { count: "exact" }).eq("organization_id", orgId!),
        supabase
          .from("tasks")
          .select("id,status,project_id,projects!inner(organization_id)")
          .eq("projects.organization_id", orgId!),
        supabase
          .from("organization_members")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId!),
      ]);
      const allProj = projects.data ?? [];
      const allTasks = tasks.data ?? [];
      return {
        totalProjects: allProj.length,
        activeProjects: allProj.filter((p) => p.status === "active").length,
        completedProjects: allProj.filter((p) => p.status === "completed").length,
        totalEmployees: members.count ?? 0,
        pendingTasks: allTasks.filter((t) => t.status !== "done").length,
        completedTasks: allTasks.filter((t) => t.status === "done").length,
        totalTasks: allTasks.length,
      };
    },
  });

  const recentProjects = useQuery({
    queryKey: ["recent-projects", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("organization_id", orgId!)
        .order("updated_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const s = stats.data;
  const productivity =
    s && s.totalTasks > 0 ? Math.round((s.completedTasks / s.totalTasks) * 100) : 0;

  const velocityData = [
    { name: "W1", points: 24 },
    { name: "W2", points: 32 },
    { name: "W3", points: 28 },
    { name: "W4", points: 41 },
    { name: "W5", points: 36 },
    { name: "W6", points: 48 },
  ];
  const burndownData = [
    { day: "D1", remaining: 60, ideal: 60 },
    { day: "D2", remaining: 55, ideal: 50 },
    { day: "D3", remaining: 48, ideal: 40 },
    { day: "D4", remaining: 38, ideal: 30 },
    { day: "D5", remaining: 25, ideal: 20 },
    { day: "D6", remaining: 12, ideal: 10 },
    { day: "D7", remaining: 4, ideal: 0 },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome${user?.user_metadata?.full_name ? ", " + user.user_metadata.full_name.split(" ")[0] : ""}`}
        description="Here's what's happening across your workspace today."
        actions={
          <Button onClick={() => navigate({ to: "/projects" })}>
            <Plus className="mr-2 h-4 w-4" /> New project
          </Button>
        }
      />

      <div className="space-y-6 p-5 md:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active Projects" value={s?.activeProjects ?? 0} icon={FolderKanban} trend={`${s?.totalProjects ?? 0} total`} accent="primary" />
          <StatCard label="Pending Tasks" value={s?.pendingTasks ?? 0} icon={ListTodo} trend={`${s?.completedTasks ?? 0} completed`} accent="warning" />
          <StatCard label="Productivity" value={`${productivity}%`} icon={TrendingUp} trend="Last 30 days" trendUp accent="success" />
          <StatCard label="Team Size" value={s?.totalEmployees ?? 0} icon={Users} trend="All members" accent="info" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Sprint Velocity</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={velocityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" stroke="currentColor" className="text-xs text-muted-foreground" />
                  <YAxis stroke="currentColor" className="text-xs text-muted-foreground" />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                  <Bar dataKey="points" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workload Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {["Engineering", "Design", "QA", "Product"].map((d, i) => {
                const v = [82, 64, 48, 71][i];
                return (
                  <div key={d}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium">{d}</span>
                      <span className="text-muted-foreground">{v}%</span>
                    </div>
                    <Progress value={v} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Projects</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/projects" })}>
                View all
              </Button>
            </CardHeader>
            <CardContent>
              {recentProjects.data?.length ? (
                <div className="divide-y">
                  {recentProjects.data.map((p) => (
                    <button
                      key={p.id}
                      className="flex w-full items-center justify-between py-3 text-left hover:bg-muted/40"
                      onClick={() => navigate({ to: "/projects/$projectId", params: { projectId: p.id } })}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ background: p.color ?? "var(--color-primary)" }}
                        />
                        <div>
                          <div className="text-sm font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.client_name ?? "Internal"}</div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {p.status.replace("_", " ")}
                      </Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FolderKanban}
                  title="No projects yet"
                  description="Create your first project to start tracking work."
                  action={{ label: "Create project", onClick: () => navigate({ to: "/projects" }) }}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sprint Burndown</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burndownData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" stroke="currentColor" />
                  <YAxis className="text-xs" stroke="currentColor" />
                  <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="ideal" stroke="var(--color-muted-foreground)" strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="remaining" stroke="var(--color-primary)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
