AGENTS: Repo Rules and Commands

- Install: `yarn` (Node 18+; ESM via `type: module`).
- Test all: `yarn test` (runs `uvu src`).
- Test one file: `npx uvu src index.test.js` or `node src/index.test.js`.
- Lint: `yarn lint` (ESLint on `src/`).
- Format: `yarn fmt` (Prettier defaults over `src/`).
- Build types: `yarn build:types`; build bundle: `yarn build` → `dist/`.
  Code Style
- Imports: ESM only; include `.js` extensions in relative paths.
- Exports: prefer named; keep default export object mirroring named API.
- Formatting: Prettier defaults (2 spaces, semicolons, double quotes).
- Types: Use JSDoc for public API; `tsc` emits `.d.ts` to `dist/`.
- Naming: camelCase for vars/functions; PascalCase for factory constants (`Resolved`/`Rejected`).
- Errors: model failures with `Async.Rejected`; handle via `bimap/bichain/fold`.
- Promises: wrap effects with `fromPromise`; avoid side-effects in `map/chain`.
- Tests: each file ends with `test.run()`; prefer unit tests, mock network `fetch`.
- Files: edit only `src/`; never hand-edit generated `dist/`.
- Linting: keep rules minimal; fix warnings before commit.
- Repo AI rules: no Cursor or Copilot rule files detected.
- Commits: small, focused; messages explain why, not just what.
