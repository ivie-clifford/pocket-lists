import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { todayItems, fromISODate, activeTasks } from "@/lib/pocket/dates";
import { usePocket } from "@/lib/pocket/store";
import { ItemRow } from "@/components/pocket/ItemRow";
import { useToday } from "@/components/pocket/useToday";
import { useUI } from "@/components/pocket/ui-state";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Pocket Lists" },
      {
        name: "description",
        content: "Your checklist for today: what's due and anything left over.",
      },
      { property: "og:title", content: "Today — Pocket Lists" },
      {
        property: "og:description",
        content: "A calm, pocket-sized checklist notebook for everyday life.",
      },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const [view, setView] = useState<"Today" | "Upcoming" | "All">("Today");
  const { items, lists } = usePocket();
  const { openQuickAdd } = useUI();
  const today = useToday();
  const { overdue, due } = todayItems(items, lists, today);
  const all = activeTasks(items, lists);
  const visible = view === "Upcoming" ? all.filter((item) => !!item.due && item.due > today) : all;
  const listName = (id: string | null) => (id ? lists.find((l) => l.id === id)?.title : undefined);
  const total = overdue.length + due.length;
  const doneCount = due.filter((i) => i.done).length;
  const pct = total ? (doneCount / total) * 100 : 0;
  const dateLabel = fromISODate(today).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <section>
      <h1 className="mt-4 text-[2.5rem] leading-none">{view === "All" ? "All tasks" : view}</h1>
      <p className="mt-2 text-muted-foreground">{dateLabel}</p>

      <div className="mt-5 flex rounded-full bg-muted p-1" role="group" aria-label="Task views">
        {(["Today", "Upcoming", "All"] as const).map((name) => (
          <button
            key={name}
            onClick={() => setView(name)}
            aria-pressed={view === name}
            className={`h-11 flex-1 rounded-full text-[15px] ${view === name ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            {name}
          </button>
        ))}
      </div>
      {view !== "Today" && (
        <div className="mt-5">
          <p className="text-sm text-muted-foreground">
            {view === "Upcoming"
              ? "Tasks scheduled after today, from your lists and individual tasks."
              : "All tasks, including those without a date. Templates and archived lists are excluded."}
          </p>
          <div role="list" className="mt-3">
            {visible.map((item) => (
              <ItemRow key={item.id} item={item} listName={listName(item.listId)} />
            ))}
          </div>
          {!visible.length && (
            <p className="mt-8 text-center text-muted-foreground">
              {view === "Upcoming" ? "Nothing scheduled ahead." : "No tasks yet."}
            </p>
          )}
        </div>
      )}

      {view === "Today" && (
        <>
          {total > 0 && (
            <div className="mt-5" aria-label={`${doneCount} of ${total} done`}>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {doneCount} of {total} done
                </span>
                {doneCount === total && <span className="text-primary">All clear</span>}
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {overdue.length > 0 && (
            <div className="mt-7">
              <h2 className="font-sans text-sm font-medium tracking-wide text-overdue uppercase">
                Overdue
              </h2>
              <div role="list" className="mt-1">
                {overdue.map((i) => (
                  <ItemRow key={i.id} item={i} listName={listName(i.listId)} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-7">
            {overdue.length > 0 && due.length > 0 && (
              <h2 className="font-sans text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Due today
              </h2>
            )}
            <div role="list" className="mt-1">
              {due.map((i) => (
                <ItemRow key={i.id} item={i} listName={listName(i.listId)} />
              ))}
            </div>
          </div>

          {total === 0 && (
            <div className="mt-16 text-center">
              <p className="font-serif text-2xl italic text-ink-soft">A clear page.</p>
              <p className="mt-2 text-muted-foreground">Nothing due today.</p>
              <button
                onClick={() => openQuickAdd()}
                className="mt-6 h-12 rounded-full border border-border bg-card px-6"
              >
                Add something for today
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
