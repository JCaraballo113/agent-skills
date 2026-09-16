---
name: agent-rules
description: Encode working conventions as one rule file per concern in .claude/rules/ — testing (TDD, happy/negative path, coverage as discovery), migrations, design-system (atomic design vocabulary, content extremes, motion), code-review, coding-standard-updates (a judgment-level CODING_STANDARDS.md canon, gated by a five-point style-vs-decision test, every entry standing on its own), subagent-model-tiering (advisory escalation, parallel safety), improve-the-territory (leave touched code better than found), agent-summaries (debrief, not changelog) — generalized to the project at hand, any ecosystem. Use when the user says "setup agent rules", "encode the agent rules", or invokes setup-tooling.
---

# Agent Rules

Encode the working conventions as one rule file per concern in
`.claude/rules/` — checked in, loaded as project instructions every
session. Write them generalized to the project at hand (its actual
domains, scripts, and stack), never with another app's specifics.

Each rule's full template lives in [`rules/`](rules/); the index below
only routes. For every rule whose "applies" condition the project meets,
read its template file, then write the generalized rule from it.

Some rules gate on a skill being installed. The **installed-check** —
inline this wording into each generated rule that uses it, so the rule
stands alone in the target repo: *the skill counts as installed when it
appears in the available-skills list in any scope — global, project, or
plugin — possibly namespaced (e.g. `mattpocock-skills:tdd`);
a name match under any namespace counts, and the list beats guessing
filesystem paths.*

The rules:

- [`testing.md`](./rules/testing.md) (every project) — test-first via
  `tdd`, happy/negative grouping, domain-folder layout, coverage as a
  discovery tool.
- [`migrations.md`](./rules/migrations.md) (only when the project has a
  DB) — local dev pushes, deployed environments migrate; the migration
  lands in the same commit as the schema change.
- [`design-system.md`](./rules/design-system.md) (frontend projects
  only) — `/impeccable` as the quality bar, atomic-design granularity
  vocabulary, content/state extremes, motion, theming, responsive
  matrix.
- [`code-review.md`](./rules/code-review.md) (every project) — run
  `/code-review` and fix findings before every commit.
- [`coding-standard-updates.md`](./rules/coding-standard-updates.md) (every
  project) — a root `CODING_STANDARDS.md` seeded from the project's own
  conventions, plus the gate it changes through: propose first, five-point
  test (general · expression-not-decision · machine-can't-judge ·
  outlives-implementation · refusable), every entry stands on its own (no
  ADR pointers), entries migrate out, written with `writing-for-agents`.
- [`subagent-model-tiering.md`](./rules/subagent-model-tiering.md)
  (every project) — model tiering (cheap / mid / heavy-hitter) by role,
  heavy tier opt-in, advisory escalation, spawner-as-reviewer, parallel
  execution safety.
- [`improve-the-territory.md`](./rules/improve-the-territory.md) (every
  project) — existing code is precedent, not gospel; leave touched
  patterns better than found.
- [`agent-summaries.md`](./rules/agent-summaries.md) (every project) —
  reports to a human are debriefs, not changelogs: outcome first,
  effects over internals, "done" / "needs you" / "caveats" kept
  separate.

When installing these rules, if a skill in
[skill.deps.json](./skill.deps.json) isn't installed, prompt the user to
run its install command first.

Done when every applicable rule exists in `.claude/rules/`, written from
its template and generalized to this project, every skill-gated rule
carries the installed-check wording inline, and `CODING_STANDARDS.md` exists at
the root with its header and every seeded section approved by the human.
