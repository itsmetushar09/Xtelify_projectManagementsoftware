import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  projectId: string;
  taskId: string | null;
  onSaved: () => void;
}

export function TaskDialog({ open, onOpenChange, projectId, taskId, onSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "task" as "epic" | "story" | "bug" | "task" | "subtask",
    status: "backlog" as "backlog" | "todo" | "in_progress" | "code_review" | "qa_testing" | "done",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    story_points: "" as string,
    due_date: "",
    labels: "",
  });
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [assigneeId, setAssigneeId] = useState("");
  useEffect(() => {
  const loadMembers = async () => {
    const { data, error } = await supabase
  .from("project_members")
  .select(`
    user_id,
    profiles:user_id (
      full_name,
      email
    )
  `)
  .eq("project_id", projectId);

if (error) {
  console.error(error);
  return;
}

setMembers(data ?? []);

    setMembers(data ?? []);
  };

  if (open) loadMembers();
}, [open, projectId]);

  useEffect(() => {
    if (!open) return;
    if (taskId) {
      (async () => {
        const { data } = await supabase.from("tasks").select("*").eq("id", taskId).single();
        if (data) {
  setForm({
    title: data.title,
    description: data.description ?? "",
    type: data.type,
    status: data.status,
    priority: data.priority,
    story_points: data.story_points?.toString() ?? "",
    due_date: data.due_date ?? "",
    labels: data.labels?.join(", ") ?? "",
  });

  setAssigneeId(data.assignee_id ?? "");
}
        const { data: c } = await supabase
          .from("task_comments")
          .select("*")
          .eq("task_id", taskId)
          .order("created_at", { ascending: true });
        setComments(c ?? []);
      })();
    } else {
  setForm({
    title: "",
    description: "",
    type: "task",
    status: "backlog",
    priority: "medium",
    story_points: "",
    due_date: "",
    labels: "",
  });

  setComments([]);
  setAssigneeId("");
}
  }, [open, taskId]);



  
  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
  project_id: projectId,
  title: form.title.trim(),
  description: form.description,
  type: form.type,
  status: form.status,
  priority: form.priority,
  story_points: form.story_points
    ? Number(form.story_points)
    : null,
  due_date: form.due_date || null,
  labels: form.labels
    ? form.labels
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null,

  reporter_id: user?.id ?? null,
  assignee_id: assigneeId || null,
};
    const { error } = taskId
      ? await supabase.from("tasks").update(payload).eq("id", taskId)
      : await supabase.from("tasks").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(taskId ? "Task updated" : "Task created");
    onOpenChange(false);
    onSaved();
  };

  const addComment = async () => {
    if (!newComment.trim() || !taskId || !user) return;
    const { error, data } = await supabase
      .from("task_comments")
      .insert({ task_id: taskId, author_id: user.id, body: newComment.trim() })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setComments((c) => [...c, data!]);
    setNewComment("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{taskId ? "Edit task" : "Create task"}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments" disabled={!taskId}>Comments {comments.length > 0 && `(${comments.length})`}</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-3 pt-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="epic">Epic</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="subtask">Subtask</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="todo">To do</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="code_review">Code review</SelectItem>
                    <SelectItem value="qa_testing">QA</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
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
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
  <Label>Assignee</Label>

  <Select
    value={assigneeId}
    onValueChange={setAssigneeId}
  >
    <SelectTrigger>
      <SelectValue placeholder="Assign user" />
    </SelectTrigger>

    <SelectContent>
      {members.map((m: any) => {
  const profile = Array.isArray(m.profiles)
    ? m.profiles[0]
    : m.profiles;

  return (
    <SelectItem
      key={m.user_id}
      value={m.user_id}
    >
      {profile?.full_name ||
        profile?.email ||
        "Unknown User"}
    </SelectItem>
  );
})}
    </SelectContent>
  </Select>
</div>
              <div className="space-y-1.5">
                <Label>Points</Label>
                <Input type="number" min={0} value={form.story_points} onChange={(e) => setForm((f) => ({ ...f, story_points: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Labels (comma separated)</Label>
                <Input value={form.labels} onChange={(e) => setForm((f) => ({ ...f, labels: e.target.value }))} placeholder="frontend, urgent" />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="comments" className="space-y-3 pt-4">
            <div className="max-h-64 space-y-3 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg bg-muted/50 p-3">
                  <div className="mb-1 text-[11px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div>
                  <div className="text-sm">{c.body}</div>
                </div>
              ))}
              {comments.length === 0 && <p className="text-center text-sm text-muted-foreground">No comments yet</p>}
            </div>
            <div className="flex gap-2">
              <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment…" onKeyDown={(e) => { if (e.key === "Enter") addComment(); }} />
              <Button onClick={addComment}>Send</Button>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.title.trim()}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
