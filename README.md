# Wallet Map

Interactive wallet/token network visualizer written in TypeScript.

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

```bash
npm install
```

## Development Workflow

Run the watcher and local web server in parallel:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser. The watcher continuously rebuilds `dist/main.js` and refreshing the page reflects changes.

### Alternative scripts

- `npm run build` – Create a one-off production bundle in `dist/`
- `npm run watch` – Rebuild on file changes without serving files
- `npm run serve` – Start the static server only (listens on port 3000)
- `npm run typecheck` – Run the TypeScript compiler in `--noEmit` mode

## Project Structure

- `src/` – TypeScript sources (`main.ts`, `types.ts`)
- `dist/` – Generated JavaScript bundle (overwritten by builds)
- `index.html` – App entry point (loads `dist/main.js`)
- `tsconfig.json` – Strict TypeScript configuration
- `package.json` – npm scripts and dependencies

## Notes

- The Plotly bundle is large (~12 MB). Keep the watcher running to avoid repeated long builds.
- When running from the file system (`file://`), ES modules are blocked by CORS. Always serve over HTTP using `npm run dev` or `npm run serve`.
