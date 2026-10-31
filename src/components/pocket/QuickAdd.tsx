import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { dueLabel } from "@/lib/pocket/dates";
import { parseDue, parsePastedList } from "@/lib/pocket/parse";
import { usePocket } from "@/lib/pocket/store";
import { cn } from "@/lib/utils";
import { chip } from "./ItemSheet";
import { useToday } from "./useToday";

type Mode = "task" | "list" | "paste";
export interface QuickAddOpts {
  listId?: string;
  mode?: Mode;
}

const inputCls =
  "w-full rounded-2xl border border-input bg-card px-4 text-lg outline-none placeholder:text-muted-foreground focus:border-ring";

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
  const [mode, setMode] = useState<Mode>("task");
  const [text, setText] = useState("");
  const [paste, setPaste] = useState("");
  const [target, setTarget] = useState<string>(""); // "" = no list, "new" = new list, else list id
  const [newTitle, setNewTitle] = useState("");
  const [when, setWhen] = useState<"none" | "today" | "tomorrow" | "this week">("today");

  useEffect(() => {
    if (open) {
      setMode(opts.mode ?? "task");
      setTarget(opts.listId ?? "");
      setWhen(opts.listId ? "none" : "today");
      setText("");
      setPaste("");
      setNewTitle("");
    }
  }, [open, opts]);

  const activeLists = lists.filter((l) => l.kind === "list" && !l.archived);
  const templates = lists.filter((l) => l.kind === "template");
  const parsed = useMemo(() => parsePastedList(paste, today), [paste, today]);
  const targetName = target ? lists.find((l) => l.id === target)?.title : "No list";

  const addTask = () => {
    const t = text.trim();
    if (!t) return;
    const due = when === "none" ? null : parseDue(when, today);
    addItems([{ text: t, listId: target || null, ...(due ?? {}) }]);
    setText("");
    toast(target ? `Added to ${targetName}` : "Task added");
    onClose();
  };

  const addList = () => {
    const t = text.trim();
    if (!t) return;
    const l = createList(t, "list");
    onClose();
    navigate({ to: "/lists/$listId", params: { listId: l.id } });
  };

  const addPasted = () => {
    if (!parsed.length) return;
    let listId: string | null = target && target !== "new" ? target : null;
    if (target === "new") listId = createList(newTitle.trim() || "Pasted list").id;
    addItems(
      parsed.map((p) => ({
        ...p,
        listId,
        ...(!listId && !p.due ? { due: today, dueKind: "day" as const } : {}),
      })),
    );
    toast(`Added ${parsed.length} item${parsed.length > 1 ? "s" : ""}`);
    onClose();
    if (listId) navigate({ to: "/lists/$listId", params: { listId } });
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3">
            <DrawerTitle className="font-serif text-2xl font-normal">Add</DrawerTitle>
            <button onClick={onClose} className="h-11 rounded-full px-4 hover:bg-muted">
              Cancel
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-6">
            <DrawerDescription className="sr-only">
              Add a task, a list, or paste several items
            </DrawerDescription>
            <div className="mt-3 grid grid-cols-3 rounded-full bg-muted p-1" role="tablist">
              {(["task", "list", "paste"] as Mode[]).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    setMode(m);
                    if (m !== "paste" && target === "new") setTarget("");
                  }}
                  className={cn(
                    "h-10 rounded-full text-[15px] capitalize",
                    mode === m ? "bg-card shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {m === "paste" ? "Paste a list" : m === "list" ? "New list" : "Task"}
                </button>
              ))}
            </div>

            {mode === "task" && (
              <form className="mt-4" onSubmit={(e) => (e.preventDefault(), addTask())}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="What needs doing?"
                  className={cn(inputCls, "h-14")}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["today", "tomorrow", "this week", "none"] as const).map((w) => (
                    <button
                      type="button"
                      key={w}
                      className={cn(chip(when === w), "capitalize")}
                      onClick={() => setWhen(w)}
                    >
                      {w === "none" ? "No date" : w}
                    </button>
                  ))}
                </div>
                <TargetSelect value={target} onChange={setTarget} lists={activeLists} />
              </form>
            )}

            {mode === "list" && (
              <form className="mt-4" onSubmit={(e) => (e.preventDefault(), addList())}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="List name, e.g. Saturday errands"
                  className={cn(inputCls, "h-14")}
                />
                {templates.length > 0 && (
                  <p className="mt-3 text-center text-sm text-muted-foreground">
                    Or start one from Templates.
                  </p>
                )}
              </form>
            )}

            {mode === "paste" && (
              <div className="mt-4">
                <textarea
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  rows={5}
                  placeholder={
                    "One item per line\nP1 | Pick up groceries | Today\nP2 | Review content | This week"
                  }
                  className={cn(inputCls, "py-3 text-base")}
                />
                <TargetSelect value={target} onChange={setTarget} lists={activeLists} allowNew />
                {target === "new" && (
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="New list name"
                    className={cn(inputCls, "mt-2 h-12 text-base")}
                  />
                )}
                {parsed.length > 0 && (
                  <ul className="mt-4 max-h-56 overflow-y-auto rounded-2xl border border-border bg-card px-4">
                    {parsed.map((p, i) => (
                      <li
                        key={i}
                        className="flex items-baseline justify-between gap-3 border-b border-border/70 py-2.5 last:border-0"
                      >
                        <span>{p.text}</span>
                        <span className="shrink-0 text-[13px] text-muted-foreground">
                          {[
                            p.priority && `P${p.priority}`,
                            p.due &&
                              dueLabel(
                                {
                                  ...p,
                                  id: "",
                                  listId: null,
                                  done: false,
                                  order: 0,
                                  createdAt: "",
                                  updatedAt: "",
                                },
                                today,
                              ),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div className="shrink-0 border-t border-border bg-background px-5 py-3">
            <button
              onClick={mode === "task" ? addTask : mode === "list" ? addList : addPasted}
              disabled={mode === "paste" ? !parsed.length : !text.trim()}
              className="w-full rounded-2xl bg-primary py-3 text-lg text-primary-foreground disabled:opacity-50"
            >
              {mode === "task"
                ? "Add task"
                : mode === "list"
                  ? "Create list"
                  : parsed.length
                    ? `Add ${parsed.length} item${parsed.length > 1 ? "s" : ""}`
                    : "Add items"}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function TargetSelect({
  value,
  onChange,
  lists,
  allowNew,
}: {
  value: string;
  onChange: (v: string) => void;
  lists: { id: string; title: string }[];
  allowNew?: boolean;
}) {
  return (
    <label className="mt-3 flex items-center gap-3 text-[15px] text-muted-foreground">
      Add to
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 text-base text-foreground"
      >
        <option value="">No list (individual tasks)</option>
        {lists.map((l) => (
          <option key={l.id} value={l.id}>
            {l.title}
          </option>
        ))}
        {allowNew && <option value="new">A new list…</option>}
      </select>
    </label>
  );
}
