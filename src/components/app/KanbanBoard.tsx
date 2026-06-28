import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

const columns = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "code_review", label: "Code review" },
  { id: "qa_testing", label: "QA" },
  { id: "done", label: "Done" },
] as const;

const priorityDot = {
  low: "bg-muted-foreground",
  medium: "bg-info",
  high: "bg-warning",
  urgent: "bg-destructive",
} as const;

const typeColor = {
  epic: "bg-accent text-accent-foreground",
  story: "bg-success/15 text-success",
  bug: "bg-destructive/15 text-destructive",
  task: "bg-info/15 text-info",
  subtask: "bg-muted text-muted-foreground",
} as const;

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  story_points?: number | null;
  labels?: string[] | null;
}

interface Props {
  tasks: Task[];
  onStatusChange: (id: string, status: string) => void;
  onTaskClick: (id: string) => void;
}

export function KanbanBoard({ tasks, onStatusChange, onTaskClick }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId) onStatusChange(dragId, col.id);
              setDragId(null);
            }}
            className="flex min-w-72 flex-1 flex-col rounded-xl bg-muted/40 p-2"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {col.label}
              </span>
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {colTasks.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {colTasks.map((t) => (
                <Card
                  key={t.id}
                  draggable
                  onDragStart={() => setDragId(t.id)}
                  onDragEnd={() => setDragId(null)}
                  onClick={() => onTaskClick(t.id)}
                  className="cursor-pointer border-border/60 p-3 transition-shadow hover:shadow-md"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="secondary" className={cn("h-5 px-1.5 text-[10px] capitalize", typeColor[t.type as keyof typeof typeColor])}>
                      {t.type}
                    </Badge>
                    <span className={cn("ml-auto h-2 w-2 rounded-full", priorityDot[t.priority as keyof typeof priorityDot])} />
                  </div>
                  <p className="text-sm font-medium leading-snug">{t.title}</p>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                    {t.story_points && <span>{t.story_points} pts</span>}
                    {t.labels?.slice(0, 2).map((l) => (
                      <span key={l} className="rounded bg-muted px-1.5 py-0.5">{l}</span>
                    ))}
                  </div>
                </Card>
              ))}
              {colTasks.length === 0 && (
                <div className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
