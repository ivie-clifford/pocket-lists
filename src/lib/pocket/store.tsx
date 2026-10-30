import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as db from "./db";
import { seedTemplates } from "./seed";
import { nowISO, uid, type PocketData, type PocketItem, type PocketList } from "./types";

type ItemDraft = Partial<Omit<PocketItem, "id" | "createdAt" | "updatedAt">> & { text: string };

interface Store extends PocketData {
  ready: boolean;
  addItems: (drafts: ItemDraft[]) => PocketItem[];
  updateItem: (id: string, patch: Partial<PocketItem>) => void;
  toggleItem: (id: string) => void;
  deleteItem: (id: string) => PocketItem | undefined;
  restoreItem: (item: PocketItem) => void;
  reorderItems: (listId: string, orderedIds: string[]) => void;
  createList: (title: string, kind?: PocketList["kind"]) => PocketList;
  updateList: (id: string, patch: Partial<PocketList>) => void;
  deleteList: (id: string) => void;
  resetList: (id: string) => void;
  duplicateList: (id: string, kind: PocketList["kind"]) => PocketList | undefined;
  replaceAll: (data: PocketData) => Promise<void>;
}

const Ctx = createContext<Store | null>(null);

export function PocketProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PocketData>({ lists: [], items: [] });
  const [ready, setReady] = useState(false);
  const ref = useRef(data);
  ref.current = data;

  useEffect(() => {
    db.loadAll()
      .then(async (d) => {
        if (!d.seeded && d.lists.length === 0) {
          const seed = seedTemplates();
          await db.write({ ...seed, markSeeded: true });
          setData(seed);
        } else setData({ lists: d.lists, items: d.items });
      })
      .catch((e) => console.error("Could not open storage", e))
      .finally(() => setReady(true));
  }, []);

  const commit = useCallback((next: PocketData, ops: Parameters<typeof db.write>[0]) => {
    ref.current = next;
    setData(next);
    db.write(ops).catch((e) => console.error("Save failed", e));
  }, []);

  const store = useMemo<Store>(() => {
    const cur = () => ref.current;
    const touchItem = (i: PocketItem, patch: Partial<PocketItem>): PocketItem => ({ ...i, ...patch, updatedAt: nowISO() });

    return {
      ...data,
      ready,
      addItems(drafts) {
        const t = nowISO();
        const { items, lists } = cur();
        const created = drafts.map((d, k) => {
          const siblings = items.filter((i) => i.listId === (d.listId ?? null));
          return { done: false, order: siblings.length + k, ...d, listId: d.listId ?? null, id: uid(), createdAt: t, updatedAt: t } as PocketItem;
        });
        commit({ lists, items: [...items, ...created] }, { items: created });
        return created;
      },
      updateItem(id, patch) {
        const { items, lists } = cur();
        const target = items.find((i) => i.id === id);
        if (!target) return;
        const next = touchItem(target, patch);
        commit({ lists, items: items.map((i) => (i.id === id ? next : i)) }, { items: [next] });
      },
      toggleItem(id) {
        const { items, lists } = cur();
        const target = items.find((i) => i.id === id);
        if (!target) return;
        const next = touchItem(target, { done: !target.done, doneAt: !target.done ? nowISO() : undefined });
        commit({ lists, items: items.map((i) => (i.id === id ? next : i)) }, { items: [next] });
      },
      deleteItem(id) {
        const { items, lists } = cur();
        const target = items.find((i) => i.id === id);
        commit({ lists, items: items.filter((i) => i.id !== id) }, { deleteItems: [id] });
        return target;
      },
      restoreItem(item) {
        const { items, lists } = cur();
        commit({ lists, items: [...items, item] }, { items: [item] });
      },
      reorderItems(listId, orderedIds) {
        const { items, lists } = cur();
        const pos = new Map(orderedIds.map((id, i) => [id, i]));
        const changed: PocketItem[] = [];
        const next = items.map((i) => {
          if (i.listId !== listId || !pos.has(i.id) || i.order === pos.get(i.id)) return i;
          const u = touchItem(i, { order: pos.get(i.id)! });
          changed.push(u);
          return u;
        });
        commit({ lists, items: next }, { items: changed });
      },
      createList(title, kind = "list") {
        const { items, lists } = cur();
        const t = nowISO();
        const l: PocketList = { id: uid(), title, kind, archived: false, order: lists.length, createdAt: t, updatedAt: t };
        commit({ items, lists: [...lists, l] }, { lists: [l] });
        return l;
      },
      updateList(id, patch) {
        const { items, lists } = cur();
        const target = lists.find((l) => l.id === id);
        if (!target) return;
        const next = { ...target, ...patch, updatedAt: nowISO() };
        commit({ items, lists: lists.map((l) => (l.id === id ? next : l)) }, { lists: [next] });
      },
      deleteList(id) {
        const { items, lists } = cur();
        const gone = items.filter((i) => i.listId === id).map((i) => i.id);
        commit(
          { lists: lists.filter((l) => l.id !== id), items: items.filter((i) => i.listId !== id) },
          { deleteLists: [id], deleteItems: gone },
        );
      },
      resetList(id) {
        const { items, lists } = cur();
        const changed: PocketItem[] = [];
        const next = items.map((i) => {
          if (i.listId !== id || !i.done) return i;
          const u = touchItem(i, { done: false, doneAt: undefined });
          changed.push(u);
          return u;
        });
        commit({ lists, items: next }, { items: changed });
      },
      duplicateList(id, kind) {
        const { items, lists } = cur();
        const src = lists.find((l) => l.id === id);
        if (!src) return;
        const t = nowISO();
        const l: PocketList = { id: uid(), title: src.title, kind, note: src.note, archived: false, order: lists.length, createdAt: t, updatedAt: t };
        const copies = items
          .filter((i) => i.listId === id)
          .sort((a, b) => a.order - b.order)
          .map((i, k) => ({ id: uid(), listId: l.id, text: i.text, note: i.note, priority: i.priority, done: false, order: k, createdAt: t, updatedAt: t }) as PocketItem);
        commit({ lists: [...lists, l], items: [...items, ...copies] }, { lists: [l], items: copies });
        return l;
      },
      async replaceAll(next) {
        await db.replaceAll(next);
        ref.current = next;
        setData(next);
      },
    };
  }, [data, ready, commit]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function usePocket() {
  const s = useContext(Ctx);
  if (!s) throw new Error("usePocket must be used inside PocketProvider");
  return s;
}
