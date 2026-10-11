# jstack: the pstack port

jstack is [pstack](https://github.com/cursor/plugins/tree/main/pstack) 0.15.17 (Lauren Tan, MIT) ported from Cursor to Claude Code. `jstack-mode` is the entry skill. It matches a task to one of its playbooks and calls the other jstack skills as the steps need them. The port keeps pstack's wording and rules. It changes only what Cursor does differently from Claude Code, listed below, so a later sync with upstream can re-apply the same edits.

`scripts/check-jstack.sh` fails on any Cursor-only term left in `skills/` or `agents/`. Run it after every edit to a jstack file.

## Names

| pstack | jstack |
|---|---|
| `poteto-mode` skill, `/poteto-mode` | `jstack-mode`, `/agent-skills:jstack-mode` |
| `poteto-agent` | `agent-skills:jstack-agent` |
| `Comment Sicko` agent | `agent-skills:comment-sicko` |
| A read-only `generalPurpose` subagent | `agent-skills:jstack-reader` |
| `setup-pstack`, `poteto-help` | `setup-jstack`, `jstack-help` |
| The **principle-x** skill | The **x** principle, at `principles/x.md` in the jstack-mode skill |
| `deslop`, `control-ui`, `control-cli` from `cursor-team-kit` | The bundled **deslop**, **control-ui** and **control-cli** skills |
| pstack, the plugin | jstack, the skills in this plugin |
| Any other skill | Same name. The model invokes it as `agent-skills:<name>`, and a person types `/agent-skills:<name>`. |

## Tools and mechanics

| Cursor | Claude Code |
|---|---|
| `Task` tool | Agent tool |
| `subagent_type: generalPurpose` with `readonly: true` | `subagent_type: "agent-skills:jstack-reader"`. It has no Edit or Write but keeps MCP, so Cursor's warning that read-only mode strips MCP no longer applies. |
| `generalPurpose` in agent mode (`readonly: false`) | `subagent_type: "general-purpose"` |
| `environment: "cloud"` | `isolation: "remote"` when the Agent tool offers it, else `isolation: "worktree"` |
| `environment: "local"` | No `isolation`, or `isolation: "worktree"` when the worker edits files |
| A model slug such as `claude-opus-5-5-xhigh` | `model: "fable"`, `"opus"`, `"sonnet"` or `"haiku"`. Omit `model` to inherit the parent's. |
| `AskQuestion` | `AskUserQuestion` |
| Cursor's `/loop` | The bundled `/loop` skill. Self-paced runs wake through `ScheduleWakeup`, and fixed intervals through `CronCreate`. |
| A Custom Mode (`mode: true`, `reminder:`) | `/agent-skills:jstack-mode` per task, or `claude --agent agent-skills:jstack-agent` for a whole session |
| Cursor's built-in `create-skill` | The **writing-for-agents** skill from mattpocock-skills when installed. Otherwise follow the Authoring playbook directly. |
| A Cursor cloud agent or cloud subagent | A Claude Code cloud session, or an Agent call with `isolation: "remote"` |
| The `agent-transcripts/` directory the system prompt names | `~/.claude/projects/<project>/<session-id>.jsonl`, where `<project>` is the working directory with every non-alphanumeric character replaced by `-`. Subagents write `<session-id>/subagents/agent-<id>.jsonl` beside it. In a SKILL.md, `${CLAUDE_SESSION_ID}` is this session's id, so `ls ~/.claude/projects/*/${CLAUDE_SESSION_ID}.jsonl` finds the transcript. Transcripts are kept 30 days. |
| `~/.cursor/rules/pstack-models.mdc` | `~/.claude/rules/jstack-models.md`, a user rule that loads in every session |
| `.cursor/skills/<name>/`, `.cursor/settings.json` | `.claude/skills/<name>/`, `.claude/settings.json` |
| Bugbot as the review bot | Any review bot: Claude Code Review, CodeRabbit, Bugbot and others. Bot detection lives in `watch-pr`. |
| Landing through Origin | `gh` only |
| Graphite `gt` | `git` and `gh` |
| A Cursor restart | A Claude Code restart or session end |

## Paths

Inside a SKILL.md, `${CLAUDE_SKILL_DIR}` is that skill's folder and `${CLAUDE_PLUGIN_ROOT}` is the plugin root. Both are substituted when the skill loads. Playbooks and references are plain files read later, so their paths stay relative to the skill folder that owns them, as in upstream.

## Invocation

pstack hid 51 of its 52 skills from the model. In Claude Code, `disable-model-invocation: true` also stops the model and other skills from invoking a skill, so jstack-mode could not run `how` and a routine could not run `deslop`. jstack therefore keeps every routed skill model-invocable, with a description that says when to use it. Only the skills a person runs by hand keep the flag: `setup-jstack`, `jstack-help`, `automate-me`, `ketchup` and `bro`.

## Model roles

`setup-jstack` writes one line per role to `~/.claude/rules/jstack-models.md`. A role with no line keeps the default below. A value of `inherit` runs the role on the parent's model. Panel roles take a list, and one subagent runs per entry.

| Role | Default |
|---|---|
| feature, refactoring | opus |
| bug-fix | opus |
| perf-issue | opus |
| hillclimb | opus |
| judgment and prose | fable |
| hardest tasks | fable |
| how explorer | sonnet |
| how explainer | fable |
| why investigators | sonnet |
| why synthesizer | fable |
| reflect tooling | opus |
| reflect judgment, divergent, synthesizer | fable |
| arena runners | fable, opus |
| arena cross-judge pool | fable, opus |
| swarm workers | sonnet |
| architect runners | fable, opus |
| interrogate reviewers | fable, opus |

pstack paired a Claude model with Grok so that reviewers came from different model families. jstack pairs Fable with Opus. Where a skill asks for a judge from a different family than the candidates, it takes the tier that wrote no candidate until a non-Claude reviewer such as Codex is added.
