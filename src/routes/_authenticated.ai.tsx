import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Sparkles, ListChecks, AlertTriangle, FileText, Rocket, Loader2 } from "lucide-react";
import { useActiveOrgId } from "@/hooks/use-organizations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateTasksFromBrief } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/ai")({
  component: AIPage,
});

const tools = [
  { id: "tasks", title: "AI Task Generator", description: "Turn a brief into a structured task list.", icon: ListChecks },
  { id: "planner", title: "Sprint Planner", description: "Suggest sprint allocation based on team capacity.", icon: Rocket },
  { id: "risk", title: "Risk Detector", description: "Identify delayed projects and overloaded resources.", icon: AlertTriangle },
  { id: "summary", title: "Progress Summary", description: "Generate a weekly project summary.", icon: FileText },
];

function AIPage() {
  const { orgId, orgs } = useActiveOrgId();
  const [activeTool, setActiveTool] = useState("tasks");
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const generate = useServerFn(generateTasksFromBrief);

  // Load projects for save target
  useState(() => {
    if (orgId) supabase.from("projects").select("id,name").eq("organization_id", orgId!).then(({ data }) => setProjects(data ?? []));
  });

  const run = async () => {
    if (!brief.trim()) return;
    setLoading(true);
    setOutput("");
    try {
      const result = await generate({ data: { brief, tool: activeTool } });
      setOutput(result.text);
    } catch (e: any) {
      toast.error(e?.message ?? "AI request failed");
    }
    setLoading(false);
  };

  return (
    <div>
      <PageHeader title="AI Assistant" description=" AI helps you plan, summarize, and forecast." />
      <div className="grid gap-4 p-5 md:p-8 lg:grid-cols-[260px_1fr]">
        <div className="space-y-2">
          {tools.map((t) => (
            <button key={t.id} onClick={() => setActiveTool(t.id)} className={`w-full rounded-lg border p-3 text-left transition-colors ${activeTool === t.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
              <div className="flex items-center gap-2">
                <t.icon className={`h-4 w-4 ${activeTool === t.id ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-medium">{t.title}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
            </button>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> {tools.find((t) => t.id === activeTool)?.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea rows={6} placeholder="Describe what you need help with…" value={brief} onChange={(e) => setBrief(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={run} disabled={loading || !brief.trim()}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate</>}
              </Button>
            </div>
            {output && (
              <div className="rounded-lg border bg-muted/40 p-4">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">{output}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
