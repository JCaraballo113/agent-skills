# The conflicts routine's prompt

A second routine, triggered when a PR merges, that keeps the issue routine's other open PRs mergeable: it merges the default branch into each `claude/` PR that now conflicts, resolves the conflict, proves it, and pushes. Merging in (GitHub's Update branch) rather than rebasing means a plain push, never a force-push: an unattended run can't ask, and two runs racing on one branch get a rejected push instead of one overwriting the other.

Fill each `<…>` as in ROUTINE-PROMPT.md and give the user the result inside one code block.

```
You keep the issue routine's open pull requests in <owner/repo> mergeable after another one merges. Read <CLAUDE.md / AGENTS.md> first: its rules bind every change.

GitHub GraphQL is blocked in these sessions, so `gh pr …` fails. Use the REST API through `gh api` for every GitHub call below. R is `repos/<owner/repo>`. Write any long text to a file first and pass it as `-F body=@<file>`.

1. **Find.** List the open PRs into `<default branch>` from `claude/` branches: `gh api 'R/pulls?state=open&base=<default branch>&per_page=100' --jq '.[] | select(.head.ref | startswith("claude/")) | {number, head: .head.ref}'`. For each, read `gh api R/pulls/<n> --jq '{mergeable, mergeable_state}'`; GitHub works `mergeable` out after a merge, so when it's `null`, ask again a few times over a minute. Keep the ones with `mergeable` false (`mergeable_state` "dirty"). When none is left, stop: this run is done.
2. **Merge in.** For each kept PR, oldest first: fetch, check out its branch, and `git merge origin/<default branch>`. Resolve each conflict so both sides' intent survives: read this PR's description and the issue it refers to, and the merged PR's, to know what each change was for. Where both add to the same list or registry, keep both entries.
3. **Prove.** Run <install>, <typecheck/build> and <each test suite>. All green before you push. Tests that fail only because this VM is Linux (<what the smoke session found>) don't count.
4. **Push.** `git push` (never with `--force`). When it's rejected because the branch moved, fetch, and start this PR again from step 2. Comment on the PR (`gh api R/issues/<n>/comments -F body=@<file>`) naming each conflicted file and how you resolved it.
5. **Stuck.** When a conflict has no resolution that keeps both intents, or the tests stay red after resolving: `git merge --abort` (or reset the branch to its pushed state), push nothing, and comment on the PR saying which files conflict, why you stopped, and what the creator needs to decide. Then go on to the next PR.

Guardrails: push only to `claude/` branches, and never with `--force`; `<default branch>` changes only through the creator's merge. Change only what resolving the conflict needs. Leave the repo's agent instructions as they are.<Add the repo's own hard rules.>
```
