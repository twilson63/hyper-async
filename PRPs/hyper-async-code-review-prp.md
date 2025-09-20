# Project Request Protocol (PRP): Hyper Async Code Review Library – Performance & Security

## Project Overview

- Goal: Design a lightweight, composable code review helper focused on performance and security checks for small JS/TS libraries like hyper-async.
- Scope: Static analysis (lint rules, AST checks), micro-benchmarks, dependency audit, basic supply chain checks; no cloud services required.
- Constraints: ESM-only, Node 18+, minimal deps, fast local execution (<5s typical), CI-friendly.

## Technical Requirements

- Static analysis: Detect anti-patterns (unhandled rejections, side-effects in map/chain, unsafe bimap/bichain flows, use of global fetch in tests without mocks).
- Security checks: `npm audit`-like scan, license allowlist, `package.json` hygiene (scripts, engines), `dist/` integrity (no secrets, no dev-only code).
- Performance: Micro-benchmarks for critical paths (`map`, `chain`, `bimap`, `bichain`, `fold`, `fromPromise`), regression thresholding.
- DX & CI: Single CLI with JSON and pretty output, zero-config defaults; GitHub Action workflow and local `yarn` scripts.
- Extensibility: Pluggable rules; config via `code-review.config.{js,cjs}` with sane defaults.

## Proposed Solutions

1. ESLint + Custom Rules + npm/yarn audit wrapper
2. AST-first CLI (Babel/ts-morph) + built-in perf harness
3. Minimal native Node CLI + external tool orchestration (uvu/bench + license checker)

## Pros / Cons

- Solution 1 (ESLint-centric)
  - Pros: Leverages familiar ecosystem; fast; minimal code; integrates with existing lint.
  - Cons: Limited for perf; security beyond lint needs extra tools; AST checks constrained by ESLint’s rule lifecycle.
- Solution 2 (AST-first custom CLI)
  - Pros: Deep analysis; precise rule authoring; integrated perf runner; single binary UX.
  - Cons: More engineering effort; maintenance of AST tooling; potential slower cold start.
- Solution 3 (Node CLI orchestrator)
  - Pros: Small codebase; composes best-in-class tools; pragmatic; CI-ready quickly.
  - Cons: Fragmented reporting unless carefully unified; cross-tool config drift; perf harness consistency.

## Best Solution

- Pick Solution 3: Orchestrate focused tools via a thin Node CLI that outputs unified JSON/pretty reports. It balances speed to value, low maintenance, and flexibility. Add a small benchmark harness for core ops to close the perf gap.

## Implementation Steps

1. CLI skeleton: `code-review` with commands `analyze`, `perf`, `audit`, `licenses`, `ci`.
2. Static checks: ESLint with custom rules package (`eslint-plugin-hyper-async`):
   - forbid side-effects in `map/chain` callbacks
   - enforce `.js` extension in relative imports
   - detect `fetch` in tests without mock helper
3. Security: Integrate `npm audit --json` (or `yarn npm audit`) and parse; add `license-checker` allowlist.
4. Perf harness: Add `uvu` or `tinybench` suite for `map/chain/bimap/bichain/fold/fromPromise`; baseline JSON stored in `./.cr-baselines.json`.
5. Reporting: Unified JSON + pretty table; exit codes per severity; thresholds configurable.
6. CI: GitHub Action `code-review.yml` running steps on PR; comment summary via `gh` if available.
7. DX scripts: `yarn review:analyze`, `yarn review:perf`, `yarn review:audit`, `yarn review:ci`.

## Success Criteria

- Runs locally under 5s on this repo; CI under 1m.
- Detects intentional violations in seeded fixtures; zero false positives on clean repo.
- Perf suite fails on >10% regression of baseline across core ops.
- Security report flags vulnerable deps and disallowed licenses with clear remediation.
- Single, readable summary plus machine-readable JSON artifact.
