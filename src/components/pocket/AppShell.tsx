import { useMemo, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ListsPane } from "./ListsPane";
import { LayoutList, Plus, Settings, Sun, Copy } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { PocketProvider, usePocket } from "@/lib/pocket/store";
import { ItemSheet } from "./ItemSheet";
import { QuickAdd, type QuickAddOpts } from "./QuickAdd";
import { UICtx } from "./ui-state";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <PocketProvider>
      <Shell>{children}</Shell>
    </PocketProvider>
  );
}

const CONTENT_W = "mx-auto w-full max-w-lg md:max-w-xl lg:max-w-2xl";

function Shell({ children }: { children: ReactNode }) {
  const { ready, lists } = usePocket();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const selectedId = pathname.match(/^\/lists\/([^/]+)\/?$/)?.[1];
  const selected = lists.find((list) => list.id === selectedId);
  const section =
    pathname.startsWith("/templates") || selected?.kind === "template"
      ? "/templates"
      : pathname.startsWith("/lists")
        ? "/lists"
        : pathname.startsWith("/settings")
          ? "/settings"
          : "/";
  const split = section === "/lists" || section === "/templates";
  const [itemId, setItemId] = useState<string | null>(null);
  const [qa, setQa] = useState<{ open: boolean; opts: QuickAddOpts }>({ open: false, opts: {} });
  const ui = useMemo(
    () => ({
      openItem: setItemId,
      openQuickAdd: (opts: QuickAddOpts = {}) => setQa({ open: true, opts }),
    }),
    [],
  );

  return (
    <UICtx.Provider value={ui}>
      {/* Left rail: wide screens only */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-background px-4 py-6 lg:flex">
        <Link to="/" className="px-3 font-serif text-xl italic text-ink-soft">
          Pocket Lists
        </Link>
        <button
          onClick={() =>
            ui.openQuickAdd({
              mode: section === "/templates" ? "template" : section === "/lists" ? "list" : "task",
            })
          }
          className="mt-6 inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
        <nav className="mt-6 flex flex-col gap-0.5" aria-label="Main">
          <RailTab
            selected={section === "/"}
            to="/"
            icon={<Sun className="h-5 w-5" />}
            label="Today"
          />
          <RailTab
            selected={section === "/lists"}
            to="/lists"
            icon={<LayoutList className="h-5 w-5" />}
            label="Lists"
          />
          <RailTab
            selected={section === "/templates"}
            to="/templates"
            icon={<Copy className="h-5 w-5" />}
            label="Templates"
          />
        </nav>
        <div className="mt-auto">
          <RailTab
            selected={section === "/settings"}
            to="/settings"
            icon={<Settings className="h-5 w-5" />}
            label="Settings"
          />
        </div>
      </aside>

      {split && <ListsPane kind={section === "/templates" ? "template" : "list"} />}

      <div className={`flex min-h-dvh flex-col ${split ? "lg:pl-[35rem]" : "lg:pl-60"}`}>
        <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-background">
          <div
            className={`${CONTENT_W} flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-3`}
          >
            <Link to="/" className="font-serif text-lg italic text-ink-soft lg:hidden">
              Pocket Lists
            </Link>
            <span aria-hidden className="hidden lg:block" />
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  ui.openQuickAdd({
                    mode:
                      section === "/templates"
                        ? "template"
                        : section === "/lists"
                          ? "list"
                          : "task",
                  })
                }
                className="inline-flex h-11 items-center gap-1 rounded-full bg-primary px-4 text-primary-foreground lg:hidden"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
              <Link
                to="/settings"
                aria-label="Settings"
                className="-mr-2 grid h-11 w-11 place-items-center rounded-full text-ink-soft hover:bg-muted lg:hidden"
              >
                <Settings className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </header>
        <main className={`${CONTENT_W} flex-1 px-5 pb-36 lg:pb-16`}>{ready ? children : null}</main>
      </div>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-3">
          <NavTab
            selected={section === "/"}
            to="/"
            icon={<Sun className="h-5 w-5" />}
            label="Today"
          />
          <NavTab
            selected={section === "/lists"}
            to="/lists"
            icon={<LayoutList className="h-5 w-5" />}
            label="Lists"
          />
          <NavTab
            selected={section === "/templates"}
            to="/templates"
            icon={<Copy className="h-5 w-5" />}
            label="Templates"
          />
        </div>
      </nav>

      <ItemSheet itemId={itemId} onClose={() => setItemId(null)} />
      <QuickAdd
        open={qa.open}
        opts={qa.opts}
        onClose={() => setQa((s) => ({ ...s, open: false }))}
      />
      <Toaster position="top-center" />
    </UICtx.Provider>
  );
}

function NavTab({
  to,
  icon,
  label,
  selected,
}: {
  to: "/" | "/lists" | "/templates";
  icon: ReactNode;
  label: string;
  selected: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      activeProps={{ "aria-current": selected ? "page" : undefined }}
      inactiveProps={{ "aria-current": selected ? "page" : undefined }}
      data-current={selected ? "true" : undefined}
      className="flex h-16 flex-col items-center justify-center gap-0.5 text-[12px] text-muted-foreground data-[current=true]:text-primary"
    >
      {icon}
      {label}
    </Link>
  );
}

function RailTab({
  to,
  icon,
  label,
  selected,
}: {
  to: "/" | "/lists" | "/templates" | "/settings";
  icon: ReactNode;
  label: string;
  selected: boolean;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      activeProps={{ "aria-current": selected ? "page" : undefined }}
      inactiveProps={{ "aria-current": selected ? "page" : undefined }}
      data-current={selected ? "true" : undefined}
      className="flex h-11 items-center gap-3 rounded-full px-3 text-[15px] text-muted-foreground hover:bg-muted data-[current=true]:bg-accent data-[current=true]:font-medium data-[current=true]:text-accent-foreground"
    >
      {icon}
      {label}
    </Link>
  );
}
