import { addDays, endOfWeek, toISODate } from "./dates";
import type { DueKind, Priority } from "./types";

export interface ParsedLine {
  text: string;
  priority?: Priority;
  due?: string;
  dueKind?: DueKind;
}

/** Turn a date word into a stored due date. "This week" becomes the Sunday ending this week. */
export function parseDue(word: string, today: string): { due: string; dueKind: DueKind } | null {
  const w = word.trim().toLowerCase();
  if (!w) return null;
  if (w === "today") return { due: today, dueKind: "day" };
  if (w === "tomorrow") return { due: addDays(today, 1), dueKind: "day" };
  if (w === "this week") return { due: endOfWeek(today), dueKind: "week" };
  if (/^\d{4}-\d{2}-\d{2}$/.test(w)) return { due: w, dueKind: "day" };
  const d = new Date(word);
  if (!isNaN(d.getTime())) return { due: toISODate(d), dueKind: "day" };
  return null;
}

/**
 * One line per item. Optional pipe format: `P1 | Text | Today`.
 * Leading bullets / checkboxes / numbering are stripped.
 */
export function parsePastedList(input: string, today: string): ParsedLine[] {
  return input
    .split(/\r?\n/)
    .map((raw) => raw.replace(/^\s*(?:[-*•]|\[[ xX]?\]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      const out: ParsedLine = { text: line };
      let rest = parts;
      const pm = /^p([123])$/i.exec(rest[0] ?? "");
      if (rest.length > 1 && pm) {
        out.priority = Number(pm[1]) as Priority;
        rest = rest.slice(1);
      }
      if (rest.length > 1) {
        const due = parseDue(rest[rest.length - 1], today);
        if (due) {
          Object.assign(out, due);
          rest = rest.slice(0, -1);
        }
      }
      out.text = rest.join(" | ").trim();
      return out;
    })
    .filter((l) => l.text.length > 0);
}
