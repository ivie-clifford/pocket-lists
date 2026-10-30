import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { usePocket } from "@/lib/pocket/store";
import { buildBackup, downloadFile, validateBackup } from "@/lib/pocket/backup";
import { toISODate } from "@/lib/pocket/dates";
import type { PocketData } from "@/lib/pocket/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Pocket Lists" },
      { name: "description", content: "Back up and restore your lists, stored only on this device." },
      { property: "og:title", content: "Settings — Pocket Lists" },
      { property: "og:description", content: "Back up and restore your lists, stored only on this device." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { lists, items, replaceAll } = usePocket();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PocketData | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const row = "flex h-14 w-full items-center gap-3 border-b border-border/70 text-left";

  const onFile = async (file: File) => {
    const result = validateBackup(await file.text());
    if (!result.ok) toast.error(result.error, { description: "Nothing was changed." });
    else setPending(result.data);
    if (fileRef.current) fileRef.current.value = "";
  };

  const count = (d: PocketData) => {
    const l = d.lists.filter((x) => x.kind === "list").length;
    const t = d.lists.filter((x) => x.kind === "template").length;
    return `${l} list${l === 1 ? "" : "s"}, ${t} template${t === 1 ? "" : "s"} and ${d.items.length} item${d.items.length === 1 ? "" : "s"}`;
  };

  return (
    <section>
      <h1 className="mt-4 text-[2.5rem] leading-none">Settings</h1>
      <p className="mt-3 text-muted-foreground">
        Everything is stored only on this device. Make a backup now and then — clearing your browser data would erase it.
      </p>

      <h2 className="mt-8 font-sans text-sm font-medium tracking-wide text-muted-foreground uppercase">Backup</h2>
      <button
        className={row}
        onClick={() =>
          downloadFile(`pocket-lists-backup-${toISODate(new Date())}.json`, JSON.stringify(buildBackup({ lists, items }), null, 2), "application/json")
        }
      >
        <Download className="h-5 w-5 text-primary" /> Export backup
      </button>
      <button className={row} onClick={() => fileRef.current?.click()}>
        <Upload className="h-5 w-5 text-primary" /> Restore from backup…
      </button>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />

      <h2 className="mt-8 font-sans text-sm font-medium tracking-wide text-muted-foreground uppercase">Data</h2>
      <button className={`${row} text-destructive`} onClick={() => setConfirmClear(true)}>
        Clear all data
      </button>

      <h2 className="mt-8 font-sans text-sm font-medium tracking-wide text-muted-foreground uppercase">About</h2>
      <p className="mt-2 text-muted-foreground">
        Pocket Lists works offline once opened. On your phone, use “Add to Home Screen” to keep it like an app.
      </p>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Replace everything?</AlertDialogTitle>
          <AlertDialogDescription>
            This backup has {pending && count(pending)}. Restoring replaces all current lists and tasks on this device. This can't be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!pending) return;
                await replaceAll(pending);
                setPending(null);
                toast("Backup restored");
              }}
            >
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogTitle>Clear all data?</AlertDialogTitle>
          <AlertDialogDescription>Every list, template and task on this device will be erased. Export a backup first if unsure.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                await replaceAll({ lists: [], items: [] });
                toast("All data cleared");
              }}
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
