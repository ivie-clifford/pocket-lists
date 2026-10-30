import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PocketProvider, usePocket } from "@/lib/pocket/store";
import * as db from "@/lib/pocket/db";

vi.mock("@/lib/pocket/db", () => ({
  loadAll: vi.fn(async () => ({ lists: [], items: [], seeded: true })),
  write: vi.fn(async () => {}),
  replaceAll: vi.fn(async () => {}),
}));

describe("task completion", () => {
  it("supports a detached callback and persists completion and reopening", async () => {
    const { result } = renderHook(() => usePocket(), { wrapper: PocketProvider });
    await waitFor(() => expect(result.current.ready).toBe(true));
    let id = "";
    act(() => {
      id = result.current.addItems([{ text: "Test task", due: "2026-10-29", note: "Keep this", priority: 1 }])[0]!.id;
    });
    const { toggleItem } = result.current;
    act(() => toggleItem(id));
    expect(result.current.items[0]).toMatchObject({ done: true, due: "2026-10-29", note: "Keep this", priority: 1 });
    expect(result.current.items[0]!.doneAt).toBeTruthy();
    expect(db.write).toHaveBeenLastCalledWith({ items: [result.current.items[0]] });
    act(() => toggleItem(id));
    expect(result.current.items[0]!.done).toBe(false);
    expect(result.current.items[0]!.doneAt).toBeUndefined();
    const before = result.current.items;
    act(() => toggleItem("missing"));
    expect(result.current.items).toBe(before);
  });
});
