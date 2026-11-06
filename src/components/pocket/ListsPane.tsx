import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { usePocket } from "@/lib/pocket/store";
import { useUI } from "./ui-state";
import type { PocketList } from "@/lib/pocket/types";

/** Desktop-only middle column for the current section. */
export function ListsPane({ kind }: { kind: "list" | "template" }) {
  const { lists, items } = usePocket();
  const { openQuickAdd } = useUI();
  const active = lists
    .filter((l) => l.kind === kind && !l.archived)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const isTemplate = kind === "template";

  const row = (l: PocketList) => {
    const mine = items.filter((i) => i.listId === l.id);
    const done = mine.filter((i) => i.done).length;
    return (
      <Link
        key={l.id}
        to="/lists/$listId"
        params={{ listId: l.id }}
        className="block rounded-lg px-3 py-2.5 hover:bg-muted data-[status=active]:bg-accent data-[status=active]:text-accent-foreground"
      >
        <div className="truncate font-serif text-lg leading-tight">{l.title}</div>
        <div className="text-xs text-muted-foreground">
          {l.kind === "template"
            ? `${mine.length} items`
            : mine.length
              ? `${done} of ${mine.length} done`
              : "Empty"}
        </div>
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-60 z-30 hidden w-80 flex-col overflow-y-auto border-r border-border bg-card/40 px-3 py-6 lg:flex">
      <div className="flex items-center justify-between px-3">
        <Link
          to={isTemplate ? "/templates" : "/lists"}
          activeOptions={{ exact: true }}
          className="font-serif text-2xl"
        >
          {isTemplate ? "Templates" : "Lists"}
        </Link>
        <button
          onClick={() => openQuickAdd(isTemplate ? { newTemplateTitle: "" } : { mode: "list" })}
          aria-label={isTemplate ? "New template" : "New list"}
          className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-muted"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-0.5">{active.map(row)}</div>
      {active.length === 0 && (
        <p className="px-3 text-sm text-muted-foreground">
          No {isTemplate ? "templates" : "lists"} yet.
        </p>
      )}
    </aside>
  );
}
