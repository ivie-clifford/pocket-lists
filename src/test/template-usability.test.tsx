import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/pocket/AppShell";
import { Route as TemplatesRoute } from "@/routes/templates";
import { Route as ListRoute } from "@/routes/lists.$listId";
import { usePocket } from "@/lib/pocket/store";
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
