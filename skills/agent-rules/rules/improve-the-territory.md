# `improve-the-territory.md` — the generated rule

Applies to **every project**. Generate the rule naming the project's real shared layers.

Existing code is precedent, not gospel — each copy of a flawed pattern entrenches its debt one file deeper. When a change touches a pattern, leave the territory better than found:

- **Search for shared infrastructure before copying.** Check the project's helper and library layers (`tests/helpers/`, `lib/`, or this project's equivalents) and sibling modules first — the neighbor being mirrored may itself be the outlier.
- **Fix debt in the files already being changed** — duplicated scaffolding, copy-pasted boilerplate, smells flagged in tracked issues.
- **File a follow-up issue for offenders outside the diff.** Improvement rides the territory being touched; repo-wide sweeps get their own issue so the diff stays honest.
- **Escalate uncertainty instead of guessing.** Unsure how (or whether) to improve a piece of debt: ask the spawner — the advisory tier from the subagent-model-tiering instruction. When agent and advisor are both unsure, stop and run the `grill-with-docs` skill with the human to reach the decision together — only when that skill passes the installed-check (wording in SKILL.md); when it doesn't, hold the decision conversation with the user directly.
- **Sub-agent briefs carry this rule:** "match conventions; where precedent carries debt, improve it and report it." Reports list improvements made and debt seen but left, so the spawner's diff review weighs both.
