import { ChevronRight, Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import type { SearchGroup } from "@/lib/search";
import { buttonClass, Card, PageHeader } from "./ui";

export function SearchResults({ q, groups, action }: { q: string; groups: SearchGroup[]; action: string }) {
  const total = groups.reduce((s, g) => s + g.hits.length, 0);
  return (
    <>
      <PageHeader title="Search" subtitle={q.length < 2 ? "Find pages, people, policies and tickets." : `${total} result${total === 1 ? "" : "s"} for “${q}”`} />
      <Form action={action} role="search" className="mb-6 flex gap-2">
        <input type="search" name="q" defaultValue={q} minLength={2} maxLength={80} required placeholder="Search" aria-label="Search for" className="w-full max-w-md rounded-lg border border-line bg-surface px-3 py-2 text-sm" />
        <button type="submit" className={buttonClass("primary")}>
          <Search className="size-4" /> Search
        </button>
      </Form>
      {q.length >= 2 && total === 0 && (
        <Card>
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Search className="size-6 text-ink-faint" />
            <p className="text-sm text-ink-soft">Nothing matched. Try a name, an employee ID, a ticket ID or a policy title.</p>
          </div>
        </Card>
      )}
      <div className="space-y-6">
        {groups.map((g) => (
          <Card key={g.label} title={g.label} pad={false}>
            <ul className="divide-y divide-line">
              {g.hits.map((h) => (
                <li key={h.href + h.title}>
                  <Link href={h.href} className="flex items-center gap-3 px-5 py-3 hover:bg-navy-50/50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-navy-900">{h.title}</span>
                      <span className="block truncate text-xs text-ink-faint">{h.detail}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-ink-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
