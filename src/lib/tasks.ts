import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];

export const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export type TaskInput = {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
};

export type TaskQuery = {
  search: string;
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  sort: "created_at" | "due_date" | "priority";
  page: number;
  pageSize: number;
};

const PRIORITY_ORDER: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

export async function fetchTasks(q: TaskQuery) {
  let query = supabase.from("tasks").select("*", { count: "exact" });

  if (q.status !== "all") query = query.eq("status", q.status);
  if (q.priority !== "all") query = query.eq("priority", q.priority);
  if (q.search.trim()) query = query.ilike("title", `%${q.search.trim()}%`);

  if (q.sort === "due_date") {
    query = query.order("due_date", { ascending: true, nullsFirst: false });
  } else if (q.sort === "priority") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const from = (q.page - 1) * q.pageSize;
  const { data, error, count } = await query.range(from, from + q.pageSize - 1);
  if (error) throw error;

  const rows = q.sort === "priority"
    ? [...(data ?? [])].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    : (data ?? []);

  return { tasks: rows as Task[], total: count ?? 0 };
}

export async function fetchStats() {
  const { data, error } = await supabase.from("tasks").select("status");
  if (error) throw error;
  const total = data.length;
  const done = data.filter((t) => t.status === "done").length;
  const inProgress = data.filter((t) => t.status === "in_progress").length;
  const todo = data.filter((t) => t.status === "todo").length;
  return {
    total,
    done,
    inProgress,
    todo,
    pending: total - done,
    completion: total ? Math.round((done / total) * 100) : 0,
  };
}

export async function createTask(input: TaskInput, userId: string) {
  const { error } = await supabase.from("tasks").insert({ ...input, user_id: userId });
  if (error) throw error;
}

export async function updateTask(id: string, input: Partial<TaskInput>) {
  const { error } = await supabase.from("tasks").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
