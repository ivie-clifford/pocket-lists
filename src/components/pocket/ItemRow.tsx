import { Check } from "lucide-react";
import { dueLabel, isOverdue } from "@/lib/pocket/dates";
import type { PocketItem } from "@/lib/pocket/types";
import { cn } from "@/lib/utils";
import { usePocket } from "@/lib/pocket/store";
import { useUI } from "./ui-state";
import { useToday } from "./useToday";

const PRIORITY_DOT = { 1: "bg-p1", 2: "bg-p2", 3: "bg-p3" } as const;

export function ItemRow({ item, listName, handle }: { item: PocketItem; listName?: string; handle?: React.ReactNode }) {
  const { toggleItem } = usePocket();
  const { openItem } = useUI();
  const today = useToday();
  const label = dueLabel(item, today);
  const overdue = isOverdue(item, today);

  return (
    <div role="listitem" className="flex min-h-14 items-center gap-1 border-b border-border/70 last:border-b-0">
      <button
        type="button"
        aria-label={item.done ? `Mark "${item.text}" not done` : `Mark "${item.text}" done`}
        onClick={() => {
          toggleItem(item.id);
          if (!item.done && "vibrate" in navigator) navigator.vibrate?.(8);
        }}
        className="grid h-12 w-12 shrink-0 place-items-center"
      >
        <span
          className={cn(
            "grid h-6 w-6 place-items-center rounded-full border-2 transition-colors duration-200",
            item.done ? "border-primary bg-primary text-primary-foreground" : "border-ink-soft/50",
          )}
        >
          {item.done && <Check className="animate-check h-4 w-4" strokeWidth={3} />}
        </span>
      </button>
      <button type="button" onClick={() => openItem(item.id)} className="min-w-0 flex-1 py-3 pr-2 text-left">
        <span
          className={cn(
            "block leading-snug transition-all duration-300",
            item.done && "text-muted-foreground line-through decoration-ink-soft/40",
          )}
        >
          {item.text}
        </span>
        {(label || listName || item.priority || item.note) && (
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-muted-foreground">
            {item.priority && (
              <span className="inline-flex items-center gap-1">
                <span className={cn("h-2 w-2 rounded-full", PRIORITY_DOT[item.priority])} />P{item.priority}
              </span>
            )}
            {label && <span className={cn(overdue && "text-overdue")}>{label}</span>}
            {listName && <span>· {listName}</span>}
            {item.note && <span aria-label="has note">· note</span>}
          </span>
        )}
      </button>
      {handle}
    </div>
  );
}
