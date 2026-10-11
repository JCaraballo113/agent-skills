---
name: deslop
description: Removes AI-generated code slop from the branch diff against main (needless comments, abnormal defensive checks, `any` casts, deep nesting) without changing behavior. Use before commit, for /agent-skills:deslop or "deslop this branch", or when jstack-mode's playbook step calls for it.
---

# Remove AI code slop

Check the diff against main and remove AI-generated slop introduced in the branch.

## Focus Areas

- Extra comments that are unnecessary or inconsistent with local style
- Defensive checks or try/catch blocks that are abnormal for trusted code paths
- Casts to `any` used only to bypass type issues
- Deeply nested code that should be simplified with early returns
- Other patterns inconsistent with the file and surrounding codebase

## Guardrails

- Keep behavior unchanged unless fixing a clear bug.
- Prefer minimal, focused edits over broad rewrites.
- Keep the final summary concise (1-3 sentences).
