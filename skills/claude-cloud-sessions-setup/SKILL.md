---
name: claude-cloud-sessions-setup
description: Set up Claude Code cloud sessions for the current repo — GitHub access, a cloud environment with a setup script built from the repo's stack, a smoke session, and optionally a routine that ships issues labelled `claude`.
disable-model-invocation: true
---

# Claude cloud sessions setup

Walk the user through running this repo's work in Claude Code cloud sessions: Anthropic-hosted Linux VMs that clone the repo from GitHub and draw on the user's subscription. You prepare everything a file or command can hold; the user clicks through the parts that live on claude.ai and GitHub, and pastes back what they see.

[CLOUD-FACTS.md](CLOUD-FACTS.md) holds what a cloud VM has, what carries over from a repo, the limits and the billing. Read it before step 3; when a fact there disagrees with what the user sees on screen, the screen wins, and say so.

Deps are in [skill.deps.json](skill.deps.json); when one is missing, give the user its install command for this OS and stop.

## 1. Read the repo

Find, by looking rather than asking:

- the GitHub remote (`git remote -v`), the default branch, and how far local is ahead of it (`git status -sb`);
- the runtime and its version (`.nvmrc`, `.node-version`, `engines`, `packageManager`, `.python-version`, `go.mod`, `rust-toolchain`…), and the package manager;
- the system tools the build and tests need: read the CI workflows' install steps and the README's setup section;
- the commands that prove a change: install, typecheck or build, the test suites;
- the repo's agent instructions (`CLAUDE.md`, `AGENTS.md`), and anything in them that only works on the user's machine: a local MCP server, a desktop app, a browser, macOS-only tools;
- the plugins the user relies on: `~/.claude/plugins/known_marketplaces.json` and `~/.claude/settings.json`'s `enabledPlugins`;
- anything that fetches a per-platform binary at run time, or drives a headless browser (Chrome, Puppeteer, Playwright, Remotion): the VM is Linux x86-64, and a browser there needs system libraries.

Done when you can list the stack, the proving commands, and every **local-only** dependency.

## 2. Get the code where the cloud can clone it

Cloud sessions clone the GitHub remote, not the local checkout. When local is ahead, show how far and ask the user before pushing.

Then the user installs the Claude GitHub App on the repo at https://github.com/apps/claude (needed for routines' GitHub triggers and PR auto-fix; `/web-setup` alone grants cloning only). Done when the user confirms the App is installed and the remote has the commits they want the cloud to start from.

## 3. Write the environment

Draft the cloud environment for the user to create at https://claude.ai/code (environment selector → add):

- **Name**: after the repo.
- **Network access**: Trusted, unless step 1 found a download host outside the default allowlist; then Custom with the defaults plus those hosts.
- **Setup script**: installs only what the VM lacks against step 1's stack, using CLOUD-FACTS.md's preinstalled list: a runtime version it doesn't ship, apt packages, the package manager at the pinned version, and the user's plugins (`claude plugin marketplace add <owner/repo>` then `claude plugin install <plugin>@<marketplace>`, each `|| true`). End it by printing each tool's version. Hold it to the script requirements in CLOUD-FACTS.md.
- **Environment variables**: only what the build needs. API keys for model providers stay out of it.
- **A `SessionStart` hook in the repo**, offered alongside: the setup script lives on claude.ai and is cached, so it provisions the machine; a committed hook, guarded by `CLAUDE_CODE_REMOTE=true`, readies the project (dependencies installed, the runtime first on `PATH` via `CLAUDE_ENV_FILE`) and fills in any system package the script missed, installing only what `dpkg -s` reports missing. The hook travels with the repo; the script keeps sessions fast.

Give the user the script in one copyable block, with one line per install saying why. Done when the user has saved the environment.

## 4. Smoke session

Give the user this prompt for a first session in the new environment, filled in from step 1:

> Check this environment can work on <repo>. Print the version of <each tool>, and list the skills available to you. Then run <install>, <typecheck/build> and <each test suite>, and report the counts. For each failure, say whether it fails because this VM is Linux or lacks something the user's machine has (a tool, font, path, service) or because of a real bug. Change no code.

The user pastes back the report. Fix the setup script for missing or wrong-version tools and missing skills, and have them rerun until it's clean. For tests that fail only on the cloud VM, offer to make them portable or skip them there, in the repo. Reproduce them first in a local container that matches the VM (CLOUD-FACTS.md, Reproducing the VM), and run the whole suite there a few times: a rare red that passes alone is a race, and its real error is what to fix. Done when the smoke session reports every proving command green, or every red one is understood and the user has chosen what to do with it.

## 5. Offer the issue routine

Ask whether the user wants issues shipped by labelling them. If not, skip to step 6.

1. When the repo has a UI or makes files a person would look at, give runs proof: copy [scripts/shot.mjs](scripts/shot.mjs) and [scripts/proof.sh](scripts/proof.sh) into the repo's `scripts/`, and in a cloud session start the app, take one screenshot and publish it, so step 6 of the routine's prompt is filled from what worked. Turn on deleting a PR's branch when it merges, after the user agrees (`gh repo edit --delete-branch-on-merge`), so `claude/` branches don't pile up. Create the labels, after the user agrees: `claude` (hand it over), `claude-working` (a run claimed it), `claude-stuck` (a run stopped; see its comment).
2. Fill [ROUTINE-PROMPT.md](ROUTINE-PROMPT.md) from step 1 and give it to the user as one copyable block. Ask which review skills, if any, every PR should pass through, and put them in its Review step.
3. The user creates the routine at https://claude.ai/code/routines: the filled prompt, the model, the repo, the environment from step 3, the trigger **Issue: Labeled** filtered to `claude` (a schedule only if they want a fallback; its minimum is hourly), and **every connector removed**.
4. Test it on one issue whose work is code a test can prove: comment which items to take, then add the label. Watch the issue until it shows `claude-working` and a comment linking the session.

5. Offer the conflicts routine: when several PRs from the issue routine are open at once, each merge can leave the others conflicting. Fill [CONFLICTS-PROMPT.md](CONFLICTS-PROMPT.md) and give it to the user for a second routine with the trigger **PR merged** filtered to base branch `<default branch>`, the same environment, and every connector removed.

6. Offer the triage routine, so issues queue themselves: fill [TRIAGE-PROMPT.md](TRIAGE-PROMPT.md), create its two labels after the user agrees, and give it to the user for a third routine with the triggers **Issue: Opened** (no filter) and a daily schedule, the same environment, and every connector removed. Keep step 9 of the issue routine's prompt only when the triage routine is saved. Run it once with **Run now** to triage the backlog.

7. Offer the merge routine, so a safe PR merges without anyone: agree its human-in-the-loop list and size limits with the user, fill [MERGE-PROMPT.md](MERGE-PROMPT.md), and give it to the user for a fourth routine with the trigger **Pull request: Opened** and no filter (MERGE-PROMPT.md says why), the same environment, and every connector removed. Pushing the default branch is this routine's whole job, so ask the user plainly whether a PR it judges safe should merge with no one looking; when they'd rather click merge themselves, change its step 5 to label the PR `ready-to-merge` and comment why.

Done when a run has claimed the test issue, or the user declined the routine; and the conflicts, triage and merge routines are saved, or declined.

## 6. Hand over

Tell the user, in a few lines:

- how to start work: `claude --cloud "<task>"`, claude.ai/code, the phone app, or the `claude` label;
- how work comes back: a branch and PR to review and merge, then pull locally; `claude --teleport` to finish a session by hand;
- what stays local: each local-only dependency from step 1, and the kinds of tasks that need it;
- the costs: cloud sessions and routines draw on the subscription's usage limits, in parallel; usage credits at claude.ai/settings/usage decide whether routines bill overage past the limit.
