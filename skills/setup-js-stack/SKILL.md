---
name: setup-js-stack
description: The JS/TS stack module for setup-tooling — TanStack Start (or Vite for SPAs), TanStack Query/Form, Zustand for client state when needed, GSAP for motion/animation, Hono for pure backends, Drizzle + Docker/Supabase Postgres, Zod, Tailwind, shadcn, Vitest, tsc typecheck and lefthook commit gates, GitHub Actions CI, all on pnpm with the 1-day package-age guard. Use when the user says "setup js tooling", "setup the js stack", or bootstraps a fresh JS/TS repo — usually composed by setup-tooling.
---

# Setup JS Stack

The JS/TS instantiation of the preferred stack. Intent answers (project
type, database, existing code) normally arrive from
`/john-superpowers:setup-tooling`; invoked standalone, ask them first —
never scaffold before the interview, and never re-scaffold over
existing code. One extra detail question is this module's own:
**forms-heavy?** → TanStack Form wired to Zod.

## The stack matrix

| Concern | Full-stack app | SPA | Backend/API |
| --- | --- | --- | --- |
| Framework | TanStack Start | Vite + React + TanStack Router | Hono |
| Data fetching | TanStack Query | TanStack Query | — |
| Client state | Zustand (only if needed) | Zustand (only if needed) | — |
| Forms | TanStack Form + Zod | TanStack Form + Zod | — |
| Validation | Zod (single source of truth, shared client/server) | Zod | Zod (`@hono/zod-validator`) |
| Styling | Tailwind + shadcn | Tailwind + shadcn | — |
| Motion | GSAP (when the UI animates) | GSAP (when the UI animates) | — |
| ORM/DB | Drizzle + Docker/Supabase Postgres | (via its API) | Drizzle + Docker/Supabase Postgres |
| Design | `/john-superpowers:design-tooling` | `/john-superpowers:design-tooling` | — |
| Tests | Vitest | Vitest | Vitest |
| Lint | `/john-superpowers:lint-guardrails` | `/john-superpowers:lint-guardrails` | `/john-superpowers:lint-guardrails` |
| CI | GitHub Actions | GitHub Actions | GitHub Actions |

Scaffolders (verify current flags against the tool's docs before running):

```bash
pnpm create @tanstack/start@latest    # full-stack app
pnpm create vite@latest . --template react-ts   # SPA (add @tanstack/react-router)
pnpm create hono@latest               # backend
pnpm dlx shadcn@latest init           # after Tailwind is in
```

## pnpm baseline (every project, no exceptions)

pnpm is the package manager — not npm, not yarn, in the repo and in CI.

- `packageManager` field pinned to the latest pnpm (check
  `npm view pnpm version`), run via corepack.
- `pnpm-workspace.yaml` with the supply-chain guard — **always**, plus any
  native-build approvals the install flags:

```yaml
minimumReleaseAge: 1440   # a version must be ≥1 day old to install
verifyDepsBeforeRun: false # a linked worktree's symlinked node_modules fails pnpm's pre-run check and triggers a reinstall
```

  With the check off, `pnpm install` runs by hand after a lockfile change.
  pnpm 11 reads this from `pnpm-workspace.yaml`, not `.npmrc`.

- Scripts: `dev`, `build`, `test` (`vitest run`), `test:watch`,
  `test:coverage` (`vitest run --coverage`, via `@vitest/coverage-v8`),
  `lint` (`eslint --max-warnings 0`), `typecheck` (`tsc --noEmit`), and
  `prepare` (`lefthook install`).

## Database (when the interview says yes)

- `docker-compose.dev.yml` running `supabase/postgres` (same engine as
  hosted Supabase) on a **non-default host port** (e.g. 54322) to avoid
  colliding with other local Postgres instances; healthcheck via
  `pg_isready`. Scripts: `db:up` / `db:down`.
- Drizzle: `drizzle-orm` + `drizzle-kit` + `pg`; `db:push` (local dev),
  `db:generate` (committed migrations), `db:migrate` (deploy). The
  same-commit migration rule ships via `/john-superpowers:agent-rules`.
- Vitest `globalSetup` that creates throwaway databases in the dev
  container and pushes the schema — tests never touch a real DB.
- Secrets never in the repo: `.env.example` documents variables only.

## Commit gate via lefthook (every project)

`lefthook` wires the lint/typecheck/test scripts into git so they gate the
branch before code lands (`lefthook` dev dep; the `prepare` script above
installs its hooks on `pnpm install`). Committed `lefthook.yml`:

- **pre-commit** — `eslint --max-warnings 0` on staged `*.{ts,tsx,js,jsx}`
  only: fast, keeps commits snappy.
- **pre-push** — `pnpm typecheck` (`tsc --noEmit`), project-wide and
  slower, so it runs once per push rather than per commit. Add `pnpm test`
  here too to gate tests locally, not only in CI.
- **post-checkout** — `bash scripts/worktree-node-modules.sh`: a linked
  worktree (`git worktree add`, or an agent's `isolation: "worktree"`)
  borrows the main checkout's `node_modules` by symlink instead of a
  per-tree install that costs minutes each; git runs `post-checkout` after
  `git worktree add`, so every creator gets it:

```bash
#!/usr/bin/env bash
set -euo pipefail
common="$(git rev-parse --path-format=absolute --git-common-dir)"
main="$(cd "$common/.." && pwd)"
here="$(git rev-parse --show-toplevel)"
[ "$here" = "$main" ] && exit 0
[ -e "$here/node_modules" ] && exit 0
[ -d "$main/node_modules" ] || exit 0
ln -s "$main/node_modules" "$here/node_modules"
```

  A new dependency in a linked worktree gets a real tree — remove the
  symlink, then install (`pnpm add` through the link refuses with
  `ERR_PNPM_UNEXPECTED_VIRTUAL_STORE` and touches neither side). Agent
  worktrees inside the repo (`.claude/worktrees/`) go in `.gitignore` and
  the linter's ignores, or the main checkout's lint walks into every one.

It's a tripwire, not a sandbox — `git commit --no-verify` bypasses it — so
the same checks run in CI, the backstop that can't be skipped: a local
bypass still fails the PR.

## CI via GitHub Actions (every project)

`.github/workflows/ci.yml`: `lint`, `typecheck`, and `test` jobs on push to
the working branches and PRs to main — `pnpm/action-setup` + `setup-node`
with `cache: pnpm`, `pnpm install --frozen-lockfile`, then `pnpm lint` /
`pnpm typecheck` / `pnpm test`. If the project has a DB, give the test job a
`supabase/postgres` service on the same port the compose file uses, with a
`pg_isready` healthcheck.

If a CLI is missing (pnpm, docker), prompt the user with its install
command from [skill.deps.json](./skill.deps.json).
