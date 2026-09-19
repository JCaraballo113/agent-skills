---
name: agent-rules
description: Encode checked-in agent conventions by concern — testing, migrations, design system, voice, round trips, guarded state, intent before mechanism, code review, coding standards, subagent model tiering, improve-the-territory, and agent summaries — generalized to the project at hand in the host's native instruction format. Use when the user says "setup agent rules", "encode the agent rules", or invokes setup-tooling.
---

# Agent Rules

Encode the working conventions in checked-in project instructions.
Write them generalized to the project at hand (its actual domains,
scripts, and stack), never with another app's specifics.

Use the host's native instruction format:

- In Claude Code, write one file per concern under `.claude/rules/`.
- In Codex, create or update the root `AGENTS.md`, preserving existing
  instructions and adding one `##` section per applicable concern.

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
- [`voice.md`](./rules/voice.md) (projects with client-visible copy) —
  one copy table per surface, vocabulary from the domain doc, and a guard
  test that renders every entry and refuses the banned list.
- [`round-trips.md`](./rules/round-trips.md) (projects that read over a
  network) — count a flow's round trips: independent reads go out
  together, batchable reads go through the batcher, and a read that waits
  carries its reason.
- [`guarded-state.md`](./rules/guarded-state.md) (projects with state a
  person must not be moved out of freely — a request in flight, an unsaved
  edit, a flow mid-way) — the guard belongs to the state, not to the control
  that first enforced it: a new control inherits nothing, the second call
  site means the guard is in the wrong place, and the invariant is pinned
  once per control that can violate it.
- [`intent-before-mechanism.md`](./rules/intent-before-mechanism.md) (every
  project) — names, structure, and tests state the chosen behavior; mechanics
  serve that decision.
- [`code-review.md`](./rules/code-review.md) (every project) — run the
  `code-review` skill and fix findings before every commit.
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
  reports to a human are debriefs, not changelogs: outcome first, in
  ASD-STE100 Simplified Technical English with the project's ubiquitous
  language, effects over internals, "done" / "needs you" / "caveats"
  kept separate.

When installing these rules, if a skill in
[skill.deps.json](./skill.deps.json) isn't installed, prompt the user to
run its install command first.

Done when every applicable rule exists in the host's native checked-in
instruction location, written from its template and generalized to this
project, every skill-gated rule carries the installed-check wording inline,
and `CODING_STANDARDS.md` exists at the root with its header and every seeded
section approved by the human.
