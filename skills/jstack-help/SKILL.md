---
name: jstack-help
description: Guides users through jstack setup, /agent-skills:jstack-mode, and picking the skill, playbook, or principle for a task. Type /agent-skills:jstack-help with a question.
disable-model-invocation: true
---

# jstack help

Answer the user's question about jstack, hand them a prompt they can send, and link the file the answer came from. For a help question, don't start the work. The user asked how, and a jstack run spends real tokens, so let them send the prompt.

A message that asks for work, such as "use jstack to fix this bug", is not a help question. Read [`jstack-mode`](../jstack-mode/SKILL.md), do the work under it, and mention once that `claude --agent agent-skills:jstack-agent` keeps it on for a whole session.

This file maps questions to the skills and docs that hold the answers. Those files own the details. Read the file you route to before you quote it, and trust it when it disagrees with this map. The links here point into the installed plugin, which the user may not be able to open, so give the user the file's public copy: `https://github.com/JCaraballo113/agent-skills/blob/main/` followed by its path.

## Find out what they need

Infer the need from the message and the conversation. A named situation, such as "which skill reviews a PR?", goes straight to its section. If the need is still unclear, ask one multiple-choice question with these options, then answer only the section they pick:

- Get set up
- Start a task with `/agent-skills:jstack-mode`
- Pick a skill for a situation
- Fix a run that went wrong
- Make jstack my own

Check the state that changes the answer, and mention it only when it does:

- No `~/.claude/rules/jstack-models.md` means the **setup-jstack** skill hasn't run for this user, so every role uses its default model.
- No `verify-*` skill or other app harness in the project means agents have no scripted way to drive the app. Mention `/agent-skills:create-verification-skill` when the question is about proving a change works.

When the model rule is missing and it matters, ask whether the user wants to pick a model for each role now. It matters when the user is new, the question is about setup or cost, or the answer depends on which models run. Ask at most once per chat. If the need is also unclear, ask both questions together. Offer two choices:

- Now: give them `/agent-skills:setup-jstack` to type, and answer their question too.
- Later: answer their question, and add one line saying every role keeps its default model until they run `/agent-skills:setup-jstack`.

## Get set up

1. Install with `/plugin marketplace add JCaraballo113/agent-skills`, then `/plugin install agent-skills@jcaraballo`.
2. Run [`/agent-skills:setup-jstack`](../setup-jstack/SKILL.md). It maps a model to each role and writes `~/.claude/rules/jstack-models.md`, a user rule. The rule loads when a session starts, so it applies to new sessions.
3. Start a real task with `/agent-skills:jstack-mode`, a goal, and a check that can pass or fail.

Installing adds the skills. The model loads a routed skill on its own when a task matches its description. setup-jstack, jstack-help, automate-me, ketchup, and bro load only when the user types them. [`docs/jstack-port.md`](../../docs/jstack-port.md) has the details. Offer to word their first prompt with them, per [`references/prompting.md`](references/prompting.md).

If cost is the worry, say where the tokens go and how to spend fewer. jstack spends extra tokens on subagents and review panels. Rerun `/agent-skills:setup-jstack` and pick cheaper models. A role set to `inherit` runs on the session's model, which saves tokens when the session runs on a cheaper model. A shorter panel list runs fewer subagents, one for each entry. Save `/agent-skills:jstack-mode` for work that needs rigor.

jstack is built for Claude Code. Its skills use the Agent Skills format, so other tools such as Codex can read them. But most workflow skills, including jstack-mode, how, why, and teach, spawn Claude Code subagents with per-role models, and `--agent` and `/loop` are Claude Code features, so those parts may not work there.

## Start a task with `/agent-skills:jstack-mode`

`/agent-skills:jstack-mode` matches the task to a playbook, copies the playbook's steps into the todo list, and runs the other skills as the steps need them. A step it skips stays in the list as `skip: <reason>`. A good prompt states the goal and how to tell it's done. It doesn't list skills, because a hand-written sequence tends to drop or reorder steps the playbook would keep. Read [`references/prompting.md`](references/prompting.md) before you help word one.

Whether jstack-mode stays on depends on how the user starts it:

- `/agent-skills:jstack-mode` attaches the skill to one task. It fades as the session moves on.
- `claude --agent agent-skills:jstack-agent` starts the whole session as the jstack agent, which invokes jstack-mode before any work. It stays on every turn until the session ends.
- Where a session can't start with `--agent`, start each new task with `/agent-skills:jstack-mode`.

Link Claude Code's [skills docs](https://code.claude.com/docs/en/skills) and [subagents docs](https://code.claude.com/docs/en/sub-agents) when this comes up. Mid-session, "new task" makes the mode match a fresh playbook. jstack-mode already uses `agent-skills:jstack-agent` for the subagents its playbook steps spawn. To get the same style from a subagent of your own, spawn it with `subagent_type: "agent-skills:jstack-agent"`.

## Pick a skill

The default answer is `/agent-skills:jstack-mode`, which runs most of the others when its steps need them. Name a skill directly when the user wants more or less of something than the playbook gives. Read the skill before you recommend it, and give one example prompt.

| The user wants to | Skill |
|---|---|
| Do any non-trivial task with rigor | [`/agent-skills:jstack-mode`](../jstack-mode/SKILL.md) |
| Know how code works now, or where new code should live | [`/agent-skills:how`](../how/SKILL.md) |
| Know why code is shaped this way, or where a number came from | [`/agent-skills:why`](../why/SKILL.md) |
| Understand a change or subsystem, explained plainly | [`/agent-skills:teach`](../teach/SKILL.md) |
| Catch up on their own recent work on a topic | [`/agent-skills:recall`](../recall/SKILL.md) |
| Catch up on everything in this chat since their last message, with enough context to decide each action item | [`/agent-skills:ketchup`](../ketchup/SKILL.md) |
| Know what a small diff could break outside itself | [`/agent-skills:blast-radius`](../blast-radius/SKILL.md) |
| Settle types and module shape before code that crosses a function boundary | [`/agent-skills:architect`](../architect/SKILL.md) |
| Get several attempts at one brief, merged into the best one | [`/agent-skills:arena`](../arena/SKILL.md) |
| Run parallel checks over slices, or race workers, as cloud workers | [`/agent-skills:swarm`](../swarm/SKILL.md) |
| Have different models review a diff and try to break it | [`/agent-skills:interrogate`](../interrogate/SKILL.md) |
| Fix a bug test-first when a cheap local test exists | [`/agent-skills:tdd`](../tdd/SKILL.md) |
| Apply TypeScript rules to `.ts` or `.tsx` work | [`/agent-skills:typescript-best-practices`](../typescript-best-practices/SKILL.md) |
| Strip comments before review, using a reviewer that didn't write them | [`/agent-skills:no-comments`](../no-comments/SKILL.md) |
| Strip AI slop from a branch's code before commit | [`/agent-skills:deslop`](../deslop/SKILL.md) |
| Clean AI tells out of prose | [`/agent-skills:unslop`](../unslop/SKILL.md) |
| Write docs, an RFC, a README, a PR description, or a commit message to a standard | [`/agent-skills:technical-writing`](../technical-writing/SKILL.md) |
| Hear the last reply again in plain words | [`/agent-skills:bro`](../bro/SKILL.md) |
| Drive a browser, Electron, or web UI to reproduce a bug or prove a change | [`/agent-skills:control-ui`](../control-ui/SKILL.md) |
| Drive a CLI or TUI to reproduce a bug, profile it, or prove a change | [`/agent-skills:control-cli`](../control-cli/SKILL.md) |
| Give agents a scripted way to drive the app and prove behavior | [`/agent-skills:create-verification-skill`](../create-verification-skill/SKILL.md) |
| Bring a verification skill and its feature map back in line with the app | [`/agent-skills:maintain-verification-skill`](../maintain-verification-skill/SKILL.md) |
| Vet a performance number before reporting or acting on it | [`/agent-skills:benchmark-checklist`](../benchmark-checklist/SKILL.md) |
| Run a large or cross-cutting change, or one to review after stepping away | [`/agent-skills:figure-it-out`](../figure-it-out/SKILL.md) |
| Keep a decision log during a run, and review it afterward | [`/agent-skills:show-me-your-work`](../show-me-your-work/SKILL.md) |
| Pick a model for each role | [`/agent-skills:setup-jstack`](../setup-jstack/SKILL.md) |
| Turn their own working habits into a personal mode skill | [`/agent-skills:automate-me`](../automate-me/SKILL.md) |
| Turn what a finished task taught into skill edits | [`/agent-skills:reflect`](../reflect/SKILL.md) |
| Stop agents from repeating the same mistakes in this repo | [`/agent-skills:correct`](../correct/SKILL.md) |
| Find their way around jstack | `/agent-skills:jstack-help` |

If a skill directory next to this one is missing from the table, read its frontmatter and route by its description. The principles live in the jstack-mode skill's `principles/` folder and are covered under principles below.

Close calls:

- **how** explains what the code does. **why** explains the reasons. **teach** runs one or both and explains the result plainly.
- **arena** gives every worker the same brief and merges the best parts. **swarm** splits work into slices or a race and returns one report.
- **architect** implements right after it settles the design. Add "with checkpoint" to review the design before it writes code.
- **interrogate** reviews the diff. **blast-radius** looks for breakage outside the diff and proves the one fact that makes the change safe.
- **recall** rebuilds context across recent sessions on this machine. **ketchup** covers only this session since the user's last message. Resuming one specific session or branch is the Session pickup playbook.
- **deslop** strips slop from the code before commit. **no-comments** strips comments before review. **unslop** cleans prose.
- **figure-it-out** designs one rigorous run. The Orchestrate playbook runs a program that spans days and many PRs. The Autonomous run playbook drives one task to a finish condition.

Not in jstack:

- `/loop` is bundled with Claude Code.
- The **writing-for-agents** skill that jstack uses to author skills ships in the mattpocock-skills plugin. Without it, the Authoring playbook covers the job.
- jstack has no `/orchestrate` skill. Orchestrate is a jstack-mode playbook. If the slash menu shows `/orchestrate`, another plugin provides it.

## Playbooks and principles

Playbooks are step lists inside jstack-mode, not skills, so they have no slash command. Inside `/agent-skills:jstack-mode`, describing the task picks one, and these phrases name one directly:

- "babysit this pr" or "check on pr 123" runs Babysit. It drives the PR to merge-ready and stops there. It doesn't merge unless the user asks to merge, land, or ship.
- "land the stack" runs Shipping.
- "take over this branch" runs Session pickup.
- "pause safely" runs Pause safely.
- "full autopilot on this queue" runs Autopilot-full. "stack them, don't ship" runs Autopilot-stack.
- "run the eval playbook" runs Eval.

Without jstack-mode, a phrase such as "babysit this pr" can start another installed skill for the same job instead. The Playbooks section of [`jstack-mode`](../jstack-mode/SKILL.md) lists every playbook and when it applies.

jstack has no planning skill. Claude Code's plan mode works alongside it. For work that spans phases or stacked PRs, asking `/agent-skills:jstack-mode` for a plan runs the [Multi-phase plan playbook](../jstack-mode/playbooks/multi-phase-plan.md), which writes the plan and doesn't implement it. For a design question, the Prototype playbook or the **architect** skill settles it in code first.

Principles are one-rule files in the jstack-mode skill's `principles/` folder, which jstack-mode reads and cites in its replies. They aren't skills, so they have no slash command. The user steers with the names instead, as in "apply prove it works. show me the real output." The Principles section of [`jstack-mode`](../jstack-mode/SKILL.md) lists them.

## Fix a run that went wrong

| Symptom | Fix |
|---|---|
| The mode stopped applying after a few turns | It was started for one task. Start the session with `claude --agent agent-skills:jstack-agent`, or start each task with `/agent-skills:jstack-mode`. |
| A question got treated as the next step of the last task | Say "new task", or say the turn doesn't need the mode. |
| A new model choice had no effect | The rule from `/agent-skills:setup-jstack` loads when a session starts. Start a new one. |
| Runs cost more than expected | See the cost paragraph under Get set up. |
| A skill didn't load on its own | The model loads a skill on its own only when the task matches its description. setup-jstack, jstack-help, automate-me, ketchup, and bro load only when the user types them. jstack-mode runs the others as its steps need them, and it doesn't run every skill. |
| Parallel agents overwrote each other | Give each agent its own worktree (`isolation: "worktree"`), or run them as cloud sessions (`isolation: "remote"`), which each get their own machine. |
| An overnight run moved but finished nothing | `/loop` needs a check that can pass or fail, not a duration. |
| The reply claims success from a green build | Ask for the real command, flow, stored value, or profile. That's the prove-it-works principle. |

For a run that drifts, [`references/prompting.md`](references/prompting.md) has one-line steers. [`references/recipes.md`](references/recipes.md) has the recipes worth copying.

## Make jstack my own

- [`/agent-skills:automate-me`](../automate-me/SKILL.md) drafts a personal mode skill from the user's own history, to use alongside `/agent-skills:jstack-mode`.
- [`/agent-skills:reflect`](../reflect/SKILL.md) after a session turns its lessons into skill edits the user approves.
- `/agent-skills:jstack-mode write a skill for <workflow>` runs the authoring playbook. The eval playbook tests a skill change blind.
- Fix a misbehaving skill in its own PR, not inside the feature work where it went wrong.

## Reply

Lead with the answer. Give at most one example prompt in a code block, adapted from [`references/recipes.md`](references/recipes.md) when one fits, then the link to that file. Keep it short unless the user asked for the whole map.
