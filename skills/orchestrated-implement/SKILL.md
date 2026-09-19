---
name: orchestrated-implement
description: Implement several ready tickets at once — one fresh implementer per ticket in its own worktree, landed in a decided order, then a fresh agent's cleanup and code-review over the whole landing.
disable-model-invocation: true
---

# Orchestrated implement

You are the **orchestrator**, not an implementer. Each ticket goes to its own implementer — a fresh agent with a pointer brief — in its own worktree; you verify they can run in parallel, land them in order, and put fresh eyes on the result. The deliverable is the tickets landed on the current branch with every check green and one report.

The **implement loop** — TDD at pre-agreed seams, typecheck and single test files as you go, the full suite once at the end, commit — is spelled out in [BRIEF.md](./BRIEF.md); every implementer, spawned or inline, runs it. Review is the orchestrator's: each diff at landing (step 4), the whole landing once (step 5).

Preflight: the skills in [skill.deps.json](./skill.deps.json) are installed — prompt the user with the install command for any that isn't.

## 1. Pin the tickets

Arguments are ticket ids (or a spec path that names them). Read each through the project's issue tracker (`docs/agents/issue-tracker.md`). Done when every ticket's blockers are closed or already committed on this branch, and the working tree is clean with the project's checks green. An open blocker stops the run here — say which.

Record the **base**: the current HEAD SHA. Every implementer is cut from it and every later review is measured against it.

## 2. Verify parallelism

The tracker says two tickets are independent when neither blocks the other; the code decides whether they can actually run at once. For each pair:

- **Outputs** — does either ticket consume something the other produces (a hook's return shape, a copy table, a fixture)? A consumer waits; it does not fan out.
- **Files** — from each ticket's scope and the code it names, list the files it will edit. Files in one list only are **owned**; files in both are **shared**.

Done when you have the **ownership map**: owned files per ticket, the shared files (edits there are additive only), and the **landing order** — the smaller change lands first, the next rebases onto it. One ticket, or every pair a consumer, means no fan-out: run the implement loop inline yourself and skip to step 6.

## 3. Fan out

First ask which model the implementers run on, with `AskUserQuestion`: the options are the models the Agent tool offers in this session, most capable first, plus "Let the orchestrator select". Under that last option it is your judgment call per ticket: the cheapest model for mechanical work with a clear spec and one right answer; a stronger one where the ticket is ambiguous, structural, or high-stakes (money, contracts, data loss); the most capable only where you expect the stronger one to fall short. Name the choice and its reason in the report. Set `model` explicitly on every spawn.

Then **prep one worktree per ticket yourself**, so each implementer starts on a ready tree instead of spending its context discovering one: `git worktree add <path> -b impl/<id>-<slug> <base>`, `node_modules` linked to the main checkout's (or installed, where the project has no link convention), and the project's typecheck run in one tree. Done when every tree is on its named branch at the base with a green typecheck — facts the brief then states.

Then one implementer per ticket — a fresh agent (a fork would carry this whole conversation into every one of its turns; the brief's pointers reach the same material for the price of a read), spawned onto its prepared path with no `isolation` (the tool's own worktree would be a second, anonymous tree cut behind your back), all in one message. Each brief is [BRIEF.md](./BRIEF.md) filled in for that ticket; the ownership map goes to every implementer.

While they run, do orchestrator work only — nothing in the files the implementers own. An implementer that stops on a question it cannot settle from the code gets its answer by `SendMessage` and resumes with its context intact. Done when every implementer has reported.

## 4. Land

In landing order: review the implementer's diff against the base yourself before merging (the spawner is the reviewer), merge its worktree branch into the current branch, rebase the next implementer's branch onto the result, and run the full checks after each landing. A conflict in a shared file is resolved by hand, additive both ways — `/resolving-merge-conflicts` when it is not obvious. Remove each worktree and its `impl/` branch once landed. Done when every implementer's commits are on the branch and the checks are green.

## 5. Fresh eyes

Spawn a fresh agent to run the `cleanup` skill scoped to the diff from the base. It commits its fixes. Then run the `code-review` skill with the base as the fixed point, fix the findings, commit. Done when a review pass returns nothing worth fixing.

## 6. Report

One report the user can act on without the transcript: per ticket, its commits, every judgment call and open question the implementer logged, and what was deferred to which ticket; the landing order and any conflict resolved; what cleanup and code-review found and what you did with each; final typecheck, lint and test counts. Update the project's memory or map if it tracks the frontier.
