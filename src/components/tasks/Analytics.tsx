import { Progress } from "@/components/ui/progress";

type Stats = {
  total: number;
  done: number;
  inProgress: number;
  todo: number;
  pending: number;
  completion: number;
};

function StatCard({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="panel p-4">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tone ?? "text-foreground"}`}>{value}</p>
    </div>
  );
}

export function Analytics({ stats }: { stats: Stats }) {
  const bars = [
    { label: "Todo", value: stats.todo, color: "bg-muted-foreground/50" },
    { label: "In Progress", value: stats.inProgress, color: "bg-accent" },
    { label: "Done", value: stats.done, color: "bg-success" },
  ];
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <section aria-label="Analytics" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total tasks" value={stats.total} />
        <StatCard label="Completed" value={stats.done} tone="text-success" />
        <StatCard label="Pending" value={stats.pending} tone="text-accent" />
        <StatCard label="Completion" value={`${stats.completion}%`} tone="text-primary" />
      </div>

      <div className="panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Progress overview</h2>
          <span className="text-xs text-muted-foreground">{stats.done} of {stats.total} done</span>
        </div>
        <Progress value={stats.completion} className="mt-3" />
        <div className="mt-6 space-y-3">
          {bars.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-muted-foreground">{b.label}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                <div className={`h-full rounded-full ${b.color}`} style={{ width: `${(b.value / max) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">{b.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
