# Fork brief

The prompt each fork receives, filled in per ticket. A fork inherits the orchestrator's context, so the brief carries only what differs per fork and what the fork must not assume. When the orchestrator implements inline, it runs the **implement loop** paragraph itself.

```
You are the fork implementing ticket <ID> "<title>" in your own git worktree,
cut from <BASE SHA> on <branch>. Execute directly; do not re-delegate the
implementation. Work only inside your worktree, commit there on the
worktree's branch, never push, never touch the main checkout or its branch.
Sibling forks are implementing <other IDs> in parallel from the same base;
landing order is <order>, so expect to be rebased — keep edits to the shared
files additive. `node_modules` in your worktree is a symlink to the main
checkout's: never run an install there. If your ticket needs a new
dependency, remove the symlink first, install a real tree, and say so in
your report.

The implement loop: use /tdd where possible, at the project's pre-agreed
seams (<seams>); run typechecking regularly, single test files regularly,
and the full test suite once at the end; commit your work to the
worktree's branch. Do not run /code-review — the orchestrator reviews your
diff against <BASE SHA> at landing. Keep every repo rule
(<the rules that bite here>). Skills that interview the user cannot in this run: do only
their verify-against-the-code pass and log every open question as a
judgment call in your report instead of blocking.

Read first: <ticket>, <spec sections>, <design of record>, <engineering
docs that pin decisions>.

Scope, exactly <ID>: <the ticket's "what to build" in one paragraph, with
what is explicitly not yours and which ticket owns it>.

Ownership: you own <owned files>. Shared files — additive and minimal:
<shared files, each with what you may add there>. Do not touch <the other
fork's owned files>.

Final report (this is all the orchestrator sees): worktree branch and
commit SHAs; files added and changed; every judgment call and open
question; anything deferred and to which ticket; final typecheck, lint and
test counts and coverage on your files.
```
