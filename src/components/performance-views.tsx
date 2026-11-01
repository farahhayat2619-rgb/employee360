"use client";

import { Award, MessageSquarePlus, Plus, Star, Target, TrendingUp } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { addReview, assignGoal, updateGoalProgress } from "@/app/actions/performance";
import { formatDate } from "@/lib/sample-data";
import type { ActionResult, GoalView, ReviewView, TeamMemberPerf } from "@/lib/types";
import { Modal, Tabs, useToast, keepOnSubmit } from "./client-ui";
import { Avatar, Badge, buttonClass, Card, DataTable, Field, inputClass, PageHeader, Progress, StatCard } from "./ui";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1 text-sm font-semibold text-navy-900">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`size-4 ${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-line"}`} />
      ))}
      <span className="ml-1">{rating}</span>
    </span>
  );
}

function Err({ state }: { state: ActionResult }) {
  return state && !state.ok ? (
    <p className="rounded-lg bg-bad-50 px-4 py-3 text-sm text-bad" role="alert">
      {state.message}
    </p>
  ) : null;
}

/* ---------------- Employee ---------------- */

export function MyGoals({ goals, reviews, manager, today }: { goals: GoalView[]; reviews: ReviewView[]; manager: string | null; today: string }) {
  const [edit, setEdit] = useState<GoalView | null>(null);
  const [value, setValue] = useState(0);
  const [pending, start] = useTransition();
  const { show, toast } = useToast();
  const avg = goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;
  const monthly = goals.filter((g) => g.period === "Monthly");
  const annual = goals.filter((g) => g.period === "Annual");
  const latest = reviews[0];

  const save = () =>
    edit &&
    start(async () => {
      const r = await updateGoalProgress(edit.id, value);
      if (r) show(r.message);
      if (r?.ok) setEdit(null);
    });

  const list = (items: GoalView[]) => (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((g) => {
        const done = g.progress === 100;
        const overdue = !done && g.due < today;
        return (
          <Card key={g.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-navy-900">{g.title}</p>
                <p className="mt-0.5 text-xs text-ink-faint">Due {formatDate(g.due)}</p>
              </div>
              <Badge tone={done ? "good" : overdue ? "bad" : "blue"}>{done ? "Achieved" : overdue ? "Overdue" : "In progress"}</Badge>
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
              <Progress value={g.progress} tone={done ? "good" : "blue"} />
              <span className="w-10 text-right text-sm font-semibold tabular-nums">{g.progress}%</span>
            </div>
            {!done && (
              <button
                className={`${buttonClass("outline", "sm")} mt-4`}
                onClick={() => {
                  setEdit(g);
                  setValue(g.progress);
                }}
              >
                Update progress
              </button>
            )}
          </Card>
        );
      })}
      {items.length === 0 && <p className="col-span-full py-10 text-center text-sm text-ink-faint">No goals here yet.</p>}
    </div>
  );

  return (
    <>
      <PageHeader title="Goals & Performance" subtitle={manager ? `Goals and KPIs set with your manager, ${manager}.` : "Goals and KPIs set by HR."} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Goal completion" value={`${avg}%`} hint={`${goals.length} goals`} icon={Target} tone="blue" />
        <StatCard label="Monthly goals" value={monthly.length} hint={`${monthly.filter((g) => g.progress === 100).length} achieved`} icon={TrendingUp} tone="navy" />
        <StatCard label="Annual goals" value={annual.length} hint={`${annual.filter((g) => g.progress === 100).length} achieved`} icon={Award} tone="navy" />
        <StatCard label="Latest rating" value={latest ? `${latest.rating} / 5` : "—"} hint={latest?.period ?? "No review yet"} icon={Star} tone="good" />
      </div>
      <Tabs
        tabs={[
          { id: "m", label: "Monthly goals", content: list(monthly) },
          { id: "a", label: "Annual goals", content: list(annual) },
          {
            id: "r",
            label: "Reviews & feedback",
            content: (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <Card key={r.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-navy-900">{r.period} review</p>
                      <Stars rating={r.rating} />
                    </div>
                    <blockquote className="mt-3 border-l-2 border-accent-500 pl-4 text-sm text-ink-soft">{r.feedback}</blockquote>
                    <p className="mt-2 text-xs text-ink-faint">
                      {r.reviewer} · {formatDate(r.date)}
                    </p>
                  </Card>
                ))}
                {reviews.length === 0 && <p className="py-10 text-center text-sm text-ink-faint">No reviews yet.</p>}
              </div>
            ),
          },
        ]}
      />
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit ? `Update: ${edit.title}` : ""}>
        <div className="space-y-4">
          <Field label={`Progress: ${value}%`}>
            <input type="range" min={0} max={100} step={5} value={value} onChange={(e) => setValue(Number(e.target.value))} className="w-full accent-accent-600" aria-label="Goal progress" />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass("outline")} onClick={() => setEdit(null)}>
              Cancel
            </button>
            <button disabled={pending} className={buttonClass("primary")} onClick={save}>
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Modal>
      {toast}
    </>
  );
}

/* ---------------- Management / HR ---------------- */

export function PerformanceBoard({ rows, scopeDept, today }: { rows: TeamMemberPerf[]; scopeDept: string | null; today: string }) {
  const [goalFor, setGoalFor] = useState<{ id: string; round: number } | null>(null);
  const [reviewFor, setReviewFor] = useState<{ id: string; round: number } | null>(null);
  const { show, toast } = useToast();
  const done = (m: string) => {
    setGoalFor(null);
    setReviewFor(null);
    show(m);
  };

  return (
    <>
      <Card
        title={scopeDept ? `${scopeDept} team` : "Everyone"}
        action={
          <button className={buttonClass("primary", "sm")} onClick={() => setGoalFor({ id: "", round: Date.now() })}>
            <Plus className="size-3.5" /> Assign goal
          </button>
        }
        pad={false}
      >
        <DataTable
          rows={rows}
          rowKey={(e) => e.id}
          empty="Nobody in your team yet."
          columns={[
            {
              key: "n",
              header: "Employee",
              cell: (e) => (
                <span className="flex items-center gap-3">
                  <Avatar name={e.name} size="sm" />
                  <span>
                    <span className="block font-medium whitespace-nowrap text-navy-900">{e.name}</span>
                    <span className="text-xs text-ink-faint">{e.designation}</span>
                  </span>
                </span>
              ),
            },
            { key: "d", header: "Department", cell: (e) => <span className="whitespace-nowrap">{e.department}</span> },
            { key: "g", header: "Goals", cell: (e) => e.goals },
            {
              key: "c",
              header: "Goal completion",
              cell: (e) =>
                e.avgProgress !== null ? (
                  <span className="flex w-32 items-center gap-2">
                    <Progress value={e.avgProgress} />
                    <span className="text-xs tabular-nums">{e.avgProgress}%</span>
                  </span>
                ) : (
                  <span className="text-xs whitespace-nowrap text-ink-faint">No goals yet</span>
                ),
            },
            {
              key: "r",
              header: "Latest review",
              cell: (e) => (e.rating !== null ? <Badge tone={e.rating >= 4 ? "good" : e.rating >= 3 ? "blue" : "warn"}>{e.rating} / 5 · {e.ratingPeriod}</Badge> : <span className="text-xs whitespace-nowrap text-ink-faint">Not reviewed</span>),
            },
            {
              key: "a",
              header: "",
              cell: (e) => (
                <span className="flex gap-1">
                  <button className={buttonClass("ghost", "sm")} onClick={() => setGoalFor({ id: e.id, round: Date.now() })} aria-label={`Assign goal to ${e.name}`} title="Assign goal">
                    <Target className="size-3.5" />
                  </button>
                  <button className={buttonClass("ghost", "sm")} onClick={() => setReviewFor({ id: e.id, round: Date.now() })} aria-label={`Write review for ${e.name}`} title="Write review">
                    <MessageSquarePlus className="size-3.5" />
                  </button>
                </span>
              ),
            },
          ]}
        />
      </Card>
      <Modal open={!!goalFor} onClose={() => setGoalFor(null)} title="Assign a goal">
        {goalFor && <GoalForm key={goalFor.round} rows={rows} preset={goalFor.id} today={today} onClose={() => setGoalFor(null)} onDone={done} />}
      </Modal>
      <Modal open={!!reviewFor} onClose={() => setReviewFor(null)} title="Write a performance review">
        {reviewFor && <ReviewForm key={reviewFor.round} rows={rows} preset={reviewFor.id} onClose={() => setReviewFor(null)} onDone={done} />}
      </Modal>
      {toast}
    </>
  );
}

function PersonSelect({ rows, preset }: { rows: TeamMemberPerf[]; preset: string }) {
  return (
    <Field label="Employee">
      <select name="employeeId" defaultValue={preset} required className={inputClass}>
        <option value="" disabled>
          Choose an employee
        </option>
        {rows.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name} ({e.id})
          </option>
        ))}
      </select>
    </Field>
  );
}

function Buttons({ onClose, pending, label }: { onClose: () => void; pending: boolean; label: string }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" className={buttonClass("outline")} onClick={onClose}>
        Cancel
      </button>
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? "Saving…" : label}
      </button>
    </div>
  );
}

function GoalForm({ rows, preset, today, onClose, onDone }: { rows: TeamMemberPerf[]; preset: string; today: string; onClose: () => void; onDone: (m: string) => void }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(async (p, f) => {
    const r = await assignGoal(p, f);
    if (r?.ok) onDone(r.message);
    return r;
  }, undefined);
  return (
    <form onSubmit={keepOnSubmit(action)} className="space-y-4">
      <PersonSelect rows={rows} preset={preset} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Period">
          <select name="period" className={inputClass}>
            <option value="MONTHLY">Monthly</option>
            <option value="ANNUAL">Annual</option>
          </select>
        </Field>
        <Field label="Due date">
          <input type="date" name="due" required min={today} className={inputClass} />
        </Field>
      </div>
      <Field label="Goal">
        <input name="title" required minLength={5} maxLength={120} className={inputClass} placeholder="e.g. Reduce complaint resolution time" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="KPI">
          <input name="kpi" required minLength={3} maxLength={80} className={inputClass} placeholder="Average days to resolve" />
        </Field>
        <Field label="Target">
          <input name="target" required maxLength={80} className={inputClass} placeholder="Under 3 days" />
        </Field>
      </div>
      <Err state={state} />
      <Buttons onClose={onClose} pending={pending} label="Assign goal" />
    </form>
  );
}

function ReviewForm({ rows, preset, onClose, onDone }: { rows: TeamMemberPerf[]; preset: string; onClose: () => void; onDone: (m: string) => void }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(async (p, f) => {
    const r = await addReview(p, f);
    if (r?.ok) onDone(r.message);
    return r;
  }, undefined);
  return (
    <form onSubmit={keepOnSubmit(action)} className="space-y-4">
      <PersonSelect rows={rows} preset={preset} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Review period">
          <input name="period" required defaultValue="H2 2026" maxLength={30} className={inputClass} />
        </Field>
        <Field label="Rating (1 to 5)">
          <select name="rating" defaultValue="4" className={inputClass}>
            {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Feedback">
        <textarea name="feedback" required minLength={10} maxLength={1000} rows={4} className={inputClass} placeholder="What went well, and what to focus on next" />
      </Field>
      <Err state={state} />
      <Buttons onClose={onClose} pending={pending} label="Save review" />
    </form>
  );
}
