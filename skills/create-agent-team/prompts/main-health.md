# The main health routine's prompt

Main health runs the full suite on a fresh `main` every night, so every other routine can trust its own red. When `main` is red it opens or updates a `main-red` issue and labels it `claude`, so Ship fixes it first, through pstack's Bug fix playbook, and the gate checks only that fix until `main` is green again. When `main` is green it closes the `main-red` issues whose failure is gone. It fixes nothing itself.

**Trigger.** A scheduled role (SKILL.md, step 5), nightly, a minute off :00 and :30. The coordinator (outside a Project, a fresh session per fire) runs the cheap check below and starts a fresh thread on the filled prompt (e.g. `/mnt/project-files/agent-team/prompts/main-health.txt`) only when it finds work.

**Cheap check.** `<default branch>` has a commit since the last fire (`gh api 'repos/<owner/repo>/commits?sha=<default branch>&since=<last fire, ISO time>&per_page=1'`), or a `main-red` issue is open.

**Fill.** Each `<…>` that names something about the repo, from the survey; placeholders a run fills as it goes (`<file>`) stay as written. Use the repo's full suite here, every package, with the lockfile frozen: a nightly check that skips a suite misses the red it exists to find.

```
You check that `<default branch>` of <owner/repo> is green, so every other routine can trust its own red. Use the REST API through `gh api` for GitHub (GraphQL is blocked); R is `repos/<owner/repo>`. Write any long text to a file first and pass it as `-F body=@<file>`.

1. **Run.** In a fresh checkout of `origin/<default branch>` (a new `git worktree` or clone in a scratch folder), run <install with the lockfile frozen, e.g. "`pnpm install --frozen-lockfile`">, <typecheck/build> and <the full test suite>. Note the sha and each suite's counts.
2. **Green.** Close each open issue labelled `main-red` (`gh api 'R/issues?labels=main-red&state=open'`) whose failure no longer shows, commenting the sha and the counts. Then stop.
3. **Red.** For each failing test file, run it alone once and the full suite once more, so the issue can say whether it fails alone, only under load, or every time. For each distinct failure, find an open `main-red` issue naming that test and comment the new sha and result; when none exists, open one: title naming the test and how it fails, body with the sha, the trimmed failing output, the alone/under-load result and the commits since `<default branch>` was last green, labelled `main-red` and `bug`. Then add `claude` to it so the ship routine fixes it first (a `main-red` issue skips the domain wait).

Report in one line: green with the counts, or red with the issue numbers.
```
