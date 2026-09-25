# agent-skills

Personal collection of agent skills for [Claude Code](https://docs.claude.com/en/docs/claude-code) and Codex. The repo doubles as its own plugin marketplace, so it installs directly from GitHub — portable across machines.

## Install

Inside Claude Code:

```
/plugin marketplace add JCaraballo113/agent-skills
/plugin install agent-skills@jcaraballo
```

### Codex

```sh
codex plugin marketplace add JCaraballo113/agent-skills
codex plugin add agent-skills@jcaraballo
```

Codex supports this marketplace's Claude-format metadata and also reads the
Codex manifest. Skills are invoked as `$<name>` or selected from their
descriptions.

### Local development install

On a machine where this repo is cloned and you want edits picked up without pushing to GitHub, add the marketplace from the local path instead:

```
/plugin marketplace add ~/Documents/repos/agent-skills
/plugin install agent-skills@jcaraballo
```

## Updating

After pulling (or pushing from another machine):

```
/plugin marketplace update jcaraballo
/reload-plugins
```

`/reload-plugins` applies changes in the active session; restarting Claude Code also works.

In Codex, rerun `codex plugin add agent-skills@jcaraballo` after updating
the marketplace, then start a new thread to use the updated skills.

## Uninstall

```
/plugin uninstall agent-skills@jcaraballo
```

## Skills

Skills live under [`skills/`](./skills) and are shared by the Claude Code and Codex plugin manifests. Claude invokes them as `/agent-skills:<name>`; Codex makes them available as `$<name>`. Both can select a skill from its description.

| Skill | Description |
|---|---|
| [agent-rules](./skills/agent-rules/SKILL.md) | Encode working conventions by concern in the host's native checked-in instruction format — testing (TDD, happy/negative path, coverage as discovery), migrations, design-system (atomic vocabulary + content extremes), voice (a copy table per surface + a banned-list guard), round-trips, code-review, coding-standard-updates (a gated CODING_STANDARDS.md canon), sub-agents (model tiering), agent-summaries (debrief, not changelog) — generalized to the project, any ecosystem. |
| [clean-mac-hdd](./skills/clean-mac-hdd/SKILL.md) | Diagnose what fills a Mac's disk — measure the Data volume, attribute every large folder to its producer (regenerable cache / leak / data), report a table, then on the user's go-ahead reclaim caches and leaks and patch each leaking producer. Ships a catalog of known offenders (`OFFENDERS.md`) that grows with every run. |
| [clean-windows-hdd](./skills/clean-windows-hdd/SKILL.md) | The Windows mirror of `clean-mac-hdd` — measure the volumes, attribute every large folder to its producer (regenerable cache / leak / data), report a table, then on the user's go-ahead reclaim and patch. Its `OFFENDERS.md` covers WSL and Docker `.vhdx` files, hibernation, WinSxS, Windows.old, package caches, emulator images. |
| [clean-wsl](./skills/clean-wsl/SKILL.md) | Reclaim space in a WSL 2 distro across both layers: inside Linux (apt, journal, Docker, caches) and the `ext4.vhdx` on the Windows drive that grows on every write and never shrinks by itself — `fstrim`, `wsl --shutdown`, then sparse mode / `Optimize-VHD` / `diskpart` compaction. |
| [cleanup](./skills/cleanup/SKILL.md) | Design-level cleanup of the current change (or the whole codebase when nothing is in flight) — recomputation, compat shims, dead guards, point-of-use dedup, each redundant against something upstream — findings printed, fixed, and re-inspected to a fixed point. |
| [design-tooling](./skills/design-tooling/SKILL.md) | Design-first frontend tooling: every UI designed in the project's design tool — Pencil (`.pen` via its MCP, `PENCIL.md`) or Figma (via the Figma MCP, `FIGMA.md`) — with `impeccable` governing quality; design precedes implementation. Deps declared in its `skill.deps.json`. |
| [improve-user-experience](./skills/improve-user-experience/SKILL.md) | Find "bridging opportunities" — gulfs the user has to cross themselves — using Don Norman's gulf vocabulary (execution / evaluation, signifier, feedback). Walks the flows, presents candidates as a temp-dir HTML report, then grills the chosen one and designs the bridge in Pencil, held to `impeccable`'s bar. Anchored to `EXPERIENCE.md` (human-owned) + `CONTEXT.md`. Requires the Pencil MCP and the `impeccable` skill (declared in its `skill.deps.json`). Use when the user wants to improve UX, reduce friction, or fix where users get stuck. |
| [lint-guardrails](./skills/lint-guardrails/SKILL.md) | AI-guardrail linting philosophy — size/complexity caps that force extraction (cyclomatic and cognitive complexity, block depth, no loop inside a loop), no comments, everything an error, config protected by a deny hook — with per-ecosystem implementations (ESLint for JS/TS in `ESLINT.md`) and a remediation workflow for existing repos. Standalone-safe. |
| [orchestrated-implement](./skills/orchestrated-implement/SKILL.md) | Implements several ready tickets at once: verifies that several ready tickets can run in parallel (blockers, shared outputs, an ownership map of owned vs. shared files), asks which model the implementers run on (or lets the orchestrator pick per ticket), preps one worktree per ticket (named branch from the base, `node_modules` linked, typecheck green) and spawns a fresh implementer onto each (a pointer brief, never a fork), lands them in a decided order with the spawner reviewing each diff, then puts fresh eyes on the whole landing — `cleanup`, then `code-review` against the base. Deps in its `skill.deps.json`. |
| [pr-review-status](./skills/pr-review-status/SKILL.md) | Read-only overview of the current branch's PR review comments — groups into addressed / pending / in-discussion / deferred. No edits, no posts. Pair with `triage-pr-comments` when you want to act on what you see. |
| [setup-animation-tooling](./skills/setup-animation-tooling/SKILL.md) | Animation and illustration tooling: installs the third-party [`anidoodle`](https://github.com/alexgreensh/anidoodle) skill (code-drawn stills, loops, stickers, animated logos and scored films, identical every render) plus Node, ffmpeg and Chromium, idempotently on macOS, Windows and WSL, then scaffolds a project's `art/` workspace. Deps in its `skill.deps.json`. Standalone, or composed by `setup-tooling`. |
| [setup-evm-stack](./skills/setup-evm-stack/SKILL.md) | The EVM layer module for on-chain web projects: wagmi + viem on TanStack Query, a wallet layer per project, vendored ABIs + address provenance under `src/lib/web3/`, the anvil fork trial (`FORK-TRIAL.md` — fork / seed ladder / dev / smoke / unstick + a runbook section) and the fixture-transport DOM test tier (`FIXTURE-TRANSPORT.md` — per-chain fixtures, every wire request recorded, an unfixtured one failing the render). Deps in its `skill.deps.json`. Usually composed by `setup-tooling`. |
| [setup-expo-stack](./skills/setup-expo-stack/SKILL.md) | The Expo/React Native mobile stack module: Expo + Expo Router, NativeWind v5 + Tailwind v4, TanStack Query, Zod, react-native-reanimated, jest-expo, EAS for build/update/CI, all on pnpm with the 1-day package-age guard. Backend decided per project. Defers depth to the `expo:*` skills. Usually composed by `setup-tooling`. |
| [setup-game-dev-tools](./skills/setup-game-dev-tools/SKILL.md) | Game-dev tooling for Claude Code on macOS and native Windows: Blender + the official Blender Lab MCP (`BLENDER.md` — Online Access, add-on from the Lab repo, cloned stdio server) and Unity via its CLI, a 6.0+ Editor, Unity's official Claude Code plugin and the per-project `com.unity.pipeline` bridge (`UNITY.md`), each detected before installing and verified end to end. Sources in `RESEARCH.md`; deps in its `skill.deps.json`. |
| [setup-js-stack](./skills/setup-js-stack/SKILL.md) | The JS/TS web stack module: TanStack Start/Vite/Hono, Query, Form, Drizzle + Docker/Supabase Postgres, Zod, Tailwind, shadcn, Vitest, GitHub CI, all on pnpm with the 1-day package-age guard. Usually composed by `setup-tooling`. |
| [setup-tooling](./skills/setup-tooling/SKILL.md) | Orchestrator: drives an intent interview (ecosystem, platform, project type, frontend, DB, existing code), then composes the stack module(s) — `setup-js-stack` (web) and/or `setup-expo-stack` (mobile) — + `lint-guardrails` + `setup-evm-stack` (on-chain web) + `design-tooling` + `setup-animation-tooling` (illustration/animation assets) + `agent-rules`. Use to bootstrap any project. |
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
