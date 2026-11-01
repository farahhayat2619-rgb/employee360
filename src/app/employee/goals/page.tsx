import { Award, Star, Target, TrendingUp } from "lucide-react";
import { Tabs } from "@/components/client-ui";
import { Badge, Card, PageHeader, Progress, StatCard } from "@/components/ui";
import { currentUsers, formatDate, goals, reviews, type Goal } from "@/lib/sample-data";

function GoalList({ list }: { list: Goal[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {list.map((g) => (
        <Card key={g.id}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-navy-900">{g.title}</p>
              <p className="mt-0.5 text-xs text-ink-faint">Due {formatDate(g.due)}</p>
            </div>
            <Badge tone={g.progress === 100 ? "good" : g.progress >= 60 ? "blue" : "warn"}>{g.progress === 100 ? "Achieved" : "On track"}</Badge>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-ink-faint">KPI</dt>
              <dd>{g.kpi}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-faint">Target</dt>
              <dd>{g.target}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-center gap-3">
            <Progress value={g.progress} tone={g.progress === 100 ? "good" : "blue"} />
            <span className="w-10 text-right text-sm font-semibold tabular-nums">{g.progress}%</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function GoalsPage() {
  const mine = goals.filter((g) => g.employeeId === currentUsers.employee);
  const avg = Math.round(mine.reduce((s, g) => s + g.progress, 0) / mine.length);
  const monthly = mine.filter((g) => g.period === "Monthly");
  const annual = mine.filter((g) => g.period === "Annual");

  return (
    <>
      <PageHeader title="Goals & Performance" subtitle="Goals and KPIs set with your manager, Imran Siddiqui." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Goal completion" value={`${avg}%`} hint="All active goals" icon={Target} tone="blue" />
        <StatCard label="Monthly goals" value={monthly.length} hint={`${monthly.filter((g) => g.progress === 100).length} achieved`} icon={TrendingUp} tone="navy" />
        <StatCard label="Annual goals" value={annual.length} hint="2026" icon={Award} tone="navy" />
        <StatCard label="Latest rating" value={`${reviews[0].rating} / 5`} hint={reviews[0].period} icon={Star} tone="good" />
      </div>
      <Tabs
        tabs={[
          { id: "m", label: "Monthly goals", content: <GoalList list={monthly} /> },
          { id: "a", label: "Annual goals", content: <GoalList list={annual} /> },
          {
            id: "r",
            label: "Reviews & feedback",
            content: (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <Card key={r.period}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-navy-900">{r.period} review</p>
                      <span className="flex items-center gap-1 text-sm font-semibold text-navy-900">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`size-4 ${i < Math.round(r.rating) ? "fill-amber-400 text-amber-400" : "text-line"}`} />
                        ))}
                        <span className="ml-1">{r.rating}</span>
                      </span>
                    </div>
                    <blockquote className="mt-3 border-l-2 border-accent-500 pl-4 text-sm text-ink-soft">{r.feedback}</blockquote>
                    <p className="mt-2 text-xs text-ink-faint">Manager feedback · {r.reviewer}</p>
                  </Card>
                ))}
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
