import { SCHEMA_VERSION, nowISO, type BackupFile, type PocketData } from "./types";

export function buildBackup(data: PocketData): BackupFile {
  return { app: "pocket-lists", schemaVersion: SCHEMA_VERSION, exportedAt: nowISO(), ...data };
}

const isStr = (v: unknown) => typeof v === "string";
const optStr = (v: unknown) => v === undefined || typeof v === "string";
const isDate = (v: unknown) => v === undefined || (isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v as string));

export type ValidationResult = { ok: true; data: PocketData } | { ok: false; error: string };

/** Fully validates a backup before any data is touched. */
export function validateBackup(text: string): ValidationResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file isn't a valid backup (couldn't read it)." };
  }
  const f = raw as Partial<BackupFile>;
  if (!f || typeof f !== "object" || f.app !== "pocket-lists")
    return { ok: false, error: "This file isn't a Pocket Lists backup." };
  if (typeof f.schemaVersion !== "number" || f.schemaVersion > SCHEMA_VERSION)
    return { ok: false, error: "This backup is from a newer version of the app." };
  if (!Array.isArray(f.lists) || !Array.isArray(f.items))
    return { ok: false, error: "The backup is missing its lists or tasks." };

  const listIds = new Set<string>();
  for (const [i, l] of f.lists.entries()) {
    const ok =
      l && isStr(l.id) && isStr(l.title) && (l.kind === "list" || l.kind === "template") &&
      typeof l.archived === "boolean" && typeof l.order === "number" &&
      isStr(l.createdAt) && isStr(l.updatedAt) && optStr(l.note) && optStr(l.source);
    if (!ok) return { ok: false, error: `List #${i + 1} in the backup is damaged.` };
    listIds.add(l.id);
  }
  for (const [i, it] of f.items.entries()) {
    const ok =
      it && isStr(it.id) && (it.listId === null || (isStr(it.listId) && listIds.has(it.listId))) &&
      isStr(it.text) && typeof it.done === "boolean" && typeof it.order === "number" &&
      isStr(it.createdAt) && isStr(it.updatedAt) && isDate(it.due) &&
      (it.dueKind === undefined || it.dueKind === "day" || it.dueKind === "week") &&
      (it.priority === undefined || [1, 2, 3].includes(it.priority)) &&
      optStr(it.note) && optStr(it.doneAt) && optStr(it.source) && optStr(it.externalId);
    if (!ok) return { ok: false, error: `Task #${i + 1} in the backup is damaged.` };
  }
  return { ok: true, data: { lists: f.lists, items: f.items } };
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
