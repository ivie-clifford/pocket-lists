// Tiny IndexedDB wrapper. All persistence goes through here so a synced backend can replace it later.
import type { PocketData, PocketItem, PocketList } from "./types";

const DB_NAME = "pocket-lists";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("lists")) db.createObjectStore("lists", { keyPath: "id" });
        if (!db.objectStoreNames.contains("items")) db.createObjectStore("items", { keyPath: "id" });
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function done(tx: IDBTransaction) {
  return new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error);
  });
}

function getAll<T>(store: IDBObjectStore) {
  return new Promise<T[]>((res, rej) => {
    const r = store.getAll();
    r.onsuccess = () => res(r.result as T[]);
    r.onerror = () => rej(r.error);
  });
}

export async function loadAll(): Promise<PocketData & { seeded: boolean }> {
  const db = await open();
  const tx = db.transaction(["lists", "items", "meta"], "readonly");
  const [lists, items, meta] = await Promise.all([
    getAll<PocketList>(tx.objectStore("lists")),
    getAll<PocketItem>(tx.objectStore("items")),
    getAll<{ key: string }>(tx.objectStore("meta")),
  ]);
  return { lists, items, seeded: meta.some((m) => m.key === "seeded") };
}

export async function write(ops: {
  lists?: PocketList[];
  items?: PocketItem[];
  deleteLists?: string[];
  deleteItems?: string[];
  markSeeded?: boolean;
}) {
  const db = await open();
  const tx = db.transaction(["lists", "items", "meta"], "readwrite");
  const ls = tx.objectStore("lists");
  const is = tx.objectStore("items");
  ops.lists?.forEach((l) => ls.put(l));
  ops.items?.forEach((i) => is.put(i));
  ops.deleteLists?.forEach((id) => ls.delete(id));
  ops.deleteItems?.forEach((id) => is.delete(id));
  if (ops.markSeeded) tx.objectStore("meta").put({ key: "seeded", at: new Date().toISOString() });
  await done(tx);
}

/** Replace everything in one transaction (used by restore and clear). */
export async function replaceAll(data: PocketData) {
  const db = await open();
  const tx = db.transaction(["lists", "items", "meta"], "readwrite");
  const ls = tx.objectStore("lists");
  const is = tx.objectStore("items");
  ls.clear();
  is.clear();
  data.lists.forEach((l) => ls.put(l));
  data.items.forEach((i) => is.put(i));
  tx.objectStore("meta").put({ key: "seeded", at: new Date().toISOString() });
  await done(tx);
}
