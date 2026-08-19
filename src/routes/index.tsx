import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import {
  PRIORITIES,
  STATUSES,
  createTask,
  deleteTask,
  fetchStats,
  fetchTasks,
  updateTask,
  type Task,
  type TaskInput,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks";
import { Analytics } from "@/components/tasks/Analytics";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Moon, Plus, Search, Sun } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tasklane — Task Tracker with Progress Analytics" },
      {
        name: "description",
        content: "Create, filter and track tasks by status, priority and due date, with live analytics on completion and pending work.",
      },
      { property: "og:title", content: "Tasklane — Task Tracker with Progress Analytics" },
      { property: "og:description", content: "Create, filter and track tasks with live progress analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const PAGE_SIZE = 5;
const EMPTY_STATS = { total: 0, done: 0, inProgress: 0, todo: 0, pending: 0, completion: 0 };

function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [priority, setPriority] = useState<TaskPriority | "all">("all");
  const [sort, setSort] = useState<"created_at" | "due_date" | "priority">("created_at");
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const stored = localStorage.getItem("tasklane-theme") === "dark";
    setDark(stored);
    document.documentElement.classList.toggle("dark", stored);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("tasklane-theme", next ? "dark" : "light");
  }

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [list, s] = await Promise.all([
        fetchTasks({ search, status, priority, sort, page, pageSize: PAGE_SIZE }),
        fetchStats(),
      ]);
      setTasks(list.tasks);
      setTotal(list.total);
      setStats(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }, [user, search, status, priority, sort, page]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status, priority, sort]);

  async function handleSubmit(input: TaskInput) {
    if (!user) return;
    if (editing) await updateTask(editing.id, input);
    else await createTask(input, user.id);
    await load();
  }

  async function handleToggle(task: Task) {
    await updateTask(task.id, { status: task.status === "done" ? "todo" : "done" });
    await load();
  }

  async function handleDelete(task: Task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await deleteTask(task.id);
    await load();
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Tasklane</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label="Toggle dark mode">
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
            >
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Your tasks</h1>
            <p className="mt-1 text-sm text-muted-foreground">Plan the work, then watch the numbers move.</p>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="size-4" /> New task
          </Button>
        </div>

        <Analytics stats={stats} />

        <section className="space-y-4">
          <div className="panel flex flex-wrap items-center gap-3 p-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by title"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus | "all")}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority | "all")}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Newest first</SelectItem>
                <SelectItem value="due_date">Due date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <TaskList
            tasks={tasks}
            loading={loading}
            onToggleDone={handleToggle}
            onEdit={(t) => { setEditing(t); setDialogOpen(true); }}
            onDelete={handleDelete}
          />

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{total} task{total === 1 ? "" : "s"}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span>Page {page} of {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </section>
      </main>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editing} onSubmit={handleSubmit} />
    </div>
  );
}
