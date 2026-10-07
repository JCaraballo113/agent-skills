---
name: guided-review
description: Turn a branch or PR diff into a local guided-review page where the story drives the code. Short explanations on the left select the exact lines on the right; notes are pinned to file and lines; comment-only and rename-only changes fold away; steps run core change first, tests and generated files last. Use when the user asks for a guided review, a walkthrough of a PR or branch, help reviewing a large diff, or wants a reviewer to understand a change before reading it.
---

# Guided review

Make one local HTML page that walks a reviewer through a change. The page has an overview (what changed and why,
risks, a before/after drawing, a glossary) and then numbered steps. Each step is a column of short **beats**. The
beat at the reader's eye line selects a file and a line range, and the code pane on the right scrolls there,
outlines the lines and dims the rest. The reader marks files viewed, adds notes to beats, and copies the notes as
Markdown for the PR review.

The page embeds repo source. It never leaves the machine: do not commit it, publish it, or upload it.

## Requirements

`node` (>= 20) and `git`, declared in `skill.deps.json`. If one is missing, give the user the install command for
their platform from that file and stop.

## Steps

1. **Choose a work directory outside the repo**, for example `$TMPDIR/guided-review/<repo>-<branch>/`. All
   outputs go there: the manifest, the review file and the page.
2. **Collect.** From this skill's directory:
   `node collect.mjs --repo <repo> --base <base> --head <head> --out <work>/manifest.json`
   Add `--generated '<regex>'` (repeatable) for repo-specific generated paths, for example committed artifacts,
   codegen output or env type files. The script prints each file with its default tier: code, tests, docs or
   generated.
3. **Get the PR facts** when a PR exists: `gh pr view --json number,title,url,author`. Without a PR, use the
   branch name as the title and omit `number` and `url`.
4. **Read the change.** Read every code diff. Skim tests and docs. Read the design doc or README the change updates;
   it usually states the intent. Find the risks: deploy order, runtime behavior changes, migrations, stale docs.
5. **Write `<work>/review.json`** (shape below). Follow **Language** for every text field. Order the steps by
   importance: the core change first, then supporting changes, tests, docs, generated files.
6. **Render.** `node render.mjs --manifest <work>/manifest.json --review <work>/review.json --out <work>/review.html`
   The renderer stops if a changed file is in no step or in two steps, or if a note points at a line the diff does
   not show. Fix `review.json` and render again.
7. **Open the page** (`open`, `xdg-open` or `start`) and tell the user the keys: `j`/`k` move between beats, `v`
   marks the pane's file viewed, `←`/`→` move between steps.

## review.json

| field | content |
|---|---|
| `number`, `title`, `url`, `author` | the PR (`number` and `url` are optional) |
| `reason[]` | 2–4 short paragraphs: the context first, then what changes and why |
| `terms[]` | `{ term, means }` for each domain word the review uses (see **Language**) |
| `wasIs[]` | `{ subject, was, is }`: one row for each thing that changes |
| `flows.was[]`, `flows.is[]` | optional before/after drawing: `{ label, steps: [node, edge, node, …], blocked? }` |
| `notes[]` | `{ level: "critical" \| "note", text }`; `critical` shows as "Before you start" |
| `chapters[]` | the steps: `{ id, kind, title, bridge, summary[], checks[], commands?[], files[] }` |
| `files[]` | `{ path, note, annotations?: [{ line, to?, text }] }`; `line` and `to` are new-side line numbers |

- `kind` is `core | supporting | tests | docs | generated`. It sets the step badge and how docs and generated hunks
  fold.
- Each annotation becomes a beat. A file with no annotation gets one beat from its `note`, pointed at its first
  changed block. Files that change only comments or identifiers fold into one "mechanical" beat.
- Write annotations for the lines a reviewer must understand. Skip lines the `note` already explains.
- `commands` is `[{ label, cmd }]`: the exact command to run each test the step adds.
- `bridge` is one or two sentences: why this step comes now.

A minimal example:

```json
{
  "number": 412,
  "title": "Rate-limit the export endpoint",
  "reason": ["Before this PR, one client could start unlimited exports. Each export holds a database connection. This PR limits each client to 3 exports at a time."],
  "terms": [{ "term": "export slot", "means": "One of the 3 concurrent exports a client can hold." }],
  "wasIs": [{ "subject": "Concurrent exports per client", "was": "No limit.", "is": "3. A 4th request gets HTTP 429." }],
  "notes": [{ "level": "critical", "text": "Deploy the migration first. If you do not, the limiter reads a missing table and every export fails." }],
  "chapters": [{
    "id": "limiter", "kind": "core", "title": "Add the export limiter",
    "bridge": "Start here. This is the change itself.",
    "summary": ["`ExportLimiter` takes a slot before an export starts and gives it back when the export ends."],
    "checks": ["Make sure that a failed export gives its slot back."],
    "files": [{ "path": "src/export/limiter.ts", "note": "The limiter.", "annotations": [{ "line": 18, "to": 31, "text": "The slot is given back in `finally`, so an error cannot leak it." }] }]
  }]
}
```

## Language

The guide exists so the reader understands. Write every text field (`reason`, `bridge`, `summary`, `checks`,
`note`, annotation `text`, `notes`, `terms`) for a reader who knows the codebase but not this change.

**Context first.** Start each explanation from what the reader already knows: the state before the change, or the
step before this one. Then give the change. Then give the reason.

**Simplified Technical English (ASD-STE100).**
- Keep a sentence to 20 words or fewer for an instruction, and 25 words or fewer for a description.
- Put one topic in each sentence. Put no more than six sentences in a paragraph.
- Use the active voice. Use the simple present, past or future tense.
- Use simple words with one meaning: "use", not "utilize"; "start", not "commence"; "make sure", not "ensure that".
- Keep "the", "a" and "this". Do not drop them to save space.
- Do not use phrasal verbs when a single verb exists ("find out" → "find", "set up" → "configure").
- Do not stack more than three nouns. Write "the timeout of the export job", not "export job retry timeout value".
- Write a warning first, then the instruction, then the reason: "Deploy the migration first. If you do not, exports fail."
- Use a numbered list for steps that must happen in order.

**One name for each thing (ubiquitous language).**
- If the repo has `GLOSSARY.md`, use its terms. If it has `GLOSSARY-MAP.md`, follow it to the correct glossary.
  If neither exists, use `CONTEXT.md` (and `CONTEXT-MAP.md`) the same way. If none of these exist, use the names
  in the code and the design docs.
- Use the same word for the same thing everywhere in the review. Do not use synonyms.
- Code names (identifiers, ids, hashes, paths) are technical names. Keep them exact and put them in backticks.
- Put each domain word the review uses in `terms[]`, with a one-sentence meaning in the same style.

**Plain words for risk.** Name the risk, what makes it happen, and who must act. Do not soften it.

## Checks before you hand it over

- `render.mjs` passes: every file is in exactly one step, and every note is on a visible line.
- Each step has a `bridge` and at least one beat that points at code.
- Every text field follows **Language**. Read each sentence and split it if it has two topics.
- Open the page and walk one step with `j`: each beat must select the lines it talks about.
- The work directory is outside the repo, and nothing from it is staged in git.
