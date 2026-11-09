import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { dueLabel } from "@/lib/pocket/dates";
import { parseDue, parsePastedList } from "@/lib/pocket/parse";
import { usePocket } from "@/lib/pocket/store";
import { cn } from "@/lib/utils";
import { chip } from "./ItemSheet";
import { useToday } from "./useToday";

type Kind = "task" | "list" | "template";
export interface QuickAddOpts {
  listId?: string;
  /** Paste remains an internal shortcut for the existing-list Paste items action. */
  mode?: Kind | "paste";
  newTemplateTitle?: string;
}

type Draft = { name: string; text: string; pasting: boolean };
const emptyDrafts = (): Record<Kind, Draft> => ({
  task: { name: "", text: "", pasting: false },
  list: { name: "", text: "", pasting: false },
  template: { name: "", text: "", pasting: false },
});

/** Items pasted into a template are undated blueprints. */
export function toTemplateDrafts<T extends { due?: string; dueKind?: unknown }>(lines: T[]) {
  return lines.map(({ due: _d, dueKind: _k, ...rest }) => rest);
}

const inputCls =
  "w-full rounded-2xl border border-input bg-card px-4 text-base outline-none placeholder:text-muted-foreground focus:border-ring";

export function QuickAdd({
  open,
  opts,
  onClose,
}: {
  open: boolean;
  opts: QuickAddOpts;
  onClose: () => void;
}) {
  const { lists, addItems, createList } = usePocket();
  const navigate = useNavigate();
  const today = useToday();
  const [kind, setKind] = useState<Kind>("task");
  const [drafts, setDrafts] = useState(emptyDrafts);
  const [target, setTarget] = useState("");
  const [when, setWhen] = useState<"none" | "today" | "tomorrow" | "this week">("today");
  const itemsRef = useRef<HTMLTextAreaElement>(null);
  const existing = lists.find((list) => list.id === opts.listId);
  const append = opts.mode === "paste" && !!existing;
  const existingKind = existing?.kind;

  useEffect(() => {
    if (!open) return;
    const initial: Kind =
      opts.newTemplateTitle !== undefined || opts.mode === "template"
        ? "template"
        : opts.mode === "list"
          ? "list"
          : opts.mode === "paste" && existingKind === "template"
            ? "template"
            : "task";
    const next = emptyDrafts();
    next.template.name = opts.newTemplateTitle ?? "";
    next[initial].pasting = opts.mode === "paste";
    setDrafts(next);
    setKind(initial);
    setTarget(opts.listId ?? "");
    setWhen(opts.listId ? "none" : "today");
  }, [open, opts, existingKind]);

  const draft = drafts[kind];
  const updateDraft = (changes: Partial<Draft>) =>
    setDrafts((current) => ({
      ...current,
      [kind]: { ...current[kind], ...changes },
    }));
  const parsed = useMemo(() => parsePastedList(draft.text, today), [draft.text, today]);
  const templateItems = kind === "template";
  const multiple = kind !== "task" || draft.pasting || append;
  const needsName = kind !== "task" && !append;
  const activeLists = lists.filter((list) => list.kind === "list" && !list.archived);
  const startPaste = () => {
    updateDraft({ pasting: true });
    requestAnimationFrame(() => itemsRef.current?.focus({ preventScroll: true }));
  };

  const save = () => {
    if (needsName && !draft.name.trim()) return;
    if (!needsName && !(multiple ? parsed.length : draft.text.trim())) return;
    let listId: string | null = append ? existing!.id : kind === "task" ? target || null : null;
    if (needsName)
      listId = createList(draft.name.trim(), kind === "template" ? "template" : "list").id;
    const lines = multiple ? parsed : [{ text: draft.text.trim() }];
    const fallbackDue = kind === "task" && when !== "none" ? parseDue(when, today) : null;
    const prepared = templateItems
      ? toTemplateDrafts(lines)
      : lines.map((line) => ({ ...fallbackDue, ...line }));
    if (prepared.length) addItems(prepared.map((line) => ({ ...line, listId })));
    toast(
      needsName
        ? templateItems
          ? "Template created"
          : "List created"
        : append
          ? `Added ${prepared.length} item${prepared.length === 1 ? "" : "s"}`
          : prepared.length === 1
            ? "Task added"
            : `Added ${prepared.length} tasks`,
    );
    onClose();
    if (listId && (needsName || append)) navigate({ to: "/lists/$listId", params: { listId } });
  };

  return (
    <Drawer open={open} onOpenChange={(value) => !value && onClose()}>
      <DrawerContent className="overflow-clip">
        <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3">
            <DrawerTitle className="font-serif text-2xl font-normal">
              {append
                ? "Add items"
                : kind === "task"
                  ? "Add task"
                  : templateItems
                    ? "New template"
                    : "New list"}
            </DrawerTitle>
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-full px-4 hover:bg-muted"
            >
              Cancel
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-6">
            <DrawerDescription className="sr-only">
              Choose Task, List or Template, then type or paste the content.
            </DrawerDescription>
            {!append && (
              <div
                className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1"
                role="group"
                aria-label="Add type"
              >
                {(["task", "list", "template"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={kind === value}
                    onClick={() => setKind(value)}
                    className={cn(
                      "h-11 rounded-full text-[15px] capitalize",
                      kind === value ? "bg-card shadow-sm" : "text-muted-foreground",
                    )}
                  >
                    {value === "task" ? "Task" : value === "list" ? "List" : "Template"}
                  </button>
                ))}
              </div>
            )}
            <form
              id="quick-add-form"
              className="mt-4 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                save();
              }}
            >
              {append && (
                <p className="text-sm text-muted-foreground">
                  Adding to{" "}
                  <strong className="font-medium text-foreground">{existing!.title}</strong>
                </p>
              )}
              {needsName && (
                <label className="block text-sm">
                  {templateItems ? "Template name (required)" : "List name (required)"}
                  <input
                    value={draft.name}
                    onChange={(event) => updateDraft({ name: event.target.value })}
                    placeholder={templateItems ? "e.g. Before I build" : "e.g. Saturday errands"}
                    required
                    className={cn(inputCls, "mt-2 h-12")}
                  />
                </label>
              )}
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <label htmlFor="capture-content" className="text-sm">
                    {kind === "task" && !append
                      ? draft.pasting
                        ? "Tasks — one per line"
                        : "Task"
                      : append
                        ? "Items — one per line"
                        : "Items — type or paste, one per line (optional)"}
                  </label>
                  {!append && (
                    <button
                      type="button"
                      onClick={startPaste}
                      aria-pressed={draft.pasting}
                      className="min-h-11 text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Paste a list
                    </button>
                  )}
                </div>
                {multiple ? (
                  <textarea
                    ref={itemsRef}
                    id="capture-content"
                    value={draft.text}
                    onChange={(event) => updateDraft({ text: event.target.value })}
                    rows={draft.pasting || append ? 5 : 3}
                    placeholder={
                      draft.pasting || append
                        ? "One item per line\nP1 | Pick up groceries | Today\nP2 | Review content | This week"
                        : "Type or paste items, one per line"
                    }
                    className={cn(inputCls, "py-3")}
                  />
                ) : (
                  <input
                    id="capture-content"
                    value={draft.text}
                    onChange={(event) => updateDraft({ text: event.target.value })}
                    placeholder="What needs doing?"
                    className={cn(inputCls, "h-14")}
                  />
                )}
                {multiple && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {draft.pasting || append
                      ? "Paste your text above. Each non-empty line becomes a separate item."
                      : "Add everything together, one item per line."}
                  </p>
                )}
              </div>
              {kind === "task" && !append && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {(["today", "tomorrow", "this week", "none"] as const).map((value) => (
                      <button
                        type="button"
                        key={value}
                        className={cn(chip(when === value), "capitalize")}
                        onClick={() => setWhen(value)}
                      >
                        {value === "none" ? "No date" : value}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-3 text-sm text-muted-foreground">
                    Add to
                    <select
                      value={target}
                      onChange={(event) => setTarget(event.target.value)}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 text-base text-foreground"
                    >
                      <option value="">No list (individual tasks)</option>
                      {activeLists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.title}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              {templateItems && (
                <p
                  role="note"
                  className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground"
                >
                  {parsed.some((line) => line.due)
                    ? "Templates stay undated, so the dates below will be left off. Nothing is added to Today."
                    : "Template items stay undated and won't appear in Today."}
                </p>
              )}
              {(draft.pasting || append) && parsed.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Preview · {parsed.length} item{parsed.length === 1 ? "" : "s"}
                  </p>
                  <ul className="max-h-48 overflow-y-auto rounded-2xl border border-border bg-card px-4">
                    {parsed.map((line, index) => (
                      <li
                        key={index}
                        className="flex items-baseline justify-between gap-3 border-b border-border/70 py-2.5 last:border-0"
                      >
                        <span className="min-w-0 break-words">{line.text}</span>
                        <span className="shrink-0 text-[13px] text-muted-foreground">
                          {line.priority ? `P${line.priority}` : null}
                          {!templateItems && line.due && (
                            <>
                              {" "}
                              {dueLabel(
                                {
                                  ...line,
                                  id: "",
                                  listId: null,
                                  done: false,
                                  order: 0,
                                  createdAt: "",
                                  updatedAt: "",
                                },
                                today,
                              )}
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </form>
          </div>
          <div className="shrink-0 border-t border-border bg-background px-5 py-3">
            <button
              type="submit"
              form="quick-add-form"
              disabled={
                needsName ? !draft.name.trim() : multiple ? !parsed.length : !draft.text.trim()
              }
              className="w-full rounded-2xl bg-primary py-3 text-lg text-primary-foreground disabled:opacity-50"
            >
              {needsName
                ? templateItems
                  ? "Create template"
                  : "Create list"
                : append
                  ? parsed.length
                    ? `Add ${parsed.length} item${parsed.length === 1 ? "" : "s"}`
                    : "Add items"
                  : draft.pasting
                    ? parsed.length
                      ? `Add ${parsed.length} task${parsed.length === 1 ? "" : "s"}`
                      : "Add tasks"
                    : "Add task"}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
