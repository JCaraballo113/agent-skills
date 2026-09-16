# Implementer brief

The prompt each implementer receives, filled in per ticket. The implementer starts with nothing but this brief, so it carries **pointers** — the ticket, the spec sections, the files to read, the ownership map — never the material itself. When the orchestrator implements inline, it runs the **implement loop** paragraph itself.

```
You are the implementer for ticket <ID> "<title>" in your own git worktree,
cut from <BASE SHA> on <branch>. Execute directly. Work only inside your
worktree, commit there on the worktree's branch, never push, never touch
the main checkout or its branch. Sibling implementers are working on
<other IDs> in parallel from the same base; landing order is <order>, so
expect to be rebased — keep edits to the shared files additive. `node_modules` in your worktree is a symlink to the main
checkout's, ready to use; a new dependency gets a real tree — remove the
symlink, install, and say so in your report.

The implement loop: use /tdd where possible, at the project's pre-agreed
seams (<seams>); run typechecking regularly, single test files regularly,
and the full test suite once at the end; commit your work to the
worktree's branch and report — the orchestrator reviews your diff against
<BASE SHA> at landing. Keep every repo rule
(<the rules that bite here>). Skills that interview the user cannot in this run: do only
their verify-against-the-code pass. Two kinds of open question: a judgment
call that does not change the work materially — decide, continue, and log
it in your report; a question that would make the work useless if guessed
wrong — stop and report it as your final message, and the orchestrator
answers so you can resume.

Read first: <ticket>, <spec sections>, <design of record>, <engineering
docs that pin decisions>.

Scope, exactly <ID>: <the ticket's "what to build" in one paragraph, with
what is explicitly not yours and which ticket owns it>.

Ownership: you own <owned files>. Shared files — additive and minimal:
<shared files, each with what you may add there>. <The other
implementers' owned files> are theirs.

Final report (this is all the orchestrator sees): worktree branch and
commit SHAs; files added and changed; every judgment call and open
question; anything deferred and to which ticket; final typecheck, lint and
test counts and coverage on your files.
```
