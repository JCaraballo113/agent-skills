# `subagent-model-tiering.md` — the generated rule

Applies to **every project**.

Match the sub-agent's model to the task; never default every spawn to the session model. Think in three cost tiers, cheapest to most expensive, named by **role** so the rule survives new model releases:

- a **cheap tier** (Sonnet today),
- a **mid tier** (Opus today),
- a single **heavy-hitter tier**: the most expensive model the session offers (Fable at the time of writing, but read it as whatever the top tier is when you run).

Reserve each tier for where its extra capability pays off.

## Cheap tier — mechanical, well-specified work

One right answer and a clear spec: lint remediation (`id-length`, `no-magic-numbers`, other cap fixes with an obvious extraction), mechanical renames, straightforward test scaffolding, doc/format passes, search-and-collate.

## Mid tier — judgment-heavy work

Structural refactors of long or complex files (splitting modules along seams, decomposing high-complexity functions without changing behavior), architecture and interface design, ambiguous or underspecified tasks, security-sensitive or money-moving code, and cross-cutting changes whose blast radius needs weighing.

## Heavy-hitter tier — opt-in, never a silent default

Before spawning any sub-agent on it, confirm the user wants sub-agents to potentially use it (and it is only a candidate when actually available in the session). Two modes the user picks:

- **(a) case-by-case** — the spawner still applies the judgment call: the heavy hitter only for the hardest tasks that genuinely out-reach the mid tier, not the default; or
- **(b) always** — route the heavy tier to it.

Absent an explicit yes, the heavy tier stays the mid tier.

## Advisory escalation — the heavy hitter thinks, cheaper tiers implement

A sub-agent unsure of an implementation detail — a typing approach, a behavioral edge, an ambiguous convention — consults instead of guessing: spawn a short read-only heavy-hitter advisor with a crisp question plus the minimal context, take the recommendation, and implement it on its own cheaper tier.

The advisor only advises — it never edits files or runs mutating commands; implementation always stays with the asking agent's tier.

Advisory spawns are a standing exception to the opt-in above, granted when the user installs this rule; putting *implementation* on the heavy hitter still needs the explicit yes.

Spawner briefs for delegated work name this escape hatch, so delegated agents know consulting — not guessing — is the fallback.

## The spawner is the reviewer

When a cheaper-model agent returns, review its diff before committing — use the `code-review` skill for non-trivial batches. Cheaper execution plus a review gate from the spawner beats running everything on the top tier.

Set the model or reasoning tier explicitly on each spawn when the host exposes that control rather than relying on inheritance.

## Parallel execution safety

- **Usage limits are per-model.** A wide fan-out can exhaust a tier mid-run and strand half-applied work — size the fan-out to the tier, and commit in verified batches so a limit or restart never loses progress.
- **Parallel file-mutating agents share one working tree.** Disjoint file scopes don't protect them: git acts on the whole tree, so one stray `stash` or `reset` clobbers concurrent edits. Give them `isolation: "worktree"`, or forbid git in the brief (edit only assigned files, run only read-only checks), then gate the batch on a full typecheck + test suite. Read-only agents parallelize safely.
