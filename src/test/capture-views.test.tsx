import { useState, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuickAdd } from "@/components/pocket/QuickAdd";
import { ItemSheet } from "@/components/pocket/ItemSheet";
import { activeTasks, todayItems } from "@/lib/pocket/dates";
import type { PocketItem, PocketList } from "@/lib/pocket/types";

const actions = vi.hoisted(() => ({ addItems: vi.fn(), updateItem: vi.fn() }));
const task = {
  id: "task",
  listId: null,
  text: "Original",
  done: false,
  order: 0,
  createdAt: "",
  updatedAt: "",
} satisfies PocketItem;
vi.mock("@/lib/pocket/store", () => ({
  usePocket: () => ({ items: [task], lists: [], ...actions }),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ open, children }: { children: ReactNode; open?: boolean }) => (open ? children : null),
  DrawerContent: ({ children }: { children: ReactNode; open?: boolean }) => (
    <div role="dialog">{children}</div>
  ),
  DrawerTitle: ({ children }: { children: ReactNode; open?: boolean }) => <h2>{children}</h2>,
  DrawerDescription: ({ children }: { children: ReactNode; open?: boolean }) => <p>{children}</p>,
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("capture completion", () => {
  it("adds an undated individual task and dismisses the panel", () => {
    function Capture() {
      const [open, setOpen] = useState(true);
      return <QuickAdd open={open} opts={{}} onClose={() => setOpen(false)} />;
    }
    render(<Capture />);
    fireEvent.change(screen.getByPlaceholderText("What needs doing?"), {
      target: { value: "Buy fruit" },
    });
    fireEvent.click(screen.getByRole("button", { name: "No date" }));
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    expect(actions.addItems).toHaveBeenCalledExactlyOnceWith([{ text: "Buy fruit", listId: null }]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Done saves the focused task text and closes without requiring blur or swipe", () => {
    function Edit() {
      const [id, setId] = useState<string | null>("task");
      return <ItemSheet itemId={id} onClose={() => setId(null)} />;
    }
    render(<Edit />);
    fireEvent.change(screen.getByLabelText("Task"), { target: { value: "Updated" } });
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(actions.updateItem).toHaveBeenCalledWith("task", { text: "Updated" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

it("keeps future and undated tasks accessible while excluding templates and archives", () => {
  const list = (id: string, kind: "list" | "template", archived = false): PocketList => ({
    id,
    kind,
    archived,
    title: id,
    order: 0,
    createdAt: "",
    updatedAt: "",
  });
  const lists = [
    list("active", "list"),
    list("template", "template"),
    list("archive", "list", true),
  ];
  const items: PocketItem[] = [
    { ...task, id: "overdue", due: "2026-10-29" },
    { ...task, id: "today", due: "2026-10-30" },
    { ...task, id: "future", due: "2026-10-31" },
    { ...task, id: "undated" },
    { ...task, id: "listed", listId: "active", due: "2026-11-01" },
    { ...task, id: "template", listId: "template" },
    { ...task, id: "archive", listId: "archive" },
    { ...task, id: "orphan", listId: "missing" },
  ];
  const all = activeTasks(items, lists);
  expect(all.map((item) => item.id)).toEqual(["overdue", "today", "future", "listed", "undated"]);
  expect(all.filter((item) => item.due && item.due > "2026-10-30").map((item) => item.id)).toEqual([
    "future",
    "listed",
  ]);
  const today = todayItems(items, lists, "2026-10-30");
  expect(today.overdue.map((item) => item.id)).toEqual(["overdue"]);
  expect(today.due.map((item) => item.id)).toEqual(["today"]);
});
