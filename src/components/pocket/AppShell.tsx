import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
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

function Shell({ children }: { children: ReactNode }) {
  const { ready } = usePocket();
  const [itemId, setItemId] = useState<string | null>(null);
  const [qa, setQa] = useState<{ open: boolean; opts: QuickAddOpts }>({ open: false, opts: {} });
  const ui = useMemo(
    () => ({ openItem: setItemId, openQuickAdd: (opts: QuickAddOpts = {}) => setQa({ open: true, opts }) }),
    [],
  );

  return (
    <UICtx.Provider value={ui}>
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
        <header className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-1">
          <Link to="/" className="font-serif text-lg italic text-ink-soft">
            Pocket Lists
          </Link>
          <Link to="/settings" aria-label="Settings" className="-mr-2 grid h-11 w-11 place-items-center rounded-full text-ink-soft hover:bg-muted">
            <Settings className="h-5 w-5" />
          </Link>
        </header>
        <main className="flex-1 px-5 pb-36">{ready ? children : null}</main>
      </div>

      <button
        onClick={() => ui.openQuickAdd()}
        aria-label="Quick add"
        className="fixed right-5 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-40 grid h-15 w-15 place-items-center rounded-full bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/25 active:scale-95"
      >
        <Plus className="h-7 w-7" />
      </button>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-3">
          <NavTab to="/" icon={<Sun className="h-5 w-5" />} label="Today" exact />
          <NavTab to="/lists" icon={<LayoutList className="h-5 w-5" />} label="Lists" />
          <NavTab to="/templates" icon={<Copy className="h-5 w-5" />} label="Templates" />
        </div>
      </nav>

      <ItemSheet itemId={itemId} onClose={() => setItemId(null)} />
      <QuickAdd open={qa.open} opts={qa.opts} onClose={() => setQa((s) => ({ ...s, open: false }))} />
      <Toaster position="top-center" />
    </UICtx.Provider>
  );
}

function NavTab({ to, icon, label, exact }: { to: "/" | "/lists" | "/templates"; icon: ReactNode; label: string; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      className="flex h-16 flex-col items-center justify-center gap-0.5 text-[12px] text-muted-foreground data-[status=active]:text-primary"
    >
      {icon}
      {label}
    </Link>
  );
}
