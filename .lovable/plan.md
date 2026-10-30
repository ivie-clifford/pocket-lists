# Pocket Lists — v1 Plan (local-first, phone-first)

No accounts, database, Cloud, AI, analytics or integrations. Everything lives on the device.

## Information architecture

```text
Bottom bar (thumb reach):  Today | Lists | Templates | (+) Quick add
Settings (gear, top-right): Backup export/import, Clear data, About
```

- **Today** — items dated today or marked "Today" from any list, plus loose tasks. Thin progress line ("4 of 7"). Priority shown as a small P1/P2/P3 dot, never a badge wall.
- **Lists** — active lists. Tap a list: items, check, add, edit inline, drag to reorder, note, reset (uncheck all), archive, delete. Archived lists in a collapsed section.
- **Templates** — reusable lists (seeded: Packing, Weekly reset, Gym bag, Errands). "Start list" duplicates into an active list.
- **Quick add (+)** — bottom sheet: one field, toggle "Task / New list". "Paste a list" tab: one line per item; parses `P1 | text | Today` (priority/date optional, "Today", "Tomorrow", "This week", or a date). Shows preview before saving.
- **Item detail sheet** — text, priority, date, note, "Add to calendar".

## Key flows
1. Open app → Today → tap circle to check (soft strike + gentle fade, small haptic where supported).
2. + → type → Enter → lands in Today (or chosen list).
3. Templates → Packing → Start list → edits don't affect the template.
4. Paste → preview parsed rows → Add all.
5. Settings → Export → downloads `pocket-lists-backup-YYYY-MM-DD.json`; Import → pick file → confirm "Replace" or "Merge".

## Stored locally (IndexedDB via a tiny wrapper; versioned)
```text
meta:     { schemaVersion, createdAt }
lists:    { id, title, kind: "list"|"template", note?, archived, order, createdAt, updatedAt, source? }
items:    { id, listId|null, text, done, doneAt?, priority?: 1|2|3, due?: ISO date | "this-week",
            note?, order, createdAt, updatedAt, source?, externalId? }
```
- UUID ids + `updatedAt` + optional `source`/`externalId` fields make future sync and email-triage intake a matter of adding an importer, not reshaping data.
- All storage behind one `store` module, so a future synced backend swaps in behind the same interface.

## Offline / install (PWA)
- Web app manifest + icons → "Add to Home Screen" with its own icon, full-screen.
- Offline via `vite-plugin-pwa` generated service worker, registered only in the published app (never in the editor preview, to avoid stale caches). Offline works after first visit to the published URL.

## Export / import / calendar without a backend
- **Export**: serialize all data to JSON, download via a Blob link (share sheet on iOS).
- **Import**: file picker → validate schemaVersion and shape → preview counts → replace or merge (merge by id, newest `updatedAt` wins).
- **Add to calendar**: generate a `.ics` file in the browser (title, date, note) and open/download it; the phone's calendar app shows it for review and save. No calendar permission, no sync.

## Design direction
Warm paper background, ink-dark text, one muted terracotta accent; a legible humanist serif for titles and a clean sans for items; large 48px tap targets; generous spacing, no cards or dashboards. Completion = soft check animation, nothing more.

## Credit estimate (~13.5 available)
| Step | Est. |
|---|---|
| Data model, storage module, design tokens, app shell + bottom nav | 2–3 |
| Today + list detail (check, add, edit, reorder, reset, archive/delete, notes) | 3 |
| Templates + duplicate | 1–1.5 |
| Quick add + paste parser (+ small parser tests) | 1.5 |
| Export/import + .ics | 1–1.5 |
| PWA manifest, icons, guarded offline worker | 1–1.5 |
| Fixes / polish | 1–2 |
| **Total** | **~10.5–13.5** |

Tight but feasible; leaves little buffer for revisions.

## Scope cuts (to protect the budget)
- Reorder via up/down buttons first; drag-and-drop only if budget remains.
- Import = replace only (merge later).
- No dark mode, no recurring auto-reset schedules, no search, no undo history (single "Undo" toast on delete only).
- One generated app icon; no splash screens per device.
- If credits run short, drop offline service worker last-minute and keep install-only (still works as home-screen app, needs connection).

## Future (noted, not built)
Email-triage intake (importer using `source`/`externalId`), accounts + cross-device sync, calendar integration, structured workout/progression mode.
