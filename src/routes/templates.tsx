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
      <h1 className="mt-4 text-[2.5rem] leading-none">Templates</h1>
      <p className="mt-2 text-muted-foreground">
        Reusable checklists. Create a fresh list whenever you need one.
      </p>
      <button
        type="button"
        onClick={() => openQuickAdd({ newTemplateTitle: "" })}
        className="mt-4 hidden h-11 items-center rounded-full bg-primary px-5 text-primary-foreground lg:inline-flex"
      >
        New template
      </button>
      <div className="mt-5">
        {templates.map((l) => (
          <ListLink key={l.id} list={l} />
        ))}
      </div>
    </section>
  );
}
