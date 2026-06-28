import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/app/PageHeader";
import { TaskList } from "@/components/app/TaskList";
import { EmptyState } from "@/components/app/EmptyState";
import { ListTodo } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: MyTasksPage,
});

function MyTasksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: tasks = [] } = useQuery({
    queryKey: ["my-tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*, projects(name)")
        .or(`assignee_id.eq.${user!.id},reporter_id.eq.${user!.id}`)
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader title="My Tasks" description="Tasks assigned to you or reported by you across all projects." />
      <div className="p-5 md:p-8">
        {tasks.length === 0 ? (
          <EmptyState icon={ListTodo} title="No tasks yet" description="Tasks you create or that get assigned to you will appear here." />
        ) : (
          <TaskList tasks={tasks} onTaskClick={(id) => {
            const t = tasks.find((x) => x.id === id);
            if (t) navigate({ to: "/projects/$projectId", params: { projectId: t.project_id } });
          }} />
        )}
      </div>
    </div>
  );
}
