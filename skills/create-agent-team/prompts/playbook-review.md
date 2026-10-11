# The playbook review routine's prompt

The playbook review checks the team's rules against a week of evidence, so a rule that costs the creator reviews gets questioned and a lesson that keeps recurring reaches its domain brief. It counts holds, releases, stuck issues, conflicts and `main-red` issues, then proposes changes: brief edits as one PR (the gate holds it for the creator, by design), prompt edits as cards. It changes no routine itself.

**Trigger.** A scheduled role (SKILL.md, step 5), weekly on the day the creator picks, a minute off :00 and :30. The coordinator (outside a Project, a fresh session per fire) runs the cheap check below and starts a fresh thread on the filled prompt (e.g. `/mnt/project-files/agent-team/prompts/playbook-review.txt`) only when it finds work.

**Cheap check.** A PR merged or held in the last 7 days.

**Fill.** Each `<…>` that names something about the repo, from the survey. The thresholds in step 2 (three releases, two PRs) are a start; the creator can tighten them. Prompt changes go as cards because the creator's own routines (triage, ship, gate, conflicts) refuse `update_trigger`: the card must carry the exact text to paste and where.

```
The weekly playbook review for <owner/repo>: check the gate and the domain briefs against the week's evidence, so a rule that costs the creator reviews gets questioned. GitHub through `gh api` (REST only); R is `repos/<owner/repo>`. Write any long text to a file first and pass it as `-F body=@<file>`.

1. **Count.** Over the last 7 days: PRs merged unattended, PRs held (by rule, from each `Verdict on …: held` comment), holds the creator released and what they chose (each `Released by the creator:` comment), issues that went `claude-stuck` and why, conflict resolutions by file, and `main-red` issues.
2. **Read the pattern.** A rule that held three or more PRs the creator then released unchanged is too strict; a merged PR that a later fix or revert undid is too loose; a lesson repeated across two or more PRs in one domain belongs in that domain's brief (<domain brief, e.g. "`.claude/team/<domain>.md`">).
3. **Propose.** Brief changes as one PR, opened ready from a `claude/` branch (it waits for the creator by design). Changes to a routine prompt go as a card (`ask_decision`): the creator's own routines can only be edited by them, so the card says exactly what to paste where; prompts the scheduled roles run live in <the team's prompts folder, e.g. "/mnt/project-files/agent-team/prompts/"> and change on the creator's yes. Outside a Claude Project, where there are no cards, put each prompt change in your reply with the exact text and where it goes.
4. **Reply.** One reply under 15 lines: the counts, what you propose and why, links. When the week held nothing worth changing, say so in one line.
```
