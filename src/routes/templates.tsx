import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { usePocket } from "@/lib/pocket/store";
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
  const { lists, createList } = usePocket();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const templates = lists.filter((l) => l.kind === "template").sort((a, b) => a.order - b.order);

  return (
    <section>
      <h1 className="mt-4 text-[2.5rem] leading-none">Templates</h1>
      <p className="mt-2 text-muted-foreground">Reusable lists. Open one and tap “Start list”.</p>
      <div className="mt-5">
        {templates.map((l) => (
          <ListLink key={l.id} list={l} />
        ))}
      </div>
      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          const l = createList(title.trim(), "template");
          navigate({ to: "/lists/$listId", params: { listId: l.id } });
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New template name"
          className="h-12 min-w-0 flex-1 rounded-full border border-input bg-card px-5 outline-none focus:border-ring"
        />
        <button
          className="h-12 rounded-full bg-primary px-5 text-primary-foreground disabled:opacity-50"
          disabled={!title.trim()}
        >
          Create
        </button>
      </form>
    </section>
  );
}
