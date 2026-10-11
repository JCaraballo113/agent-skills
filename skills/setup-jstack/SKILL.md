---
name: setup-jstack
description: Choose which Claude model each jstack role runs on, written to a user rule that overrides the skill defaults.
disable-model-invocation: true
---

# Setup jstack

Write `~/.claude/rules/jstack-models.md`, a user rule that loads in every Claude Code session and sets jstack's model per role.

## Steps

### 1. Load current state

The default role-to-model mapping is the rule shape in step 4. If `~/.claude/rules/jstack-models.md` already exists, read it and treat its role values as the current choices. Otherwise start from the defaults. A line whose role is not in step 4 is from a retired role. Drop it.

### 2. Show the roles and confirm

Show every role with its model. Also list each line step 1 dropped. Ask whether to accept as is or change specific roles, using `AskUserQuestion`. The options for a role are `fable`, `opus`, `sonnet`, `haiku` and `inherit`. `inherit` runs the role on the parent's model, so a person who switches models per session stays on that model.

For panel roles (arena runners, architect runners, interrogate reviewers) the value is a list, and one subagent runs per entry, `inherit` entries included, so the list length sets the count. `arena cross-judge pool` is also a list, but Arena picks the one entry that wrote no candidate when it can. `swarm workers` is the default model for every worker unless a race or comparison assigns another model per arm.

Fable is the strongest and most expensive tier. Moving a judgment role to `opus` or a code role to `sonnet` spends fewer tokens. Shortening a panel list removes one subagent per entry.

### 3. Validate

Every value is one of `fable`, `opus`, `sonnet`, `haiku` or `inherit`, or a full model ID the person typed, such as `claude-opus-5-5`. If a value is anything else, stop and ask again.

### 4. Write the rule

Write `~/.claude/rules/jstack-models.md` with no frontmatter, so it loads in every session, and one line per role, using the same labels jstack-mode uses. Overwrite the whole file so re-runs stay idempotent. Shape, with the defaults:

```
# jstack model configuration

One line per role. Delete a line to fall back to the skill default. `inherit` runs the role on the parent's model (omit the Agent tool's `model`). Each entry in a panel list runs one subagent, `inherit` entries included.

feature, refactoring: opus
bug-fix: opus
perf-issue: opus
hillclimb: opus
judgment and prose: fable
hardest tasks: fable
how explorer: sonnet
how explainer: fable
why investigators: sonnet
why synthesizer: fable
reflect tooling: opus
reflect judgment, divergent, synthesizer: fable
arena runners: fable, opus
arena cross-judge pool: fable, opus
swarm workers: sonnet
architect runners: fable, opus
interrogate reviewers: fable, opus
```

### 5. Confirm

Tell the person the rule was written and that it applies to new sessions. Re-running this skill updates it. A cloud session starts with an empty `~/.claude`, so it runs on the skill defaults unless the cloud environment's setup script writes this file.

### 6. Offer a verification skill

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /agent-skills:create-verification-skill." On yes, invoke the **create-verification-skill** skill. On no, move on without pushing.
