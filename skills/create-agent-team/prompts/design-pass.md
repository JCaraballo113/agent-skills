# The design pass routine's prompt

The design pass applies only to a repo with a design hand-off: a rule in its agent instructions that a new screen, panel or shared control is designed as a board in a design tool and signed off by the creator before it's built. Without one, drop this role. Each night it draws boards for issues labelled `needs-design` and swaps them to `needs-signoff`. It builds nothing: the morning board asks the creator to sign off, and Ship builds from a signed-off board.

**Trigger.** A scheduled role (SKILL.md, step 5), nightly, a minute off :00 and :30. The coordinator (outside a Project, a fresh session per fire) runs the cheap check below and starts a fresh thread on the filled prompt (e.g. `/mnt/project-files/agent-team/prompts/design-pass.txt`) only when it finds work.

**Cheap check.** An open issue labelled `needs-design`.

**Fill.** Each `<…>` that names something about the repo, from the survey. The design tool must be reachable from where the thread runs (its skill installed, its MCP or link working); prove one board there before the first night. Keep the re-read before each publish: two boards published from stale copies of one design file overwrite each other.

```
The nightly design pass for <owner/repo>: draw boards on <design tool and its link, e.g. "the designs canvas in Claude Design (https://claude.ai/artifact/<id>)"> for issues that wait on a design, so the morning board can ask the creator to sign off. GitHub through `gh api` (REST only); R is `repos/<owner/repo>`.

1. **Pick.** Open issues labelled `needs-design`, oldest first, at most three this run. When there are none, end quietly.
2. **Draw.** For each, one at a time: read the issue and its comments (<creator's GitHub login>'s words win; a "Change it" note says what to redo), then add its board with <how, e.g. "the design-canvas skill (`.claude/skills/design-canvas/SKILL.md` on `<default branch>`)">. Build from the app as it is: read the components the element sits in under <UI source folder, e.g. "`apps/web/src/components`">, and match the neighbouring board's colours, type and spacing. Publish one board at a time, re-reading <the design file, e.g. "`canvas.json`"> just before each publish.
3. **Hand over.** On each issue, comment the board's title, page and link, and swap `needs-design` for `needs-signoff`.

End with one short reply in this thread naming each board drawn; the morning board asks the creator to sign off.
```
