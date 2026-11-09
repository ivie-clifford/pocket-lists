import { createFileRoute } from "@tanstack/react-router";
import { usePocket } from "@/lib/pocket/store";
import { useUI } from "@/components/pocket/ui-state";
import { ListLink } from "./lists.index";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Templates — Pocket Lists" },
      {
        name: "description",
        content: "Reusable checklists for packing, weekly resets, errands and more.",
      },
      { property: "og:title", content: "Templates — Pocket Lists" },
      {
        property: "og:description",
        content: "Reusable checklists for packing, weekly resets, errands and more.",
      },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const { lists } = usePocket();
  const { openQuickAdd } = useUI();
  const templates = lists.filter((l) => l.kind === "template").sort((a, b) => a.order - b.order);

  return (
    <section>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[2rem] leading-none sm:text-[2.5rem]">Templates</h1>
        <button
          type="button"
          onClick={() => openQuickAdd({ newTemplateTitle: "" })}
          className="h-11 rounded-full border border-border bg-card px-3 text-sm"
        >
          New template
        </button>
      </div>
      <p className="mt-3 text-muted-foreground">
        Reusable checklists. Create a fresh list whenever you need one.
      </p>
      <div className="mt-5">
        {templates.map((l) => (
          <ListLink key={l.id} list={l} />
        ))}
      </div>
    </section>
  );
}
