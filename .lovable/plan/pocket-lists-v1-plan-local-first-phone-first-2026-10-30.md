# Pocket Lists — v1 Plan (local-first, phone-first)

No accounts, database, Cloud, AI, analytics, integrations or server code. Everything lives on the device. Ships as static files deployable to Vercel.

## Information architecture

```text
Bottom bar (thumb reach):  Today | Lists | Templates | (+) Quick add
Settings (gear, top-right): Backup export / restore, Clear data, About
```

- **Today** — a live view, not a separate list (see rules below). Thin progress line ("4 of 7"). Priority shown as a small P1/P2/P3 dot.
- **Lists** — active lists. Tap a list: items, check, add, edit inline, drag-and-drop reorder (touch-friendly, with a drag handle), note, reset (uncheck all), archive, delete. Archived lists in a collapsed section.
- **Templates** — reusable lists, seeded with generic starters: Packing, Weekly reset, Gym bag, Launch checklist, Errands. "Start list" duplicates into a new active list; edits never affect the template.
- **Quick add (+)** — bottom sheet: one field, toggle "Task / New list". "Paste a list" tab: one line per item; parses `P1 | text | Today` (priority and date optional; "Today", "Tomorrow", "This week", or a date). Preview before saving.
- **Item detail sheet** — text, priority, date, note, "Add to calendar".

## Today rules
- Shows unfinished and finished-today tasks where due date = today, plus **unfinished overdue** tasks (due before today), shown in a small "Overdue" group at the top.
- Sources: loose tasks (no list) and tasks in active lists. **Excludes** archived lists and templates.
- Today renders the same stored item records, so checking, editing or deleting a task there updates it in its original list (one source of truth; each row shows its list name in small text).
- Quick-add from Today creates a loose task due today.

## "This week" handling
- Stored as a real date, never a floating label: `due` = the coming Sunday (end of the current week), with `dueKind: "week"`.
- Displayed as "This week" while today is on or before that Sunday; it appears in Today only on its final day (Sunday).
- After that Sunday passes and it's unfinished, it becomes overdue like any dated task and shows "Overdue · was this week".

## Key flows
1. Open app → Today → tap circle to check (soft strike + gentle fade, light haptic where supported).
2. + → type → Enter → lands in Today (or chosen list).
3. Templates → Packing → Start list.
4. Paste → preview parsed rows → Add all.
5. Settings → Export → downloads `pocket-lists-backup-YYYY-MM-DD.json`.
6. Settings → Restore → pick file → validated → warning "Restoring replaces all current lists and tasks on this device. This can't be undone." → Replace.

## Stored locally (IndexedDB via a tiny wrapper; versioned)
```text
meta:   { schemaVersion, createdAt }
lists:  { id, title, kind: "list"|"template", note?, archived, order, createdAt, updatedAt, source? }
items:  { id, listId|null, text, done, doneAt?, priority?: 1|2|3,
          due?: ISO date, dueKind?: "day"|"week", note?, order,
          createdAt, updatedAt, source?, externalId? }
```
- UUID ids, `updatedAt`, and optional `source`/`externalId` fields leave room for future email-triage intake and sync without reshaping data.
- All storage behind one store module, so a future synced backend can swap in behind the same interface.

## Offline / install (PWA) — required
- Web app manifest + icons → "Add to Home Screen", full-screen launch.
- `vite-plugin-pwa` generated service worker: precaches the static app shell, network-first for page loads, cache-first for hashed assets. Registered only on the real deployed site (e.g. the Vercel domain), never in the Lovable editor preview.
- After the first visit to the Vercel site, the app opens and works fully offline.

## Static deployment on Vercel
- App is client-only: no server functions, no SSR data, no backend calls.
- Build configured to output a static single-page bundle (prerendered `index.html` shell + assets), plus a `vercel.json` rewriting all paths to `index.html` and serving `sw.js` / manifest with no-cache headers.
- Verified by running the production build locally, serving the static output, and checking offline reload in a headless browser.

## Export / restore / calendar without a backend
- **Export**: serialize all data to JSON and download via a Blob link (iOS share sheet).
- **Restore (replace-only)**: file picker → parse and fully validate (schemaVersion, required fields, types) **before touching any data** → show counts and the replace warning → on confirm, swap all data in one transaction. Invalid files show a clear error and change nothing.
- **Add to calendar**: generate a `.ics` file in the browser (title, date, note) and open it; the phone's calendar shows it for review and saving. No calendar permission, no sync.

## Design direction
Warm paper background, ink-dark text, one muted terracotta accent; legible humanist serif for titles, clean sans for items; 48px tap targets; generous spacing, no cards or dashboards. Completion = soft check animation, nothing more.

## Out of scope for v1
No dark mode, recurring auto-reset schedules, search, or undo history (single "Undo" toast on delete only). One app icon; no per-device splash screens.

## Future (noted, not built)
Email-triage intake (importer using `source`/`externalId`), accounts + cross-device sync, calendar integration, structured workout/progression mode.
