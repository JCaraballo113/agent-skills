# ESLint Implementation (JS/TS)

The JS/TS instantiation of the guardrail philosophy in
[SKILL.md](./SKILL.md).

## The rules

Flat config only. Install `eslint-plugin-no-comments` and
`eslint-plugin-sonarjs` (dev deps) and layer this on the repo's framework
base config:

```js
import noComments from "eslint-plugin-no-comments";
import sonarjs from "eslint-plugin-sonarjs";

const LOOP =
  ":matches(ForStatement, ForOfStatement, ForInStatement, WhileStatement, DoWhileStatement)";

const guardrails = {
  "max-lines": ["error", { max: 250, skipBlankLines: true }],
  "max-lines-per-function": ["error", { max: 50, skipBlankLines: true }],
  "max-statements": ["error", 20],
  complexity: ["error", 10],
  "sonarjs/cognitive-complexity": ["error", 10],
  "max-depth": ["error", 3],
  "no-restricted-syntax": [
    "error",
    {
      selector: `${LOOP} ${LOOP}`,
      message:
        "A loop inside a loop: extract the inner loop into a named function, or reshape the data so one flatMap walks it.",
    },
  ],
  "max-params": ["error", 3],
  "max-classes-per-file": ["error", 1],
  "no-magic-numbers": [
    "error",
    {
      detectObjects: false,
      enforceConst: true,
      ignore: [0, 1, -1, 2, "0n"],
      ignoreArrayIndexes: true,
    },
  ],
  "id-length": ["error", { min: 2, exceptions: ["z", "_"] }],
  eqeqeq: ["error", "always", { null: "ignore" }],
  "no-console": ["error", { allow: ["error", "warn"] }],
};

// { name: "ai-guardrails", plugins: { "no-comments": noComments, sonarjs },
//   rules: { ...guardrails, "no-comments/disallowComments": "error" } }
```

Deliberate deviations from the article, learned in practice:

- **`max-params: 3`, not 2** — TanStack Query / react-hook-form / Hono
  middleware callback signatures are 3-ary and not ours to redesign. Our
  own functions still prefer a single object param.
- **`max-lines-per-function: 120` for `.tsx`** (50 elsewhere) — JSX inflates
  line counts without adding logic; `complexity` and `max-statements` still
  apply at full strength there.
- **Nesting is capped three ways, because cyclomatic complexity cannot see
  it.** `complexity` counts branches, so three nested loops score the same
  as three loops in a row. `sonarjs/cognitive-complexity` (one rule from
  the plugin, at the same 10 as `complexity`) adds a penalty per nesting
  level; `max-depth: 3` bounds block nesting outright; and the
  `no-restricted-syntax` selector names the one shape that always reads
  badly, a loop directly inside a loop, with the fix in its message. A
  nested walk over a data shape is the tell that the shape wants a type
  and a `flatMap`.
- **No plugin presets** — one named rule from `sonarjs`, never its
  `recommended` config, and none of `unicorn`/`security`. This rule set is
  the whole system.

Scoped exemptions (separate flat-config blocks):

- **Vendored/generated code** (e.g. shadcn `components/ui/**`): size,
  complexity (cyclomatic and cognitive), `max-depth`, the loop selector,
  magic-number, and comment rules off. Correctness rules stay.
- **`tests/**`, `scripts/**`**: size/params/complexity (cyclomatic and
  cognitive)/magic-number/console off — specs assert literals, describe
  blocks are one long function. `max-depth` and the loop selector stay
  on: a spec nested four deep reads no better than any other code.
  Comments stay banned; test names carry intent.
- **Root `*.config.*` files**: comments allowed, everything else applies.

## Protect the config with a hook

The caps only hold if the agent can't quietly rewrite them. Install a
PreToolUse hook that denies Edit/Write on the ESLint config. Install it
**last** — after the config has reached its final shape (fresh scaffold
done, or remediation finished), or the hook blocks the setup itself.

`.claude/hooks/protect-eslint.sh` (then `chmod +x` it):

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')
FILENAME=$(basename "$FILE_PATH")

if [[ "$FILENAME" == eslint.config.* ]]; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Modifying the ESLint config is forbidden. If you believe a rule makes your task impossible, report this to the user and explain why."
    }
  }'
  exit 0
fi
exit 0
```

Register it in the project's **committed** `.claude/settings.json` (merge
into the existing file if there is one) so the guardrail ships with the
repo:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-eslint.sh"
          }
        ]
      }
    ]
  }
}
```

Why this exact shape:

- **Silent fallthrough on non-matches — never emit `{"decision":
  "approve"}`.** On PreToolUse, `approve` bypasses the permission prompt
  for the matched tool call, so an approve-by-default hook silently
  auto-approves every Edit/Write in the repo. No output means "no
  opinion" and normal permissions apply.
- **`permissionDecision: "deny"`** is the current PreToolUse output
  format; bare `decision: "block"` is its deprecated spelling.
- **`eslint.config.*`** covers `.js`/`.mjs`/`.ts` flat configs.
- The deny reason is fed back to the agent, so it names the escalation
  path (report to the user) instead of dead-ending.
- The hook guards Edit/Write only — a `sed` rewrite via Bash still gets
  through. It's a tripwire, not a sandbox; `docs/agents/linting.md`
  stays the instruction of record.

## Remediation specifics

Follow the workflow in [SKILL.md](./SKILL.md); the ESLint details:

- Measure with `npx eslint --format json`.
- `eslint --fix` strips non-functional comments (no-comments is
  auto-fixable) after the harvest; collapse leftover blank-line runs.
- Cheapest-first order: `id-length` renames (`i` → `index`, comparators
  `(a, b)` → `(left, right)`) and magic numbers → named constants
  (constants duplicated across client/server Zod schemas get one shared
  module) → decompose oversized functions into named step helpers (guard
  helpers returning `{ value } | { response }` unions work well for route
  handlers) → split oversized files along domain seams → extract
  subcomponents (grouped state like a dialog-state union often collapses
  lines and complexity at once).

Gotchas: `detectObjects: false` already spares `{ status: 409 }`-style
object literals — only bare arguments/operands need constants (HTTP
statuses as bare args deserve a tiny `http-status.ts`). ESLint's
`complexity` counts `??` and repeated `x?.kind === "a" ? … : null`
patterns — extract tiny accessor functions.
