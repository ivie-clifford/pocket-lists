# Development

Built with React, TypeScript, TanStack Start, Tailwind CSS, and IndexedDB.

```sh
git clone https://github.com/ivie-clifford/pocket-lists.git
cd pocket-lists
npm install
npm run dev
```

Checks:

```sh
npm test
npx tsc --noEmit
STATIC_BUILD=1 npm run build
```

Vercel uses the build settings in `vercel.json` to serve the static output. Lovable and GitHub remain connected: repository changes sync back to the editor, and pushes to the production branch trigger Vercel builds.


## Repository layout

| Location | Purpose |
| --- | --- |
| `src/` | App code, components, browser storage and tests |
| `public/` | App icons, manifest and public assets |
| `docs/` | Supporting project documentation |
| `README.md` | Start here: product, use, status and links |
| `AGENTS.md` | Instructions for coding tools |
| `.lovable/` | Lovable-managed project metadata and plan |
| Root configuration files | Dependencies, build, formatting, tests and Vercel settings |

Keep tool configuration in the locations expected by the tools. Do not move it just to reduce the number of root files. Routing-specific conventions remain beside the code in [src/routes/README.md](../src/routes/README.md).

Use the existing Notion project record for the working brief, backlog, test reports and decisions. Add public usage/reference documents here only when useful; do not mirror the editable planning record.
