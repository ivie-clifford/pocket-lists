import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { usePocket } from "@/lib/pocket/store";
import { useUI } from "@/components/pocket/ui-state";
import type { PocketList } from "@/lib/pocket/types";

export const Route = createFileRoute("/lists/")({
  head: () => ({
    meta: [
      { title: "Lists — Pocket Lists" },
      { name: "description", content: "All your active checklists in one place." },
      { property: "og:title", content: "Lists — Pocket Lists" },
      { property: "og:description", content: "All your active checklists in one place." },
    ],
  }),
  component: ListsPage,
});

export function ListLink({ list }: { list: PocketList }) {
  const { items } = usePocket();
  const mine = items.filter((i) => i.listId === list.id);
  const done = mine.filter((i) => i.done).length;
  return (
    <Link
      to="/lists/$listId"
      params={{ listId: list.id }}
      className="flex min-h-16 items-center gap-3 border-b border-border/70 py-3 last:border-b-0"
    >
      <div className="min-w-0 flex-1">
        <div className="font-serif text-xl leading-tight">{list.title}</div>
        <div className="mt-0.5 text-sm text-muted-foreground">
          {list.kind === "template"
            ? `${mine.length} items`
            : mine.length
              ? `${done} of ${mine.length} done`
              : "Empty"}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-ink-soft/50" />
    </Link>
  );
}

function ListsPage() {
  const { lists } = usePocket();
  const { openQuickAdd } = useUI();
  const [showArchived, setShowArchived] = useState(false);
  const active = lists
    .filter((l) => l.kind === "list" && !l.archived)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const archived = lists.filter((l) => l.kind === "list" && l.archived);

  return (
    <>
      <div className="hidden pt-32 text-center lg:block">
        <p className="font-serif text-2xl italic text-ink-soft">Pick a list on the left.</p>
        <button
          onClick={() => openQuickAdd({ mode: "list" })}
          className="mt-6 h-11 rounded-full border border-border bg-card px-5"
        >
          New list
        </button>
      </div>
      <section className="lg:hidden">
        <div className="mt-4 flex items-center justify-between gap-2">
          <h1 className="text-[2rem] leading-none sm:text-[2.5rem]">Lists</h1>
          <button
            onClick={() => openQuickAdd({ mode: "list" })}
            className="h-11 rounded-full border border-border bg-card px-3 text-sm"
          >
            New list
          </button>
        </div>
        <div className="mt-5">
          {active.map((l) => (
            <ListLink key={l.id} list={l} />
          ))}
        </div>
        {active.length === 0 && (
          <div className="mt-12 text-center">
            <p className="font-serif text-2xl italic text-ink-soft">No lists yet.</p>
            <p className="mt-2 text-muted-foreground">Start one, or use a template.</p>
          </div>
        )}
        {archived.length > 0 && (
          <div className="mt-10">
            <button
              onClick={() => setShowArchived((s) => !s)}
              className="h-11 text-sm text-muted-foreground"
            >
              {showArchived ? "Hide" : "Show"} archived ({archived.length})
            </button>
            {showArchived && (
              <div className="opacity-75">
                {archived.map((l) => (
                  <ListLink key={l.id} list={l} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
