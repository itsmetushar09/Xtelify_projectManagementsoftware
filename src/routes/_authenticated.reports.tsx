import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveOrgId } from "@/hooks/use-organizations";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

const COLORS = ["var(--color-primary)", "var(--color-success)", "var(--color-warning)", "var(--color-info)", "var(--color-destructive)"];

function ReportsPage() {
  const { orgId } = useActiveOrgId();
  const { data: tasks = [] } = useQuery({
    queryKey: ["report-tasks", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("status,priority,type,project_id,projects!inner(organization_id,name)").eq("projects.organization_id", orgId!);
      return data ?? [];
    },
  });

  const byStatus = ["backlog","todo","in_progress","code_review","qa_testing","done"].map((s) => ({
    name: s.replace("_", " "), value: tasks.filter((t) => t.status === s).length,
  }));
  const byPriority = ["low","medium","high","urgent"].map((p) => ({
    name: p, value: tasks.filter((t) => t.priority === p).length,
  }));
  const projectTotals = Object.entries(
    tasks.reduce((acc: Record<string, number>, t: any) => {
      const n = t.projects?.name ?? "Unknown";
      acc[n] = (acc[n] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count }));

  const exportCSV = () => {
    const rows = [["Type", "Count"], ...byStatus.map((r) => [r.name, String(r.value)])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Reports & Analytics" description="Productivity, sprint performance, and resource utilization."
        actions={<>
          <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Button variant="outline" disabled><FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel</Button>
        </>}
      />
      <div className="grid gap-4 p-5 md:p-8 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Tasks by Status</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" stroke="currentColor" />
                <YAxis className="text-xs" stroke="currentColor" />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Priority Mix</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byPriority} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                  {byPriority.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Tasks per Project</CardTitle></CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectTotals}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" stroke="currentColor" />
                <YAxis className="text-xs" stroke="currentColor" />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="count" fill="var(--color-info)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
