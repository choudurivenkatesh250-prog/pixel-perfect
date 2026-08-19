import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2 } from "lucide-react";
import type { Task, TaskPriority, TaskStatus } from "@/lib/tasks";

const statusLabel: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

function priorityClass(p: TaskPriority) {
  if (p === "high") return "border-destructive/40 text-destructive";
  if (p === "medium") return "border-accent/60 text-accent-foreground bg-accent/20";
  return "border-border text-muted-foreground";
}

function statusClass(s: TaskStatus) {
  if (s === "done") return "border-success/40 text-success";
  if (s === "in_progress") return "border-primary/40 text-primary";
  return "border-border text-muted-foreground";
}

type Props = {
  tasks: Task[];
  loading: boolean;
  onToggleDone: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

export function TaskList({ tasks, loading, onToggleDone, onEdit, onDelete }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="panel p-10 text-center">
        <p className="text-sm font-medium">No tasks here yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Create a task or adjust your filters.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <li key={task.id} className="panel flex items-start gap-4 p-4">
          <Checkbox
            className="mt-1"
            checked={task.status === "done"}
            onCheckedChange={() => onToggleDone(task)}
            aria-label={`Mark ${task.title} as completed`}
          />
          <div className="min-w-0 flex-1">
            <p className={`truncate font-medium ${task.status === "done" ? "text-muted-foreground line-through" : ""}`}>
              {task.title}
            </p>
            {task.description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={statusClass(task.status)}>{statusLabel[task.status]}</Badge>
              <Badge variant="outline" className={priorityClass(task.priority)}>{task.priority}</Badge>
              {task.due_date && (
                <span className="text-xs text-muted-foreground">
                  Due {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button size="icon" variant="ghost" onClick={() => onEdit(task)} aria-label="Edit task">
              <Pencil className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(task)} aria-label="Delete task">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
