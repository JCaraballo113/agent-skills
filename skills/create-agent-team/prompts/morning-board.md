# The morning board routine's prompt

The morning board is the creator's one daily read: a phone-sized board (what merged, `main`, what's stuck, what's held) and a card for each new decision or design sign-off. It turns the gate's `Decision:` blocks and the design pass's `needs-signoff` issues into cards, and applies the creator's answers as `Released by the creator:` on a PR or `Design signed off:` on an issue, so the gate and Ship pick them up on their next runs. It judges, builds and merges nothing.

**Trigger.** A scheduled role (SKILL.md, step 5), daily at the hour the creator picks, a minute off :00 and :30. The coordinator (outside a Project, a fresh session per fire) runs the cheap check below and starts a fresh thread on the filled prompt (e.g. `/mnt/project-files/agent-team/prompts/morning-board.txt`) only when it finds work. In a Project the thread can't post in the project chat, so it hands the board and cards to the coordinator, which posts them with `ask_decision` and relays each answer back for the thread to apply; outside one, the session sends the board as its final reply.

**Cheap check.** A PR merged since the last board, or an open issue or PR labelled `needs-hitl`, `needs-signoff`, `claude-stuck` or `main-red`.

**Fill.** Each `<…>` that names something about the repo, from the survey; placeholders a run fills as it goes (`<n>`, `<sha>`, `<date>`, `<iso time>`, `<board>`, `<board title>`, `<page>`, `<board link>`, and the answer shapes at the end) stay as written. The board state file must outlive the thread: in a Project, the project's files (e.g. `/mnt/project-files/agent-team/board-state.json`); outside one, a session's files go with it, so keep the state where the next session can read it, such as the body of one pinned issue. Without a design hand-off, drop the sign-off lines.

**Ask the creator** what time the board should arrive.

```
The morning board for <owner/repo>: one post the creator can answer from their phone, built from GitHub (`gh api`, REST only; R is `repos/<owner/repo>`; write any long text to a file first and pass it as `-F body=@<file>`). In a Claude Project, the coordinator session posts it, since it owns the project chat; you build it in a fresh thread the coordinator starts each morning. Outside a Project, you are a fresh session and post it yourself. What was carded before is in <board state file, e.g. "/mnt/project-files/agent-team/board-state.json"> ({"carded": {"pr-<n>@<sha>" | "issue-<n>-signoff": "<date>"}, "lastBoard": "<iso time>"}); read it first and write it back at the end.

1. **Gather.**
   - Merged since `lastBoard`: PRs into `<default branch>` closed as merged.
   - `<default branch>`: green, or each open `main-red` issue.
   - Stuck: open issues labelled `claude-stuck`, with the one thing each needs (from its last comment).
   - Decisions: open PRs labelled `needs-hitl`. For each, read its newest verdict. One whose verdict ends in a `Decision:` block and isn't carded at its head sha gets a card (step 2). One held without a `Decision:` block gets one line on the board saying what it waits on.
   - Sign-offs: open issues labelled `needs-signoff` not yet carded: each gets a card naming its board on <design tool>.
2. **Cards.** Write each card as: the question (under 15 words), two to four options (label one or two words, consequence one sentence), which one is recommended and why, and a context line with the PR or issue title and number. A PR card takes its question and options from the verdict's `Decision:` block. A sign-off card asks "Sign off the <board> board for #<n>?" with Sign off (recommended: the build starts) and Change it (the creator says what to change).
3. **Board.** Lead with how many cards wait for the creator, then merged, `<default branch>`, stuck and other holds, a line each, PRs and issues linked. Under 15 lines. When nothing merged, nothing waits and `<default branch>` is green, there is no board today: skip step 4.
4. **Hand over.**
   - **In a Claude Project:** get the coordinator's session with `get_channel_session_id`, then `send_message` it the board text and the cards, asking it to post the board in the project chat and each card there with `ask_decision`, and to relay the creator's answers to this thread with their message attached. In this thread, refresh the status checklist only. With no board today, send the coordinator one line saying so and resolve this thread.
   - **Outside a Project:** end with the board and each card's question, options and recommendation as your final reply, and send a push notification when this session can. The creator answers in this session. With no board today, end with one line saying so.

When the creator's answer to a card reaches you (relayed by the coordinator, or typed into this session), act on it the same turn:
- A PR decision: comment on the PR `Released by the creator: <the option they picked, and their words>`, then remove `needs-hitl`; the gate's next hourly run re-checks it with their answer as part of the spec.
- A sign-off: comment on the issue `Design signed off: <board title>, page <page>, <board link>`, swap `needs-signoff` for `claude-ready`. Change it: note their words on the issue, swap `needs-signoff` for `needs-design`, and the next design pass redraws it.
Then, in a Project, `send_message` the coordinator one line saying what you did, for it to post under the card; outside one, reply with that line.
```
