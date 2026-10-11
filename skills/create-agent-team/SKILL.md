---
name: create-agent-team
description: Set up a repo's agent team, routines that triage issues, ship PRs with jstack, gate merges and keep main green, sending the creator only decisions as cards.
disable-model-invocation: true
---

# Create an agent team

An agent team is a pipeline of routines that moves work from issue to merged PR without the creator at a desk. Each routine has one job and hands off through labels and comments on GitHub, so any run picks up where another stopped and the creator reads state on GitHub, not in a session. The creator stays in the loop only at a **hold**: a decision only they can make, sent to them as a **card** they answer from their phone.

The team decides when work runs and who owns it. How a run does the work is jstack's: Ship builds through the **jstack-mode** skill (its Feature or Bug fix playbook), and the gate reviews with a review skill such as **interrogate**. A routine run ends where its role ends, so jstack's own merge steps (Shipping, Autopilot) never run inside the team: the gate owns `main`.

Deps are in [skill.deps.json](skill.deps.json); when one is missing, give the user its install command for this OS and stop.

Work through the steps in order; each ends on its completion criterion. The roles and conventions the steps build are reference at the end. The prompt templates are in [prompts/](prompts/), one per role.

## 1. Survey

The team runs in Claude Code cloud sessions. When the repo has no cloud environment yet, or its setup script doesn't install agent-skills, work through `${CLAUDE_PLUGIN_ROOT}/skills/claude-cloud-sessions-setup/SKILL.md` steps 1 to 4 first, then come back here.

Read before proposing anything:
- The repo's CLAUDE.md (or AGENTS.md), contributing rules, CI workflows, and labels in use (`gh api repos/<R>/labels`).
- Existing routines (`list_triggers`): each one's prompt, trigger (cron or GitHub event), `created_via`, and last runs.
- Open PRs and issues: how many, how old, which labels, and for each held PR the rule that held it (its hold comment).
- CI at both levels: the workflow (`gh api repos/<R>/actions/workflows`) and the repository's Actions permission (`gh api repos/<R>/actions/permissions`). Actions switched off for the repository stops every run while the workflow still reads `active`, and the Actions tab returns 404.
- Whether `main` is green: the full suite on a fresh checkout.
- Where the team will talk to the creator: a Claude Project with a coordinator session (`get_channel_session_id` returns one), or plain sessions.

Done when you can name, for each held PR, the rule that held it, and for each existing routine, its job and whether you can edit it.

## 2. Plan

Write the plan as a doc (a Claude Doc when the connector exists): the roles mapped onto this repo, what each existing routine becomes, the rules the gate holds on, and the conventions. End with the decisions only the creator can make, each with a recommended default: typically the size limit, what still holds for a person, the review skill the gate runs, whether design moves somewhere they can sign off from a phone, and how often they hear from the team.

Done when the creator has answered or accepted the defaults. Building starts on their word.

## 3. Write the prompts

Fill one template from [prompts/](prompts/) per role into a shared folder (`/mnt/project-files/agent-team/prompts/` in a project), so a scheduled role reads its prompt fresh each run and a change is one edit. Save each routine's old prompt beside them (`routine-backups/`) before replacing it. Each template's header says what to fill and what to ask the creator.

Each prompt:
- names its trigger, its single job, and what it leaves to other roles;
- picks work idempotently: skips what another run has claimed (a label, or a "checking" comment on the head sha from the last few hours) and what is already judged (a verdict naming the current head sha);
- spells out the GitHub calls the environment allows (cloud sessions block GraphQL: `gh api` REST, long bodies via `-F body=@<file>`);
- ends on guardrails: what it may push, never `--force`, anything the repo forbids.

The gate's hold rules need three things exact:
- **Tooling paths by name**: `CLAUDE.md`, `.claude/agents/`, `.claude/settings.json`, `.claude/hooks/`, `.claude/team/`, `.github/`, `scripts/`. A skill edit that teaches a feature goes through review like code; a rule naming all of `.claude/` holds every feature PR.
- **Size in source lines**: tests and generated files (lockfiles, built assets, files whose header says they're generated) stay out of the count.
- **The main-red fix exempt** from the main-red pause, so the pause never blocks its own fix.

Every skill a prompt names must be installed by the cloud environment's setup script at a version that has it. A plugin release reaches the cloud only when the environment's snapshot rebuilds, which bumping the setup script's plugin version line does (CLOUD-FACTS.md in the claude-cloud-sessions-setup skill).

Done when every role the plan kept has a prompt file with no fill-time `<…>` left (the run-time ones each template's header lists stay), and every skill those prompts name is in the setup script.

## 4. Change the repo

One PR, ready (the gate skips drafts), with what the routines need from the repo:
- CLAUDE.md rules the routines rely on (the design hand-off, what merges unattended);
- the permission the gate needs to push `main` (such as `Bash(git push origin HEAD:main)` in `.claude/settings.json`), so a merge never stalls on a prompt nobody answers;
- CI that runs cheaply where the routines run (often one Linux job);
- a short brief per domain (`.claude/team/<domain>.md`) holding what past PRs in that part of the repo taught, which the ship routine reads before building;
- `scripts/shot.mjs` and `scripts/proof.sh` from [scripts/](scripts/) when the repo has a UI or makes files a person would look at, so Ship's proof is something the creator can see.

This PR changes tooling, so the gate holds it for the creator by design. Done when it is open and the creator knows it waits on them.

## 5. Install the routines

Two kinds install differently:
- **The creator's routines** for event-driven roles (triage, ship, gate, conflicts): the creator makes these in the routines form at claude.ai/code/routines, with the repo, the cloud environment, the trigger the template names and every connector removed. Agents can't edit them (`update_trigger` refuses `created_via: http_api`). Publish a paste page: one card per routine with the full new prompt, a copy button, and a link to `claude.ai/code/routines/<id>`. Give the full prompt every time, a one-line change included: the creator pastes whole prompts. The gate also gets an hourly schedule beside its PR trigger, which makes it sweep unjudged PRs.
- **Scheduled roles** (main health, design pass, morning board, playbook review): you create these with `create_trigger`. In a Claude Project, fire each into the coordinator session. Its brief tells the coordinator to run the role's cheap check, and to start a fresh thread on the role's prompt file only when there is work, so quiet days cost nothing and post nothing. Outside a project, give each routine a fresh session per fire, reading its prompt file the same way.

Stagger cron minutes off :00 and :30. Done when `get_trigger` on every routine shows the new prompt (check a phrase only the new version has) and each scheduled one shows its next run.

## 6. Re-sort what's held

PRs held under the old rules stay held until someone re-sorts them. Have a worker sort every `needs-hitl` PR under the new rules into release, decide (question, 2 to 4 options, a recommendation), tooling (stays held for the creator) and stuck. Then:
- **release**: comment which new rule it now passes, remove `needs-hitl`, and mark a draft ready with the GitHub MCP's `update_pull_request` (`draft: false`), since REST alone can't;
- **decide**: one batch card ("Take my recommendation on all N?") listing each PR's recommendation in its context, with one-by-one as the alternative;
- on the creator's answer, record it on each PR as `Released by the creator: <answer>` and remove `needs-hitl`.

`Released by the creator` carries the creator's own answers only; a release by the new rules gets the plain comment. Done when every held PR is released, carded, or named as waiting on tooling review.

## 7. Prove it

- CI green on `main`, watched end to end. With `cancel-in-progress`, the next push cancels a run started by hand: watch the newest run on `main`.
- A verdict from the gate on at least one PR under the new prompt.
- Shared memory records the routines (ids, triggers, where prompts live), the conventions, and what the creator still owes.

Done when all three hold. Then tell the creator what's left for them, one line each.

## Roles

| Role | Trigger | Job | Template |
|---|---|---|---|
| Triage | new issue, daily | sort each item into ship, design, person or done; scope one run's worth and label `claude` (queue cap about 4) | [triage.md](prompts/triage.md) |
| Ship | `claude` label | claim (`claude-working`), build with jstack-mode within the size limit, prove it with something a person can see, open a ready PR that `Refs` the issue; `claude-stuck` when it can't finish; then promote the next `claude-ready` | [ship.md](prompts/ship.md) |
| Gate | PR opened, hourly | hold or prove (merge with `main`, tests, review, fix findings), merge via `git push origin HEAD:main`, post a verdict; the hourly run sweeps a few unjudged PRs | [gate.md](prompts/gate.md) |
| Conflicts | PR merged | merge the base into each conflicting PR and resolve it | [conflicts.md](prompts/conflicts.md) |
| Main health | nightly | full suite on a fresh `main`; open or close `main-red` issues and queue the fix | [main-health.md](prompts/main-health.md) |
| Design pass | nightly | draw boards for `needs-design` issues, then swap to `needs-signoff` | [design-pass.md](prompts/design-pass.md) |
| Morning board | daily | one phone-sized board (merged, `main`, stuck) plus a card per new decision or sign-off | [morning-board.md](prompts/morning-board.md) |
| Playbook review | weekly | count holds and releases; propose loosening a rule the creator keeps overriding, and lessons for the domain briefs | [playbook-review.md](prompts/playbook-review.md) |

The design pass belongs only to a repo with a design hand-off. Conflicts keeps its own steps: jstack's Babysit playbook reports a conflict rather than resolving it.

## Conventions

- **Verdict**: the gate's last comment on a PR opens `Verdict on <head sha>: merged` or `held`, so any run knows whether the newest commit is judged.
- **Decision block**: a hold that needs the creator ends with `Decision: <question under 15 words>` and 2 to 4 `- <option>: <consequence>` lines, one marked `(recommended)`; the board turns it into a card.
- **Answers**: `Released by the creator: <choice>` on the PR (the gate reads it as spec, settling that question); `Design signed off: <board>, <page>, <link>` on the issue.
- **Labels**: `claude`, `claude-ready`, `claude-working`, `claude-stuck`, `needs-hitl` (the hold), `needs-design`, `needs-signoff`, `main-red`.
- **main-red**: while one is open, the gate checks only the PR that fixes it, because a red `main` makes every other result unreliable.
- **One open PR per domain**: area labels map to domains; an issue whose domain already has an open PR waits as `claude-ready`, so same-area work lands in order.
