import type { PocketItem, PocketList } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISODate(s: string): Date {
  const [y = 1970, m = 1, d = 1] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** The Sunday that ends the week containing `iso` (weeks run Mon–Sun). */
export function endOfWeek(iso: string): string {
  const day = fromISODate(iso).getDay(); // 0 = Sunday
  return addDays(iso, day === 0 ? 0 : 7 - day);
}

export function isOverdue(item: PocketItem, today: string): boolean {
  return !item.done && !!item.due && item.due < today;
}

/** Is the item shown on the Today view? */
export function isOnToday(item: PocketItem, today: string): boolean {
  if (!item.due) return false;
  if (item.due === today) return true;
  return isOverdue(item, today);
}

/** Items for Today: due today (any state) + unfinished overdue, excluding archived lists and templates. */
export function todayItems(items: PocketItem[], lists: PocketList[], today: string) {
  const byId = new Map(lists.map((l) => [l.id, l]));
  const eligible = items.filter((i) => {
    if (i.listId) {
      const l = byId.get(i.listId);
      if (!l || l.archived || l.kind === "template") return false;
    }
    return isOnToday(i, today);
  });
  const sort = (a: PocketItem, b: PocketItem) =>
    (a.priority ?? 9) - (b.priority ?? 9) || a.order - b.order;
  return {
    overdue: eligible.filter((i) => isOverdue(i, today)).sort(sort),
    due: eligible.filter((i) => i.due === today).sort(sort),
  };
}

export function dueLabel(item: PocketItem, today: string): string | null {
  if (!item.due) return null;
  if (item.due < today && !item.done) {
    return item.dueKind === "week" ? "Overdue · was this week" : `Overdue · ${shortDate(item.due)}`;
  }
  if (item.dueKind === "week") return "This week";
  if (item.due === today) return "Today";
  if (item.due === addDays(today, 1)) return "Tomorrow";
  return shortDate(item.due);
}

export function shortDate(iso: string): string {
  return fromISODate(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
