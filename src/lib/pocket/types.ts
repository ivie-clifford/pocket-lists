export const SCHEMA_VERSION = 1;

export type Priority = 1 | 2 | 3;
export type DueKind = "day" | "week";

export interface PocketList {
  id: string;
  title: string;
  kind: "list" | "template";
  note?: string | undefined;
  archived: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  source?: string | undefined;
}

export interface PocketItem {
  id: string;
  listId: string | null;
  text: string;
  done: boolean;
  doneAt?: string | undefined;
  priority?: Priority | undefined;
  /** ISO date (YYYY-MM-DD). For "week" items this is the Sunday ending that week. */
  due?: string | undefined;
  dueKind?: DueKind | undefined;
  note?: string | undefined;
  order: number;
  createdAt: string;
  updatedAt: string;
  source?: string | undefined;
  externalId?: string | undefined;
}

export interface PocketData {
  lists: PocketList[];
  items: PocketItem[];
}

export interface BackupFile extends PocketData {
  app: "pocket-lists";
  schemaVersion: number;
  exportedAt: string;
}

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const nowISO = () => new Date().toISOString();
