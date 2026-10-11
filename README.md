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
| [blender-character](./skills/blender-character/SKILL.md) | Build, rig and animate stylized characters in Blender via the Blender MCP as a deterministic script pipeline: metaball sculpting, computed skin weights, quadruped walk with planted feet, research-based eye animation (saccades, event-driven blinks, lid follow), mouth bag + jaw + Rhubarb lip sync, and style rules (`styles/PIXAR.md`). Headless tools in `tools/` (deformation gate with reproducibility hash, stills, renders with voice, contact sheets, native Rhubarb build); cited research in `research/`; a full worked example in `examples/gecko/`. |
| [claude-cloud-sessions-setup](./skills/claude-cloud-sessions-setup/SKILL.md) | Set up Claude Code cloud sessions for a repo: reads its stack, pushes what the cloud must clone, drafts the cloud environment (a setup script for what the VM lacks, the user's plugins included), runs a smoke session to prove the build and tests on the Linux VM, and optionally an issue routine that ships issues labelled `claude` as PRs (claim comments settle races between runs). Facts in `CLOUD-FACTS.md`, the routine's prompt in `ROUTINE-PROMPT.md`, a second routine that keeps its open PRs mergeable after each merge in `CONFLICTS-PROMPT.md`, a third that triages new issues and queues them under an in-flight cap in `TRIAGE-PROMPT.md`, a fourth that merges a PR it judges safe and holds the rest for a person in `MERGE-PROMPT.md`, deps in its `skill.deps.json`. |
| [clean-mac-hdd](./skills/clean-mac-hdd/SKILL.md) | Diagnose what fills a Mac's disk — measure the Data volume, attribute every large folder to its producer (regenerable cache / leak / data), report a table, then on the user's go-ahead reclaim caches and leaks and patch each leaking producer. Ships a catalog of known offenders (`OFFENDERS.md`) that grows with every run. |
| [clean-windows-hdd](./skills/clean-windows-hdd/SKILL.md) | The Windows mirror of `clean-mac-hdd` — measure the volumes, attribute every large folder to its producer (regenerable cache / leak / data), report a table, then on the user's go-ahead reclaim and patch. Its `OFFENDERS.md` covers WSL and Docker `.vhdx` files, hibernation, WinSxS, Windows.old, package caches, emulator images. |
| [clean-wsl](./skills/clean-wsl/SKILL.md) | Reclaim space in a WSL 2 distro across both layers: inside Linux (apt, journal, Docker, caches) and the `ext4.vhdx` on the Windows drive that grows on every write and never shrinks by itself — `fstrim`, `wsl --shutdown`, then sparse mode / `Optimize-VHD` / `diskpart` compaction. |
| [design-tooling](./skills/design-tooling/SKILL.md) | Design-first frontend tooling: every UI designed in the project's design tool — Pencil (`.pen` via its MCP, `PENCIL.md`) or Figma (via the Figma MCP, `FIGMA.md`) — with `impeccable` governing quality; design precedes implementation. Deps declared in its `skill.deps.json`. |
| [guided-review](./skills/guided-review/SKILL.md) | Turn a branch or PR diff into a local guided-review page: short explanations on the left drive a dark code pane on the right that outlines the exact lines each one is about; steps run core change first, comment- and rename-only hunks fold away, notes pin to file and lines and copy out as Markdown for the PR. Guide text follows ASD-STE100 Simplified Technical English and the repo's glossary (built in, no `/wait-what` install). `collect.mjs` → agent-written `review.json` → `render.mjs` (refuses a file in no step or a note off the diff). Deps in its `skill.deps.json`. |
| [improve-user-experience](./skills/improve-user-experience/SKILL.md) | Find "bridging opportunities" — gulfs the user has to cross themselves — using Don Norman's gulf vocabulary (execution / evaluation, signifier, feedback). Walks the flows, presents candidates as a temp-dir HTML report, then grills the chosen one and designs the bridge in Pencil, held to `impeccable`'s bar. Anchored to `EXPERIENCE.md` (human-owned) + `CONTEXT.md`. Requires the Pencil MCP and the `impeccable` skill (declared in its `skill.deps.json`). Use when the user wants to improve UX, reduce friction, or fix where users get stuck. |
| [lint-guardrails](./skills/lint-guardrails/SKILL.md) | AI-guardrail linting philosophy — size/complexity caps that force extraction (cyclomatic and cognitive complexity, block depth, no loop inside a loop), no comments, everything an error, config protected by a deny hook — with per-ecosystem implementations (ESLint for JS/TS in `ESLINT.md`) and a remediation workflow for existing repos. Standalone-safe. |
| [setup-animation-tooling](./skills/setup-animation-tooling/SKILL.md) | Animation and illustration tooling: installs the third-party [`anidoodle`](https://github.com/alexgreensh/anidoodle) skill (code-drawn stills, loops, stickers, animated logos and scored films, identical every render) plus Node, ffmpeg and Chromium, idempotently on macOS, Windows and WSL, then scaffolds a project's `art/` workspace. Deps in its `skill.deps.json`. Standalone, or composed by `setup-tooling`. |
| [setup-evm-stack](./skills/setup-evm-stack/SKILL.md) | The EVM layer module for on-chain web projects: wagmi + viem on TanStack Query, a wallet layer per project, vendored ABIs + address provenance under `src/lib/web3/`, the anvil fork trial (`FORK-TRIAL.md` — fork / seed ladder / dev / smoke / unstick + a runbook section) and the fixture-transport DOM test tier (`FIXTURE-TRANSPORT.md` — per-chain fixtures, every wire request recorded, an unfixtured one failing the render). Deps in its `skill.deps.json`. Usually composed by `setup-tooling`. |
| [setup-expo-stack](./skills/setup-expo-stack/SKILL.md) | The Expo/React Native mobile stack module: Expo + Expo Router, NativeWind v5 + Tailwind v4, TanStack Query, Zod, react-native-reanimated, jest-expo, EAS for build/update/CI, all on pnpm with the 1-day package-age guard. Backend decided per project. Defers depth to the `expo:*` skills. Usually composed by `setup-tooling`. |
| [setup-game-dev-tools](./skills/setup-game-dev-tools/SKILL.md) | Game-dev tooling for Claude Code on macOS and native Windows: Blender + the official Blender Lab MCP (`BLENDER.md` — Online Access, add-on from the Lab repo, cloned stdio server) and Unity via its CLI, a 6.0+ Editor, Unity's official Claude Code plugin and the per-project `com.unity.pipeline` bridge (`UNITY.md`), each detected before installing and verified end to end. Sources in `RESEARCH.md`; deps in its `skill.deps.json`. |
| [setup-js-stack](./skills/setup-js-stack/SKILL.md) | The JS/TS web stack module: TanStack Start/Vite/Hono, Query, Form, Drizzle + Docker/Supabase Postgres, Zod, Tailwind, shadcn, Vitest, GitHub CI, all on pnpm with the 1-day package-age guard. Usually composed by `setup-tooling`. |
| [setup-tooling](./skills/setup-tooling/SKILL.md) | Orchestrator: drives an intent interview (ecosystem, platform, project type, frontend, DB, existing code), then composes the stack module(s) — `setup-js-stack` (web) and/or `setup-expo-stack` (mobile) — + `lint-guardrails` + `setup-evm-stack` (on-chain web) + `design-tooling` + `setup-animation-tooling` (illustration/animation assets) + `agent-rules`. Use to bootstrap any project. |

## jstack

jstack is a working style: one entry skill, `jstack-mode`, matches a task to a playbook and runs the other jstack skills as the steps need them. It is [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan, ported from Cursor to Claude Code. [`docs/jstack-port.md`](./docs/jstack-port.md) lists every change from upstream, and `scripts/check-jstack.sh` fails on any Cursor-only term left behind.

Start with:

```
/agent-skills:setup-jstack                # pick a model per role, once per machine
/agent-skills:jstack-mode <the task>      # route one task through a playbook
claude --agent agent-skills:jstack-agent  # keep the mode on for a whole session
```

`/agent-skills:jstack-help` answers "which skill do I want?".

| Skill | Description |
|---|---|
| [jstack-mode](./skills/jstack-mode/SKILL.md) | The entry point. 23 playbooks (investigation, bug fix, feature, refactoring, perf, hillclimb, forensics, prototype, visual parity, eval, babysit, shipping, autonomous run, orchestrate, autopilot, session pickup, pause, multi-phase plans, worktree cleanup, opening a PR), 24 principles read on demand, and the `watch-pr` and `orch` scripts. |
| [setup-jstack](./skills/setup-jstack/SKILL.md) | Writes `~/.claude/rules/jstack-models.md`: which model each role runs on. Defaults are Fable for judgment, Opus for code, Fable and Opus as review panels, Sonnet for swarm workers. |
| [jstack-help](./skills/jstack-help/SKILL.md) | Which jstack skill fits a question, and how to prompt the mode. |
| [how](./skills/how/SKILL.md), [why](./skills/why/SKILL.md), [teach](./skills/teach/SKILL.md), [recall](./skills/recall/SKILL.md) | Understand code, its history and past sessions before changing anything. |
| [architect](./skills/architect/SKILL.md), [arena](./skills/arena/SKILL.md), [swarm](./skills/swarm/SKILL.md), [interrogate](./skills/interrogate/SKILL.md) | Parallel design runs, bakeoffs, fan-out coverage and adversarial multi-model review. |
| [blast-radius](./skills/blast-radius/SKILL.md), [benchmark-checklist](./skills/benchmark-checklist/SKILL.md) | Prove what a diff could break, and vet a measured number before anyone acts on it. |
| [tdd](./skills/tdd/SKILL.md), [typescript-best-practices](./skills/typescript-best-practices/SKILL.md) | Failing test first; TypeScript rules scoped to `.ts` files. |
| [deslop](./skills/deslop/SKILL.md), [no-comments](./skills/no-comments/SKILL.md), [unslop](./skills/unslop/SKILL.md), [technical-writing](./skills/technical-writing/SKILL.md) | Clean the diff and the prose before commit and review. deslop comes from Cursor's cursor-team-kit. |
| [control-ui](./skills/control-ui/SKILL.md), [control-cli](./skills/control-cli/SKILL.md) | Drive a browser, Electron or terminal app the way a user does, for proof. From cursor-team-kit. |
| [create-verification-skill](./skills/create-verification-skill/SKILL.md), [maintain-verification-skill](./skills/maintain-verification-skill/SKILL.md) | Generate and keep honest a project skill that drives the app and proves changes work. |
| [figure-it-out](./skills/figure-it-out/SKILL.md), [show-me-your-work](./skills/show-me-your-work/SKILL.md) | Design a bespoke run for large or unattended work, with a decision log to audit later. |
| [reflect](./skills/reflect/SKILL.md), [correct](./skills/correct/SKILL.md), [automate-me](./skills/automate-me/SKILL.md) | Learn from sessions: improve skills, make repeated mistakes structurally impossible, generate your own mode. |
| [ketchup](./skills/ketchup/SKILL.md), [bro](./skills/bro/SKILL.md) | Catch up on the chat, or restate the last message in plain words. |

Two agents ship with it: `jstack-agent`, the subagent every playbook delegates to, and `comment-sicko`, which the no-comments skill spawns. `jstack-reader` is the read-only worker for explorers and reviewers. The scripts need [Bun](https://bun.sh) and the GitHub CLI.

jstack is written for Claude Code's Agent tool and plugin agents. Codex loads its skills too, but their subagent steps assume Claude Code.

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

3. Validate: `claude plugin validate . --strict`, and `scripts/check-jstack.sh` when the skill is part of jstack. CI runs both, plus the jstack script tests.
4. Commit + push, then `/plugin marketplace update jcaraballo` and `/reload-plugins`.

The `description` field is what Claude uses to decide when to invoke the skill, so make it specific about the triggers (e.g. "use when user says X" / "use when Y condition").
