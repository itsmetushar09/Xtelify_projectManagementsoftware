import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  due_date?: string | null;
  story_points?: number | null;
}

export function TaskList({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (id: string) => void }) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="w-24">Type</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-24">Priority</TableHead>
            <TableHead className="w-20">Points</TableHead>
            <TableHead className="w-32">Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t) => (
            <TableRow
              key={t.id}
              className="cursor-pointer"
              onClick={() => onTaskClick(t.id)}
            >
              <TableCell className="font-medium">{t.title}</TableCell>
              <TableCell><Badge variant="secondary" className="capitalize">{t.type}</Badge></TableCell>
              <TableCell><Badge variant="outline" className="capitalize">{t.status.replace("_", " ")}</Badge></TableCell>
              <TableCell><Badge variant="secondary" className="capitalize">{t.priority}</Badge></TableCell>
              <TableCell>{t.story_points ?? "—"}</TableCell>
              <TableCell>{t.due_date ? new Date(t.due_date).toLocaleDateString() : "—"}</TableCell>
            </TableRow>
          ))}
          {tasks.length === 0 && (
            <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No tasks yet</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
