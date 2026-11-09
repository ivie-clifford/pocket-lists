import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/pocket/AppShell";
import { Route as TemplatesRoute } from "@/routes/templates";
import { Route as ListRoute } from "@/routes/lists.$listId";
import { usePocket } from "@/lib/pocket/store";
import { useUI } from "@/components/pocket/ui-state";
import type { PocketData, PocketList, PocketItem } from "@/lib/pocket/types";
type MockLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  params?: { listId: string };
  activeProps?: AnchorHTMLAttributes<HTMLAnchorElement>;
  inactiveProps?: AnchorHTMLAttributes<HTMLAnchorElement>;
  activeOptions?: unknown;
};

const env = vi.hoisted(() => ({
  path: "/templates",
  id: "tpl",
  navigate: vi.fn(),
  write: vi.fn(async () => {}),
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options, useParams: () => ({ listId: env.id }) }),
  useNavigate: () => env.navigate,
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { pathname: env.path } }),
  Link: ({
    to,
    params,
    children,
    activeProps,
    inactiveProps,
    activeOptions: _a,
    ...props
  }: MockLinkProps) => (
    <a
      href={params ? `/lists/${params.listId}` : to}
      {...(env.path === to ? activeProps : inactiveProps)}
      {...props}
    >
      {children}
    </a>
  ),
}));
vi.mock("@/lib/pocket/db", () => ({
  loadAll: async () => ({
    seeded: true,
    lists: [
      {
        id: "tpl",
        title: "Packing template",
        kind: "template",
        order: 0,
        createdAt: "",
        updatedAt: "",
      },
      { id: "list", title: "Trip list", kind: "list", order: 1, createdAt: "", updatedAt: "" },
    ],
    items: [
      {
        id: "item",
        listId: "tpl",
        text: "Passport",
        order: 0,
        done: false,
        createdAt: "",
        updatedAt: "",
      },
    ],
  }),
  write: env.write,
}));
vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div>{children}</div> : null,
  DrawerContent: ({ children }: { children: ReactNode }) => <div role="dialog">{children}</div>,
  DrawerTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DrawerDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));
function DataProbe() {
  const { lists, items } = usePocket();
  return <output data-testid="data">{JSON.stringify({ lists, items })}</output>;
}
const Templates = TemplatesRoute.options.component!;
const List = ListRoute.options.component!;
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  env.path = "/templates";
  env.id = "tpl";
});

describe("template usability", () => {
  it("requires a name, saves typed/pasted items once and never assigns template dates", async () => {
    render(
      <AppShell>
        <Templates />
        <DataProbe />
      </AppShell>,
    );
    await screen.findByRole("heading", { name: "Templates" });
    // Both the desktop pane and the page offer the same creation flow.
    fireEvent.click(screen.getAllByRole("button", { name: "New template" }).at(-1)!);
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByRole("button", { name: "Create template" })).toBeDisabled();
    fireEvent.change(dialog.getByLabelText("Template name (required)"), {
      target: { value: "Before a trip" },
    });
    fireEvent.change(dialog.getByLabelText(/Items — type or paste/), {
      target: { value: "P1 | Pack bag | Today\nCharger\nBook taxi" },
    });
    expect(dialog.getByRole("note")).toHaveTextContent("dates below will be left off");
    fireEvent.click(dialog.getByRole("button", { name: "Create template" }));
    const data: PocketData = JSON.parse(screen.getByTestId("data").textContent!);
    const added = data.lists.filter((l: PocketList) => l.title === "Before a trip");
    expect(added).toHaveLength(1);
    expect(added[0]!.kind).toBe("template");
    const items = data.items.filter((i: PocketItem) => i.listId === added[0]!.id);
    expect(items.map((i: PocketItem) => i.text)).toEqual(["Pack bag", "Charger", "Book taxi"]);
    expect(items.every((i: PocketItem) => !i.due && !i.dueKind)).toBe(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(env.write).toHaveBeenCalledWith(
      expect.objectContaining({ lists: [expect.objectContaining({ title: "Before a trip" })] }),
    );
  });

  it("cancels without creating an empty template", async () => {
    render(
      <AppShell>
        <Templates />
        <DataProbe />
      </AppShell>,
    );
    await screen.findByRole("heading", { name: "Templates" });
    fireEvent.click(screen.getAllByRole("button", { name: "New template" }).at(-1)!);
    fireEvent.change(screen.getByLabelText("Template name (required)"), {
      target: { value: "Discard" },
    });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
    expect(JSON.parse(screen.getByTestId("data").textContent!).lists).toHaveLength(2);
    expect(env.write).not.toHaveBeenCalled();
  });

  it.each([0, 1])(
    "creates a template through global Add entry %s and retains its draft",
    async (entry) => {
      render(
        <AppShell>
          <Templates />
          <DataProbe />
        </AppShell>,
      );
      await screen.findByRole("heading", { name: "Templates" });
      fireEvent.click(screen.getAllByRole("button", { name: "Add" })[entry]!);
      const dialog = within(screen.getByRole("dialog"));
      const choices = within(dialog.getByRole("group", { name: "Add type" }));
      expect(choices.getAllByRole("button").map((button) => button.textContent)).toEqual([
        "Task",
        "List",
        "Template",
      ]);
      fireEvent.click(choices.getByRole("button", { name: "Template" }));
      expect(dialog.getByRole("button", { name: "Create template" })).toBeDisabled();
      fireEvent.change(dialog.getByLabelText("Template name (required)"), {
        target: { value: "Global template" },
      });
      fireEvent.change(dialog.getByLabelText(/Items — type or paste/), {
        target: { value: "P1 | Pack bag | Today\nPassport" },
      });
      fireEvent.click(choices.getByRole("button", { name: "List" }));
      fireEvent.click(choices.getByRole("button", { name: "Template" }));
      expect(dialog.getByLabelText("Template name (required)")).toHaveValue("Global template");
      expect(dialog.getByLabelText(/Items — type or paste/)).toHaveValue(
        "P1 | Pack bag | Today\nPassport",
      );
      fireEvent.click(dialog.getByRole("button", { name: "Create template" }));
      const data: PocketData = JSON.parse(screen.getByTestId("data").textContent!);
      const template = data.lists.find((list) => list.title === "Global template")!;
      expect(template.kind).toBe("template");
      expect(
        data.items
          .filter((item) => item.listId === template.id)
          .map((item) => ({ text: item.text, due: item.due })),
      ).toEqual([
        { text: "Pack bag", due: undefined },
        { text: "Passport", due: undefined },
      ]);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    },
  );

  it("keeps task capture independent after switching away from a template draft", async () => {
    render(
      <AppShell>
        <Templates />
        <DataProbe />
      </AppShell>,
    );
    await screen.findByRole("heading", { name: "Templates" });
    fireEvent.click(screen.getAllByRole("button", { name: "Add" }).at(-1)!);
    const dialog = within(screen.getByRole("dialog"));
    const choices = within(dialog.getByRole("group", { name: "Add type" }));
    fireEvent.click(choices.getByRole("button", { name: "Template" }));
    fireEvent.change(dialog.getByLabelText("Template name (required)"), {
      target: { value: "Unsaved draft" },
    });
    fireEvent.click(choices.getByRole("button", { name: "Task" }));
    expect(dialog.getByRole("combobox")).toHaveValue("");
    fireEvent.change(dialog.getByPlaceholderText("What needs doing?"), {
      target: { value: "Loose task" },
    });
    fireEvent.click(dialog.getByRole("button", { name: "Add task" }));
    const data: PocketData = JSON.parse(screen.getByTestId("data").textContent!);
    expect(data.lists).toHaveLength(2);
    expect(data.items.find((item) => item.text === "Loose task")).toMatchObject({ listId: null });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each(["List", "Template"])(
    "pastes into a named %s without losing its name or changing its kind",
    async (label) => {
      render(
        <AppShell>
          <Templates />
          <DataProbe />
        </AppShell>,
      );
      await screen.findByRole("heading", { name: "Templates" });
      fireEvent.click(screen.getAllByRole("button", { name: "Add" }).at(-1)!);
      const dialog = within(screen.getByRole("dialog"));
      const choices = within(dialog.getByRole("group", { name: "Add type" }));
      fireEvent.click(choices.getByRole("button", { name: label }));
      const createLabel = label === "List" ? "Create list" : "Create template";
      expect(dialog.getByRole("button", { name: createLabel })).toBeDisabled();
      const name = dialog.getByLabelText(`${label} name (required)`);
      fireEvent.change(name, { target: { value: "Named before pasting" } });
      const items = dialog.getByLabelText(/Items — type or paste/);
      fireEvent.change(items, { target: { value: "First item" } });
      fireEvent.click(dialog.getByRole("button", { name: "Paste a list" }));
      expect(name).toHaveValue("Named before pasting");
      expect(items).toHaveValue("First item");
      fireEvent.change(items, { target: { value: "First item\nP1 | Second item | 2026-11-09" } });
      fireEvent.click(dialog.getByRole("button", { name: createLabel }));
      const data: PocketData = JSON.parse(screen.getByTestId("data").textContent!);
      const added = data.lists.filter((list) => list.title === "Named before pasting");
      expect(added).toHaveLength(1);
      expect(added[0]!.kind).toBe(label.toLowerCase());
      const createdItems = data.items.filter((item) => item.listId === added[0]!.id);
      expect(createdItems.map((item) => item.text)).toEqual(["First item", "Second item"]);
      expect(createdItems[1]!.priority).toBe(1);
      expect(createdItems[1]!.due).toBe(label === "Template" ? undefined : "2026-11-09");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    },
  );

  it("pastes tasks into the chosen existing list without creating another list", async () => {
    render(
      <AppShell>
        <Templates />
        <DataProbe />
      </AppShell>,
    );
    await screen.findByRole("heading", { name: "Templates" });
    fireEvent.click(screen.getAllByRole("button", { name: "Add" }).at(-1)!);
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.click(
      within(dialog.getByRole("group", { name: "Add type" })).getByRole("button", { name: "Task" }),
    );
    fireEvent.click(dialog.getByRole("button", { name: "Paste a list" }));
    fireEvent.change(dialog.getByLabelText("Tasks — one per line"), {
      target: { value: "Buy fruit\nBuy rice" },
    });
    fireEvent.change(dialog.getByRole("combobox"), { target: { value: "list" } });
    fireEvent.click(dialog.getByRole("button", { name: "No date" }));
    fireEvent.click(dialog.getByRole("button", { name: "Add 2 tasks" }));
    const data: PocketData = JSON.parse(screen.getByTestId("data").textContent!);
    expect(data.lists).toHaveLength(2);
    expect(
      data.items
        .filter((item) => item.listId === "list")
        .map((item) => ({ text: item.text, due: item.due })),
    ).toEqual([
      { text: "Buy fruit", due: undefined },
      { text: "Buy rice", due: undefined },
    ]);
  });

  it.each(["list", "tpl"])("keeps contextual Paste items attached to %s", async (id) => {
    function Launcher() {
      const { openQuickAdd } = useUI();
      return (
        <button onClick={() => openQuickAdd({ mode: "paste", listId: id })}>Paste existing</button>
      );
    }
    render(
      <AppShell>
        <Launcher />
        <DataProbe />
      </AppShell>,
    );
    await waitFor(() => expect(screen.getByTestId("data")).toHaveTextContent("Packing template"));
    fireEvent.click(screen.getByRole("button", { name: "Paste existing" }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.queryByRole("group", { name: "Add type" })).not.toBeInTheDocument();
    fireEvent.change(dialog.getByLabelText(/Items|Tasks/), {
      target: { value: "P2 | Extra item | 2026-11-09" },
    });
    fireEvent.click(dialog.getByRole("button", { name: "Add 1 item" }));
    const data: PocketData = JSON.parse(screen.getByTestId("data").textContent!);
    expect(data.lists).toHaveLength(2);
    expect(data.items.find((item) => item.text === "Extra item")).toMatchObject({
      listId: id,
      priority: 2,
    });
    expect(data.items.find((item) => item.text === "Extra item")!.due).toBe(
      id === "tpl" ? undefined : "2026-11-09",
    );
  });

  it.each([
    ["/", "tpl", "Today", null],
    ["/templates", "tpl", "Templates", "Packing template"],
    ["/lists/tpl", "tpl", "Templates", "Packing template"],
    ["/lists/list", "list", "Lists", "Trip list"],
  ])("selects only the correct navigation and pane for %s", async (path, id, label, record) => {
    env.path = path;
    env.id = id;
    const view = render(
      <AppShell>
        <DataProbe />
      </AppShell>,
    );
    await waitFor(() => expect(screen.getByTestId("data")).toHaveTextContent("Packing template"));
    const mainNav = within(screen.getByRole("navigation", { name: "Main" }));
    expect(mainNav.getByRole("link", { name: label })).toHaveAttribute("data-current", "true");
    expect(
      mainNav.getAllByRole("link").filter((l) => l.getAttribute("data-current") === "true"),
    ).toHaveLength(1);
    const panes = view.container.querySelectorAll("aside");
    if (record) {
      expect(panes[1]).toHaveTextContent(record);
      expect(panes[1]).not.toHaveTextContent(
        record === "Trip list" ? "Packing template" : "Trip list",
      );
    } else expect(panes).toHaveLength(1);
  });

  it("offers creation above the items and in the template menu; the copy is independent", async () => {
    env.path = "/lists/tpl";
    render(
      <AppShell>
        <List />
        <DataProbe />
      </AppShell>,
    );
    const create = await screen.findByRole("button", { name: "Create list from template" });
    const items = within(screen.getByRole("main")).getByRole("list");
    expect(create.compareDocumentPosition(items) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.keyDown(screen.getByRole("button", { name: "More actions for Packing template" }), {
      key: "Enter",
    });
    expect(screen.getByRole("menuitem", { name: "Create list from template" })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    // The top action and menu share the existing store copy operation.
    fireEvent.click(create);
    const data: PocketData = JSON.parse(screen.getByTestId("data").textContent!);
    const copy = data.lists.find(
      (l: PocketList) => l.id !== "tpl" && l.title === "Packing template",
    );
    expect(copy!.kind).toBe("list");
    expect(data.items.filter((i: PocketItem) => i.listId === "tpl")).toHaveLength(1);
    expect(data.items.find((i: PocketItem) => i.listId === copy!.id)).toMatchObject({
      text: "Passport",
      done: false,
    });
  });
});
