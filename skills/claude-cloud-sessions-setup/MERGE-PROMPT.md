# The merge routine's prompt

A fourth routine that closes the loop: when the issue routine opens a PR, or the conflicts routine updates one, it judges whether the PR is safe to merge without a person. Safe, it merges; not, it labels the PR `needs-hitl` and says why. It merges in git and pushes the default branch, because GitHub's REST API won't merge a draft and marking a PR ready needs GraphQL, which cloud sessions block (CLOUD-FACTS.md, Network); GitHub marks a PR merged once its commits are on the base branch, draft or not. Testing the merged result, not the branch alone, also catches two PRs that only break together.

Triggers: **PR opened** and **PR synchronized** (new commits), each filtered to drafts (Is draft = true) on head branches starting with `claude/`, so it only ever sees the issue routine's PRs. Same environment, every connector removed.

Fill each `<…>` from step 1 of the skill. Agree the human-in-the-loop list with the user: it's the repo's own judgement of what a person must see, and its size limits.

```
You decide whether a pull request in <owner/repo> from the issue routine is safe to merge without a person, and merge it when it is. Read <CLAUDE.md / AGENTS.md> first: a change that breaks its rules isn't safe.

GitHub GraphQL is blocked in these sessions, so `gh pr …` fails. Use the REST API through `gh api` for GitHub, and git for the merge. R is `repos/<owner/repo>`. Write any long text to a file first and pass it as `-F body=@<file>`.

1. **Pick.** The PR the `<github-trigger-context>` names; with none (Run now), each open PR into `<default branch>` from a `claude/` branch without the `needs-hitl` label, oldest first. Stop on a PR that's closed, isn't from a `claude/` branch, or carries `needs-hitl`.
2. **Read.** The PR (`gh api R/pulls/<n>`), its files (`gh api 'R/pulls/<n>/files?per_page=100'`), its description and the issue it refers to (`Refs #<i>`: `gh api R/issues/<i>` and its comments), so you know what it was for.
3. **Hold for a person** when any of these is true, and skip to step 6:
<the repo's human-in-the-loop list, one line each, e.g.
   - it changes what the app shows (UI components, styles, copy): a person looks first;
   - it adds, removes or upgrades a dependency (package.json, the lockfile);
   - it changes agent instructions or tooling (CLAUDE.md, .claude/ settings, hooks or agents, .github/, scripts/);
   - it changes a saved file format or adds a migration;
   - it touches credentials, tokens, the network or anything sent off the machine;
   - it deletes, skips or weakens a test;
   - it's bigger than <N> changed lines or <M> files;>
   - the PR or its issue's comments ask for a person, or say something stays undecided.
4. **Prove.** Fetch, and on a branch from `origin/<default branch>` merge the PR's branch with `git merge --no-ff`. A conflict is the conflicts routine's to resolve: stop here without labelling. Run <install>, <typecheck/build> and <each test suite> on the merged result; any red is step 6. Then review the PR's changes against `origin/<default branch>` with <the review skill, e.g. "/mattpocock-skills:code-review, with the issue as the spec">: a finding that's a real problem is step 6. You judge here; you change nothing in the PR.
5. **Merge.** Write the merge commit message as `Merge #<n>: <the PR's title>` and push it: `git push origin HEAD:<default branch>` (never with `--force`). When the push is rejected because `<default branch>` moved, fetch and start again from step 4. Then comment on the PR why it was safe (what you checked, the test counts), and on its issue that it merged. GitHub marks the PR merged.
6. **Hold.** Label the PR `needs-hitl` (`gh api -X POST R/issues/<n>/labels -f 'labels[]=needs-hitl'`) and comment: which rule or finding held it, the exact files or lines, and what the person should look at or decide. Change nothing else.

Guardrails: push `<default branch>` only in step 5, only a merge you proved in step 4, never with `--force`. Merge only PRs from `claude/` branches. Leave the repo's agent instructions as they are.<Add the repo's own hard rules.>
```
