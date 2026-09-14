# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A Claude Code **plugin** (`john-superpowers`) that ships a collection of skills, plus its own single-plugin **marketplace** (`jcaraballo`) so it installs straight from GitHub. There is no application code, no build step, no test suite, no dependencies — the entire product is markdown under `skills/` plus two manifests in `.claude-plugin/`.

The audience for everything you write here is *another agent at runtime*, not a human reader. Prose is instruction, not documentation.

## Commands

```bash
claude plugin validate . --strict    # the only check that exists; run before committing
```

Applying local edits to the installed plugin (from inside Claude Code):

```
/plugin marketplace update jcaraballo
/reload-plugins
```

Never edit the installed copy under Claude Code's plugin directory — edit `skills/<name>/SKILL.md` here, then re-run the two commands above.

## Architecture

### Skill anatomy

```
skills/<name>/
  SKILL.md            # required: YAML frontmatter + body
  skill.deps.json     # optional: external dependencies
  <SUPPORT>.md        # optional: progressively-disclosed detail
```

Frontmatter keys in use:

- `name` — must match the directory name.
- `description` — **this is the routing logic.** Claude decides whether to auto-invoke a skill from this field alone, so it names concrete triggers ("use when the user says X", "do NOT use for Y"), not a summary of the body.
- `disable-model-invocation: true` — for skills that only make sense when a human runs them (`grill-unknowns`, `teach-me`, `implement-design`, `to-design-spec`, `to-design-tickets`). These become slash-command-only.
- `argument-hint` — prompt text when the slash command takes an argument (`teach-me`).

Cross-skill references always use the installed namespace: `/john-superpowers:<name>`.

### Progressive disclosure

SKILL.md stays short and **routes**; heavy specs live in sibling files loaded only when needed. This is deliberate and was arrived at through refactors (`refactor(agent-rules): disclose large rules to reference files`) — don't inline a support file back into a SKILL.md.

- `agent-rules/SKILL.md` is a 59-line index over eight rule templates in `agent-rules/rules/`.
- `lint-guardrails/SKILL.md` holds ecosystem-agnostic philosophy; `ESLINT.md` holds the JS/TS implementation.
- `open-pr/BODY-FORMAT.md`, `html-artifact/TEMPLATE.html`, `teach-me/{CONFIG,NOTION,OBSIDIAN,VISUALS}.md`, `improve-user-experience/{BRIDGING,BRIDGE-DESIGN,DELIGHT,JOURNEY-REPORT,LANGUAGE,DECISION-RECORD}.md` follow the same split.

The corollary is a standing anti-duplication rule (see `refactor(skills): dedup sweep`): if one skill already states a convention, another skill points at it rather than restating it.

### Composition graph

Skills are modules that invoke each other, not standalone scripts.

- **Bootstrap** — `setup-tooling` is the orchestrator: it runs an intent interview (ecosystem, platform, project type, frontend, DB, existing code) *before* installing anything, then composes `setup-js-stack` (web) and/or `setup-expo-stack` (mobile), plus `lint-guardrails`, `design-tooling` (frontend only), and `agent-rules`. Adding a new stack module means wiring it into `setup-tooling`'s step 2.
- **Agent rules** — `agent-rules` writes one file per concern into the *target* project's `.claude/rules/`. Templates are generalized: they must be rewritten against the target project's real domains and scripts, never copied with another app's specifics.
- **Design pipeline** — `to-design-spec` → `to-design-tickets` → `implement-design`, all Pencil-MCP based, mirroring the code-work spec/tickets/implement pipeline; `design-tooling` sets up the tooling they assume.
- **PR pipeline** — `open-pr` (author a PR), `pr-review-status` (read-only review overview), `triage-pr-comments` (act on comments).
- **Unknowns** — `grill-unknowns` is a thin composer over `finding-unknowns`, which itself layers on the external `grilling` skill.

### External dependencies

Anything not shipped in this plugin — other skills, MCP servers, system CLIs — is declared in `skills/<name>/skill.deps.json` as a map of dep name → install command. SKILL.md then links the deps file ("if a skill in [skill.deps.json](./skill.deps.json) isn't installed, prompt the user to run its install command first") instead of hardcoding commands in prose.

OS-dependent installs (typical for CLIs) use an object keyed by the platform name the agent sees:

```json
{
  "grilling": "npx skills add https://github.com/mattpocock/skills --skill grilling",
  "jq": { "darwin": "brew install jq", "linux": "sudo apt install jq", "win32": "winget install jqlang.jq" }
}
```

**Never install a declared dep silently** — prompt the user with the command.

### The installed-check

Skills detect other skills by name in the available-skills list, in **any scope** (global, project, plugin), **possibly namespaced** — a name match under any namespace counts, and the list beats guessing filesystem paths. `agent-rules/SKILL.md` inlines this wording verbatim into every generated rule so the rule stands alone in the target repo; reuse that phrasing rather than inventing a variant.

## Conventions when changing a skill

1. Edit `skills/<name>/SKILL.md` (or its support file).
2. Update the skills table in `README.md` — it is a maintained index, kept in the same commit as the change.
3. Bump `version` in `.claude-plugin/plugin.json` — either in the feature commit or as a following `chore: bump plugin version to X.Y.Z` commit. Breaking reorganizations of the skill set bump major (`feat!: split setup-js-tooling into setup-tooling + taste/stack modules` → 2.0.0).
4. `claude plugin validate . --strict`.
5. Commit with conventional-commit format, scoped to the skill: `feat(agent-rules): ...`, `refactor(finding-unknowns): ...`, `docs(autopilot): ...`.

## Writing style for skill bodies

- Imperative and decisive — the body tells the agent what to do, with the ordering and gates that matter, not options to weigh.
- Most skills use markdown headers as the spine, often ending in a "Done when …" clause that defines completion. Two heavier procedural skills (`open-pr`, `teach-me`) wrap the body in `<what-to-do>` / `<supporting-info>` tags — a summary of behavior up front, mechanics below.
- Interview-driven skills ask **one question at a time** and propose a recommended answer drawn from what was read; they never batch questions or guess.
- Preconditions are listed explicitly with "stop at the first failure and tell the user".
