# `coding-standard-updates.md` — the generated rule, and the `CODING_STANDARDS.md` it gates

Applies to **every project**. Generates the canon `CODING_STANDARDS.md` at the repo root and a coding-standard-updates rule in the host's native checked-in project instructions. Seed the canon from this project's own conventions, never from another repo's entries.

## `CODING_STANDARDS.md` — the canon

Title `# Coding standards`, then this header verbatim, then the seeded sections:

> Judgment-level conventions lint can't enforce. The review gate's Standards axis applies this file — a violation is a finding. Changes go through the coding-standard-updates rule in the project instructions. It composes with the deeper rules it deliberately does not restate: <the project's lint doc, its copy/UI rule if any, `improve-the-territory.md`>.

Seeding: read the codebase for conventions it already keeps by hand, run each through the five-point test below, and put the survivors to the human one at a time; a section enters only on approval. Two to four sections is a healthy start; zero is honest for a fresh repo — the file may ship with the header alone. Each section is a heading naming the convention as a rule ("Amounts are strings") and one to three bullets stating how the settled intent is written. Every section stands on its own: a decision it rests on is restated as the way of writing it, never linked; repo symbols and paths appear as examples, never as prerequisites.

## The coding-standard-updates instruction — the gate

- **Propose first, write second.** A convention an agent finds worth canonizing is put to the human as a proposal and enters the file only on their explicit approval; until then it lives in the conversation or a tracker note.
- **A proposal passes the five-point test before it reaches the human.** Style is *how a settled intent is written down*, repo-wide, where a machine cannot judge. Every candidate passes all five:
  1. **General** — a reader of any file could need it, and two or more real cases in the repo show it.
  2. **Expression, not decision** — applying it never re-decides what the system does; a decision is an ADR.
  3. **Judgment a machine cannot make** — a rule the linter can decide goes in the lint config.
  4. **Outlives the implementation** — still true after the module that prompted it is rewritten; it names repo-wide vocabulary, never one module's internals or one library option.
  5. **Refusable** — a stateable exception exists; a rule with none is a lint rule or an ADR invariant.
  A candidate that fails routes to where it passes: the lint config, an ADR, the module's tests, or `docs/`.
- **An entry stands on its own.** A reader understands and applies it from the text in the file, with nothing to fish for elsewhere. Repo symbols and paths appear as examples, never as prerequisites; a decision the entry rests on is restated as the way of writing it, never linked — an ADR may be deleted without the entry losing its meaning. A pointer to a composed rule marks a boundary the entry does not cross; it is never the entry's content.
- **Entries migrate out.** An entry that becomes mechanizable moves to the lint config; one that turns out to be a decision moves to an ADR, and the section keeps only the way of writing it leaves behind.
- **Write with `/writing-for-agents`.** Every edit to `CODING_STANDARDS.md` (and to its `AGENTS.md` pointer) is made with the `writing-for-agents` skill loaded — only when it passes the installed-check (wording in SKILL.md); when it doesn't, hold the proposal and install first with the command in `skill.deps.json`.
- **Sub-agent briefs carry this rule**: an agent that finds a candidate convention reports it in its debrief as a proposal already scored against the five points; the approval and the edit stay with the human's session.

## The `AGENTS.md` pointer

Under a `### Coding standards` heading: *Read `CODING_STANDARDS.md` (root) before writing any code: the repo-wide, judgment-level conventions lint can't enforce. The code-review Standards axis applies it; a violation is a finding.*
