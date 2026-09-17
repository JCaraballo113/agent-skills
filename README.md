# claude-skills

Personal collection of [Claude Code](https://docs.claude.com/en/docs/claude-code) skills, packaged as a Claude Code **plugin**. The repo doubles as its own single-plugin marketplace, so it installs directly from GitHub — portable across machines.

## Install

Inside Claude Code:

```
/plugin marketplace add JCaraballo113/claude-skills
/plugin install john-superpowers@jcaraballo
```

### Local development install

On a machine where this repo is cloned and you want edits picked up without pushing to GitHub, add the marketplace from the local path instead:

```
/plugin marketplace add ~/Documents/repos/claude-skills
/plugin install john-superpowers@jcaraballo
```

## Updating

After pulling (or pushing from another machine):

```
/plugin marketplace update jcaraballo
/reload-plugins
```

`/reload-plugins` applies changes in the active session; restarting Claude Code also works.

## Uninstall

```
/plugin uninstall john-superpowers@jcaraballo
```

## Skills

Skills live under [`skills/`](./skills). Once the plugin is installed they're invoked as `/john-superpowers:<name>`, and Claude also auto-invokes them from their descriptions.

| Skill | Description |
|---|---|
| [agent-rules](./skills/agent-rules/SKILL.md) | Encode working conventions as one rule file per concern in `.claude/rules/` — testing (TDD, happy/negative path, coverage as discovery), migrations, design-system (atomic vocabulary + content extremes), code-review, coding-standard-updates (a gated CODING_STANDARDS.md canon), sub-agents (model tiering), agent-summaries (debrief, not changelog) — generalized to the project, any ecosystem. |
| [clean-mac-hdd](./skills/clean-mac-hdd/SKILL.md) | Diagnose what fills a Mac's disk — measure the Data volume, attribute every large folder to its producer (regenerable cache / leak / data), report a table, then on the user's go-ahead reclaim caches and leaks and patch each leaking producer. Ships a catalog of known offenders (`OFFENDERS.md`) that grows with every run. |
| [clean-windows-hdd](./skills/clean-windows-hdd/SKILL.md) | The Windows mirror of `clean-mac-hdd` — measure the volumes, attribute every large folder to its producer (regenerable cache / leak / data), report a table, then on the user's go-ahead reclaim and patch. Its `OFFENDERS.md` covers WSL and Docker `.vhdx` files, hibernation, WinSxS, Windows.old, package caches, emulator images. |
| [clean-wsl](./skills/clean-wsl/SKILL.md) | Reclaim space in a WSL 2 distro across both layers: inside Linux (apt, journal, Docker, caches) and the `ext4.vhdx` on the Windows drive that grows on every write and never shrinks by itself — `fstrim`, `wsl --shutdown`, then sparse mode / `Optimize-VHD` / `diskpart` compaction. |
| [cleanup](./skills/cleanup/SKILL.md) | Design-level cleanup of the current change (or the whole codebase when nothing is in flight) — recomputation, compat shims, dead guards, point-of-use dedup, each redundant against something upstream — findings printed, fixed, and re-inspected to a fixed point. |
| [design-tooling](./skills/design-tooling/SKILL.md) | Design-first frontend tooling: every UI designed in Pencil (`.pen` via the MCP) with `impeccable` governing quality; design precedes implementation. Deps declared in its `skill.deps.json`. |
| [html-artifact](./skills/html-artifact/SKILL.md) | Generate a single self-contained HTML artifact (inline CSS + inline SVG + optional inline JS) that visually explains a system, feature, or codebase area. Output is one file in `docs/` that opens offline. Use when the user wants to visualize a system, generate a flow diagram, build a one-pager explainer, or asks to "make an HTML artifact" / "visualize X" / "explain X visually". Good for state machines, planner/decision logic, data flows, and architectural overviews with optional interactive widgets. |
| [implement-design](./skills/implement-design/SKILL.md) | Implement a design ticket or spec in Pencil — the design-work mirror of `/implement`. Two passes per screen, every state and matrix variant, screenshot-verified against the design-system rule and `impeccable`, closed demoably. Deps in its `skill.deps.json`. |
| [improve-user-experience](./skills/improve-user-experience/SKILL.md) | Find "bridging opportunities" — gulfs the user has to cross themselves — using Don Norman's gulf vocabulary (execution / evaluation, signifier, feedback). Walks the flows, presents candidates as a temp-dir HTML report, then grills the chosen one and designs the bridge in Pencil, held to `impeccable`'s bar. Anchored to `EXPERIENCE.md` (human-owned) + `CONTEXT.md`. Requires the Pencil MCP and the `impeccable` skill (declared in its `skill.deps.json`). Use when the user wants to improve UX, reduce friction, or fix where users get stuck. |
| [lint-guardrails](./skills/lint-guardrails/SKILL.md) | AI-guardrail linting philosophy — size/complexity caps that force extraction, no comments, everything an error, config protected by a deny hook — with per-ecosystem implementations (ESLint for JS/TS in `ESLINT.md`) and a remediation workflow for existing repos. Standalone-safe. |
| [open-pr](./skills/open-pr/SKILL.md) | Open a reviewer-oriented pull request from the current branch. Reads diff and commits, interrogates the author one question at a time (intent, type, scope, risk, out-of-scope, ticket), builds a What / Why / Notes-for-reviewers body inline, then pushes and opens via `gh` as a draft by default. Honors any repo PR template. |
| [orchestrated-implement](./skills/orchestrated-implement/SKILL.md) | Implements several ready tickets at once: verifies that several ready tickets can run in parallel (blockers, shared outputs, an ownership map of owned vs. shared files), asks which model the implementers run on (or lets the orchestrator pick per ticket), preps one worktree per ticket (named branch from the base, `node_modules` linked, typecheck green) and spawns a fresh implementer onto each (a pointer brief, never a fork), lands them in a decided order with the spawner reviewing each diff, then puts fresh eyes on the whole landing — `cleanup`, then `/code-review` against the base. Deps in its `skill.deps.json`. |
| [pr-review-status](./skills/pr-review-status/SKILL.md) | Read-only overview of the current branch's PR review comments — groups into addressed / pending / in-discussion / deferred. No edits, no posts. Pair with `triage-pr-comments` when you want to act on what you see. |
| [setup-expo-stack](./skills/setup-expo-stack/SKILL.md) | The Expo/React Native mobile stack module: Expo + Expo Router, NativeWind v5 + Tailwind v4, TanStack Query, Zod, react-native-reanimated, jest-expo, EAS for build/update/CI, all on pnpm with the 1-day package-age guard. Backend decided per project. Defers depth to the `expo:*` skills. Usually composed by `setup-tooling`. |
| [setup-js-stack](./skills/setup-js-stack/SKILL.md) | The JS/TS web stack module: TanStack Start/Vite/Hono, Query, Form, Drizzle + Docker/Supabase Postgres, Zod, Tailwind, shadcn, Vitest, GitHub CI, all on pnpm with the 1-day package-age guard. Usually composed by `setup-tooling`. |
| [setup-tooling](./skills/setup-tooling/SKILL.md) | Orchestrator: drives an intent interview (ecosystem, platform, project type, frontend, DB, existing code), then composes the stack module(s) — `setup-js-stack` (web) and/or `setup-expo-stack` (mobile) — + `lint-guardrails` + `design-tooling` + `agent-rules`. Use to bootstrap any project. |
| [teach-me](./skills/teach-me/SKILL.md) | A teaching session that makes sure you deeply understand a specific piece of work in this repo. Grounds itself in the code, git history, and ADRs, then walks you through the problem, the solution, and the broader context one item at a time — restating, drilling the whys, and quizzing — and won't finish until you've demonstrated mastery. Optionally saves durable study notes to Obsidian or Notion. |
| [to-design-spec](./skills/to-design-spec/SKILL.md) | Turn the current conversation into a **design spec** — surfaces, Jobs, design decisions, done bar — published to the tracker. The design-work mirror of `/to-spec`. Deps in its `skill.deps.json`. |
| [to-design-tickets](./skills/to-design-tickets/SKILL.md) | Break a design spec into per-screen tickets — one screen all the way through the variant matrix (hard gate), artifact-dependency edges only, expand–contract for matrix/component wide refactors. The design-work mirror of `/to-tickets`. Deps in its `skill.deps.json`. |
| [triage-pr-comments](./skills/triage-pr-comments/SKILL.md) | Active triage workflow: classifies each comment into one of five states (valid-fix / partial / invalid / defer / needs-info), asks clarifying questions when ambiguous, implements approved fixes, and gates commit/push/reply on explicit user approval. |

## Editing workflow

The installed plugin is managed by Claude Code's plugin system — never edit installed copies directly. To change a skill:

1. Edit in the repo: `skills/<skill>/SKILL.md`
2. Commit + push (skip the push if the marketplace was added from the local path)
3. `/plugin marketplace update jcaraballo` then `/reload-plugins`

## Adding a new skill

Add a skill by hand:

1. Create `skills/<name>/SKILL.md` with frontmatter (`name`, `description`) — see existing skills for examples.
2. If the skill needs anything that doesn't ship in this plugin — external skills, MCP servers, system CLIs — declare it in `skills/<name>/skill.deps.json`, a map of dep name → install command (like a `package.json` for agent dependencies), and have the SKILL.md tell Claude to prompt the user with the install command when a dep is missing. When the install command is OS-dependent (typical for CLIs), the value is an object keyed by platform — `darwin` / `linux` / `win32`, matching the platform name the agent sees — and Claude uses the entry for the current OS:

   ```json
   {
     "grilling": "npx skills add https://github.com/mattpocock/skills --skill grilling",
     "jq": {
       "darwin": "brew install jq",
       "linux": "sudo apt install jq",
       "win32": "winget install jqlang.jq"
     }
   }
   ```

3. Validate: `claude plugin validate . --strict`
4. Commit + push, then `/plugin marketplace update jcaraballo` and `/reload-plugins`.

The `description` field is what Claude uses to decide when to invoke the skill, so make it specific about the triggers (e.g. "use when user says X" / "use when Y condition").
