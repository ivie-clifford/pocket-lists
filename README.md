# Pocket Lists

A calm, local-first checklist notebook for everyday tasks and reusable routines, designed for phones and desktops.

## Start here

- **Use Pocket Lists:** [open the test app](https://pocket-lists.vercel.app/). No account is required.
- **Try a task:** add one for Today, then check its circle to complete it. Tap the task text to edit its date, priority or note, or to find Delete.
- **Try a reusable list:** open Templates and choose Start list to make a working copy.
- **Keep a backup:** use Settings to export your data. See [Your data](#your-data) before switching devices or browser contexts.
- **Development setup:** see the [development guide](docs/development.md).

## Status

Work in progress, not a released v1. The owner reports that the core phone flows, all six desktop acceptance checks, and iPhone Home Screen offline reopening and task persistence checks passed. Offline checks followed the service-worker build repair in commit 7793239. Known usability work and public-release preparation remain.

## Features

- Today view with completion progress, optional priorities and dates, and overdue tasks.
- Lists and reusable templates, with editing, duplication, reordering, reset and archiving.
- Quick task capture and one-item-per-line paste with a preview.
- Optional task and list notes.
- JSON backup export and validated, replace-only restore.
- Calendar-file export for review and saving in a calendar app.

## Your data

Lists and tasks are stored in IndexedDB in the browser context where you use the app. There are no accounts, backend database, runtime AI, analytics integrations, or automatic cross-device sync.

Different devices or browser contexts may have separate data. Export backups before switching browsers or installed-app contexts. Clearing site data removes locally stored lists. Backup files contain your tasks and notes; keep them private and do not commit them.

Generic starter templates are included. Your own saved lists are not part of this repository.

## Development

See [docs/development.md](docs/development.md) for setup, checks, deployment and repository layout.

## Design and release requirements

Mobile and desktop must be considered together for every change. Phone-first prioritizes the phone experience; it does not defer desktop usability. Check touch, mouse and keyboard interactions; narrow and wide layouts; dialogs; scrolling; and data persistence before release.

The latest usability changes add Upcoming and All task filters, clarify individual-task destinations, close Add after saving, provide Done for task edits, and move global Add into the header to avoid covering Create. These changed flows await focused phone and desktop acceptance checks.

## AI-assisted development

Initial implementation used Lovable; subsequent review, fixes and tests used ChatGPT/Codex assistance. Product decisions and release approval remain with the owner. No AI runs inside the app.

## License

No project license has been selected yet. Public source visibility does not itself grant reuse rights; third-party dependencies retain their respective licenses.
