import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { ProjectMembersDialog } from "@/components/app/ProjectMembersDialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, ArrowLeft, ListTodo, LayoutGrid, Calendar as CalIcon, GanttChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskDialog } from "@/components/app/TaskDialog";
import { KanbanBoard } from "@/components/app/KanbanBoard";
import { TaskList } from "@/components/app/TaskList";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  component: ProjectDetail,
});

function ProjectDetail() {
  
  console.log("PROJECT DETAIL PAGE LOADED");

  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  console.log("PROJECT ID =", projectId);
  const qc = useQueryClient();
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks = [], refetch } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  
  const updateStatus = async (taskId: string, status: string) => {
    const { error } = await supabase.from("tasks").update({ status: status as any }).eq("id", taskId);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["tasks", projectId] });
  };

  return (
    <div>
      <PageHeader
        title={project?.name ?? "Project"}
        description={project?.description ?? undefined}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/projects" })}>
              <ArrowLeft className="mr-2 h-4 w-4" /> All projects
            </Button>
            <Button onClick={() => { setEditingTaskId(null); setTaskOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> New task
            </Button>
          </>
        }
      />

      <div className="p-5 md:p-8">
        <Tabs defaultValue="kanban">
          <TabsList>
            <TabsTrigger value="kanban"><LayoutGrid className="mr-1.5 h-3.5 w-3.5" /> Kanban</TabsTrigger>
            <TabsTrigger value="list"><ListTodo className="mr-1.5 h-3.5 w-3.5" /> List</TabsTrigger>
            <TabsTrigger value="calendar"><CalIcon className="mr-1.5 h-3.5 w-3.5" /> Calendar</TabsTrigger>
            <TabsTrigger value="timeline"><GanttChart className="mr-1.5 h-3.5 w-3.5" /> Timeline</TabsTrigger>
          </TabsList>
          <TabsContent value="kanban" className="mt-4">
            <KanbanBoard
              tasks={tasks}
              onStatusChange={updateStatus}
              onTaskClick={(id) => { setEditingTaskId(id); setTaskOpen(true); }}
            />
          </TabsContent>
          <TabsContent value="list" className="mt-4">
            <TaskList
              tasks={tasks}
              onTaskClick={(id) => { setEditingTaskId(id); setTaskOpen(true); }}
            />
          </TabsContent>
          <TabsContent value="calendar" className="mt-4">
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Calendar view groups tasks by due date. {tasks.filter((t) => t.due_date).length} of {tasks.length} tasks have due dates.
            </Card>
          </TabsContent>
          <TabsContent value="timeline" className="mt-4">
            <Card className="p-6">
              <p className="mb-4 text-sm font-medium">Timeline / Gantt</p>
              <div className="space-y-2">
                {tasks.slice(0, 8).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 text-sm">
                    <span className="w-40 truncate text-muted-foreground">{t.title}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded bg-muted">
                      <div
                        className="h-full gradient-brand"
                        style={{ width: `${Math.max(15, ((t.story_points ?? 3) / 10) * 100)}%` }}
                      />
                    </div>
                    <Badge variant="outline" className="capitalize">{t.status.replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <TaskDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        projectId={projectId}
        taskId={editingTaskId}
        onSaved={() => refetch()}
      />
    </div>
  );
}
