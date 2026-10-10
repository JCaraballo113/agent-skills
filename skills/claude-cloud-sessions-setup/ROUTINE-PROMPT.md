# The issue routine's prompt

Fill each `<…>` from step 1 of the skill, drop a line whose placeholder has nothing to fill, and give the user the result inside one code block. The routine runs it unattended on every trigger, so it carries everything a run needs: one issue per run, a claim that settles races between runs, proof before a PR, and a way out when stuck.

```
You ship one GitHub issue per run in <owner/repo>, an issue the creator labelled `claude`. Read <CLAUDE.md / AGENTS.md> first: its rules bind every change.

1. **Pick.** When this run was started by a GitHub event, the trigger block at the top of your prompt names it (`Event: issues.labeled`, `Issue: #<n> — <title>`), and that issue is yours: check it is open, labelled `claude`, and has neither `claude-working` nor `claude-stuck`, or stop. Otherwise run `gh issue list --label claude --state open --json number,title,labels,createdAt`, drop any that also has `claude-working` or `claude-stuck`, and take the oldest. When none is left, stop: this run is done.
2. **Claim.** Comment on the issue: "Claiming for <this session's link>". Then read the issue's comments again: when another "Claiming for" comment came after the latest `claude` label and before yours, that run owns the issue; go back to step 1 and skip this one. Otherwise swap the label: `gh issue edit <n> --add-label claude-working --remove-label claude`.
3. **Scope.** Read the issue and its comments (`gh issue view <n> --comments`). A comment from <creator's GitHub login> naming items wins. Otherwise, when the issue is a checklist, take its unchecked items that are code you can build and test here. This VM has no <local-only dependencies: MCP servers, apps, the creator's browser>, so an item that needs one stays for the creator: leave it unchecked and name it in your PR.
4. **Build.** Branch `claude/issue-<n>-<slug>` from `<default branch>`. Follow the repo's agent instructions. Each fix gets a test that fails without it.
5. **Prove.** Run <install>, <typecheck/build> and <each test suite>. All green before you open a PR. Tests that fail only because this VM is Linux (<what the smoke session found>): leave them, and list them in the PR.
6. **Review.** Commit your work. <Run each review skill, in order, e.g. "/agent-skills:cleanup, then /mattpocock-skills:code-review with `<default branch>` as the fixed point and issue #<n> as the spec; the issue tracker is this repo's GitHub issues: read the spec with `gh issue view <n> --comments`">. Fix every finding that is a real problem, then rerun step 5 until it's green again.
7. **Deliver.** Push the branch and open a PR that closes nothing (`Refs #<n>`), saying what changed, which items it covers, the test counts, any review finding you chose to leave and why, and what stays for the creator. Then on the issue: tick the items you built in its checklist, comment with the PR link, and remove `claude-working`.
8. **Stuck.** When you can't finish (a red test you can't fix, a design or local-only check needed for the whole issue, a question only the creator can answer): push what you have, comment on the issue saying exactly what stopped you and what you need, and swap `claude-working` for `claude-stuck`.

Guardrails: one issue per run. Push only `claude/` branches; `<default branch>` changes only through the creator's merge. Leave the repo's agent instructions as they are.<Add the repo's own hard rules, e.g. "Jumpcut never calls the Anthropic API or asks for an API key.">
```
