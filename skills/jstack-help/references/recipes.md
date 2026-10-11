# Prompts worth copying

Swap in the real paths, skills, and done checks. Informal wording works.

## Understand

- `/agent-skills:jstack-mode read <thread>. restate the underlying issue in your own words, in plain english.`
- `/agent-skills:jstack-mode investigate why <symptom>. give me what we know, what data you used, and your best hypotheses. don't change any code yet.`
- `use /agent-skills:how to understand <subsystem>. then use /agent-skills:why to find out why it broke recently.`
- `/agent-skills:recall my work on <topic> from last week, then read <issue>.`
- `/agent-skills:teach me why you implemented it this way and not <other way>. what did you trade off?`
- `/agent-skills:jstack-mode take over this branch. read the decision log, find what's done, and continue. don't redo finished work.`

## Build

- Bug: `/agent-skills:jstack-mode <symptom>. repro first, then fix and verify.`
- Bug in an app: `/agent-skills:jstack-mode repro this with /verify-<app>. if it repros on main, fix it and show me a video as proof.`
- Bug with a cheap test: `/agent-skills:jstack-mode repro <bug> first. if there's a cheap test path, /agent-skills:tdd it. then fix and rerun.`
- Feature: `/agent-skills:jstack-mode add <behavior>. <current output> stays byte-identical. verify both.`
- Refactor: `/agent-skills:jstack-mode move <code> into one module, zero behavior change. record the current output first and prove it's unchanged after.`
- Perf: `/agent-skills:jstack-mode <operation> takes <time> on <fixture>. trace it, fix the measured cause, show me before and after.`

## Design and plan

- `/agent-skills:jstack-mode prototype a few options for <feature>. take screenshots or videos for me to compare.`
- `/agent-skills:jstack-mode we need <feature>. /agent-skills:architect it first, and answer open questions with prototypes. let me review before proceeding.`
- `/agent-skills:jstack-mode write a tutorial for how i would use <new package> first. then /agent-skills:teach me why it beats the current one.`
- `ask /agent-skills:arena for a second opinion on this thread and our approach.`
- `/agent-skills:jstack-mode turn this design into a plan. small verifiable PRs, each with its own verification steps.`
- `/agent-skills:jstack-mode plan the migration of <library> to <target>. small verifiable PRs. the result must match the original exactly, bugs included.`

## Review and ship

- `/agent-skills:interrogate the whole branch, but skeptically. don't change anything yet. no nitpicks unless it's a real bug or regression.` Read the dismissals too.
- `/agent-skills:swarm check every package under <dir> against its check script. one worker per package. one report.`
- `/agent-skills:jstack-mode open the pr. small ordered commits, evidence in the description.`
- `/agent-skills:jstack-mode babysit this pr. get it green.` For status only: `/agent-skills:jstack-mode check on pr <number>. anything outstanding?`
- `/agent-skills:jstack-mode land the stack.`

## Away and back

- `/agent-skills:jstack-mode im going to bed. <goal> in a fresh worktree off <base>. done means <checks>. keep a decision log. don't ask me before committing. /loop until done. if you're truly stuck after a few hours, stop and write up why.`
- `/agent-skills:show-me-your-work catch me up on what you did last night.` Read its Attention section first.
- `/agent-skills:jstack-mode full autopilot on this queue. each item is independent.`
- `/agent-skills:jstack-mode autopilot these changes but stack them, don't ship. i'll land the stack.`
- `/agent-skills:reflect capture what we learned so the next run doesn't repeat it.` Approve only edits that change a future decision.
- `/agent-skills:bro` restates the last reply in plain words.
