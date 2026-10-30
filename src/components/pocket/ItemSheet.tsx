import { useEffect, useState } from "react";
import { CalendarPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { addDays, endOfWeek } from "@/lib/pocket/dates";
import { buildIcs } from "@/lib/pocket/ics";
import { downloadFile } from "@/lib/pocket/backup";
import { usePocket } from "@/lib/pocket/store";
import type { PocketItem, Priority } from "@/lib/pocket/types";
import { cn } from "@/lib/utils";
import { useToday } from "./useToday";

export const chip = (active: boolean) =>
  cn(
    "h-10 rounded-full border px-4 text-[15px] transition-colors",
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
  );

export function ItemSheet({ itemId, onClose }: { itemId: string | null; onClose: () => void }) {
  const { items, lists, updateItem, deleteItem, restoreItem } = usePocket();
  const today = useToday();
  const item = items.find((i) => i.id === itemId);
  const [text, setText] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (item) {
      setText(item.text);
      setNote(item.note ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const saveText = () => {
    if (!item) return;
    const t = text.trim();
    if (t && t !== item.text) updateItem(item.id, { text: t });
    if ((note.trim() || undefined) !== item.note) updateItem(item.id, { note: note.trim() || undefined });
  };

  const close = () => {
    saveText();
    onClose();
  };

  const setDue = (patch: Pick<PocketItem, "due" | "dueKind">) => item && updateItem(item.id, patch);
  const listName = item?.listId ? lists.find((l) => l.id === item.listId)?.title : undefined;

  const dueChoice = !item?.due
    ? "none"
    : item.dueKind === "week"
      ? "week"
      : item.due === today
        ? "today"
        : item.due === addDays(today, 1)
          ? "tomorrow"
          : "date";

  return (
    <Drawer open={!!item} onOpenChange={(o) => !o && close()}>
      <DrawerContent>
        {item && (
          <div className="mx-auto w-full max-w-lg overflow-y-auto px-5 pt-3 pb-6">
            <DrawerTitle className="sr-only">Edit task</DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">{listName ?? "Loose task"}</DrawerDescription>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={saveText}
              rows={2}
              className="mt-1 w-full resize-none bg-transparent font-serif text-2xl leading-tight outline-none"
              aria-label="Task"
            />

            <Section label="Priority">
              {([undefined, 1, 2, 3] as (Priority | undefined)[]).map((p) => (
                <button key={p ?? 0} className={chip(item.priority === p)} onClick={() => updateItem(item.id, { priority: p })}>
                  {p ? `P${p}` : "None"}
                </button>
              ))}
            </Section>

            <Section label="When">
              <button className={chip(dueChoice === "none")} onClick={() => setDue({ due: undefined, dueKind: undefined })}>None</button>
              <button className={chip(dueChoice === "today")} onClick={() => setDue({ due: today, dueKind: "day" })}>Today</button>
              <button className={chip(dueChoice === "tomorrow")} onClick={() => setDue({ due: addDays(today, 1), dueKind: "day" })}>Tomorrow</button>
              <button className={chip(dueChoice === "week")} onClick={() => setDue({ due: endOfWeek(today), dueKind: "week" })}>This week</button>
              <label className={cn(chip(dueChoice === "date"), "relative inline-flex items-center")}>
                {dueChoice === "date" && item.due ? item.due : "Pick date"}
                <input
                  type="date"
                  className="absolute inset-0 opacity-0"
                  value={item.due ?? ""}
                  onChange={(e) => e.target.value && setDue({ due: e.target.value, dueKind: "day" })}
                />
              </label>
            </Section>

            <label className="mt-5 block text-sm text-muted-foreground">
              Note
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={saveText}
                rows={3}
                placeholder="Anything to remember…"
                className="mt-1.5 w-full rounded-xl border border-input bg-card p-3 text-base text-foreground outline-none focus:border-ring"
              />
            </label>

            <div className="mt-5 flex flex-col gap-1">
              {item.due && (
                <button
                  className="flex h-12 items-center gap-3 rounded-xl px-2 text-left hover:bg-muted"
                  onClick={() =>
                    downloadFile(
                      `${item.text.slice(0, 40).replace(/[^\w\- ]/g, "") || "task"}.ics`,
                      buildIcs({ id: item.id, title: text.trim() || item.text, date: item.due!, note: note.trim() || undefined }),
                      "text/calendar",
                    )
                  }
                >
                  <CalendarPlus className="h-5 w-5 text-primary" /> Add to calendar
                </button>
              )}
              <button
                className="flex h-12 items-center gap-3 rounded-xl px-2 text-left text-destructive hover:bg-muted"
                onClick={() => {
                  const removed = deleteItem(item.id);
                  onClose();
                  if (removed) toast("Task deleted", { action: { label: "Undo", onClick: () => restoreItem(removed) } });
                }}
              >
                <Trash2 className="h-5 w-5" /> Delete task
              </button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-sm text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
