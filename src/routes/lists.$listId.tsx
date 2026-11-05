import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Archive, ArchiveRestore, Copy, Play, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePocket } from "@/lib/pocket/store";
import { SortableItems } from "@/components/pocket/SortableItems";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/lists/$listId")({
  head: () => ({
    meta: [
      { title: "List — Pocket Lists" },
      { name: "description", content: "Check off, add, reorder and reset items on this list." },
      { property: "og:title", content: "List — Pocket Lists" },
      { property: "og:description", content: "Check off, add, reorder and reset items on this list." },
    ],
  }),
  component: ListPage,
});

function ListPage() {
  const { listId } = Route.useParams();
  const { lists, items, updateList, addItems, resetList, deleteList, duplicateList } = usePocket();
  const navigate = useNavigate();
  const list = lists.find((l) => l.id === listId);
  const [title, setTitle] = useState(list?.title ?? "");
  const [note, setNote] = useState(list?.note ?? "");
  const [newItem, setNewItem] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setTitle(list?.title ?? "");
    setNote(list?.note ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);

  if (!list) {
    return (
      <div className="mt-16 text-center">
        <p className="font-serif text-2xl italic text-ink-soft">This list isn't here.</p>
        <Link to="/lists" className="mt-4 inline-block text-primary">
          Back to lists
        </Link>
      </div>
    );
  }

  const isTemplate = list.kind === "template";
  const mine = items.filter((i) => i.listId === list.id).sort((a, b) => a.order - b.order);
  const done = mine.filter((i) => i.done).length;

  const saveMeta = () => {
    const t = title.trim();
    if (t && t !== list.title) updateList(list.id, { title: t });
    else if (!t) setTitle(list.title);
    if ((note.trim() || undefined) !== list.note) updateList(list.id, { note: note.trim() || undefined });
  };

  const action = "flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-[15px]";

  return (
    <section>
      <Link to={isTemplate ? "/templates" : "/lists"} className="-ml-2 mt-2 inline-flex h-11 lg:hidden items-center gap-1 px-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {isTemplate ? "Templates" : "Lists"}
      </Link>
      {isTemplate && <div className="text-sm tracking-wide text-primary uppercase">Template</div>}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={saveMeta}
        aria-label="List name"
        className="w-full bg-transparent font-serif text-[2.25rem] leading-tight outline-none"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={saveMeta}
        rows={note ? 2 : 1}
        placeholder="Add a note…"
        aria-label="List note"
        className="w-full resize-none bg-transparent text-muted-foreground outline-none placeholder:text-muted-foreground/60"
      />
      {!isTemplate && mine.length > 0 && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(done / mine.length) * 100}%` }} />
        </div>
      )}

      <div className="mt-4">
        <SortableItems listId={list.id} items={mine} />
      </div>

      <form
        className="mt-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newItem.trim()) return;
          addItems([{ text: newItem.trim(), listId: list.id }]);
          setNewItem("");
        }}
      >
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="+ Add an item"
          enterKeyHint="done"
          className="h-14 w-full rounded-2xl border border-dashed border-input bg-transparent px-4 outline-none focus:border-ring focus:bg-card"
        />
      </form>

      <div className="mt-8 flex flex-wrap gap-2">
        {isTemplate ? (
          <button
            className="flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-primary-foreground"
            onClick={() => {
              const l = duplicateList(list.id, "list");
              if (l) {
                toast(`Started “${l.title}”`);
                navigate({ to: "/lists/$listId", params: { listId: l.id } });
              }
            }}
          >
            <Play className="h-4 w-4" /> Start list
          </button>
        ) : (
          <>
            <button className={action} onClick={() => (resetList(list.id), toast("List reset"))} disabled={!done}>
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button className={action} onClick={() => (duplicateList(list.id, "template"), toast("Saved as template"))}>
              <Copy className="h-4 w-4" /> Save as template
            </button>
            <button
              className={action}
              onClick={() => {
                updateList(list.id, { archived: !list.archived });
                toast(list.archived ? "List restored" : "List archived");
                if (!list.archived) navigate({ to: "/lists" });
              }}
            >
              {list.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              {list.archived ? "Unarchive" : "Archive"}
            </button>
          </>
        )}
        <button className={`${action} text-destructive`} onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete “{list.title}”?</AlertDialogTitle>
          <AlertDialogDescription>This removes the {isTemplate ? "template" : "list"} and its {mine.length} items.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteList(list.id);
                navigate({ to: isTemplate ? "/templates" : "/lists" });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
