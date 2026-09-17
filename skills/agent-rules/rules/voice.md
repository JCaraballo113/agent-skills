# `voice.md` — the generated rule

Applies to **projects with client-visible copy**. Generalize the specifics below to the project's vocabulary doc and test runner.

## One table per surface

Every client-visible string — labels, helpers, buttons, notices, error and empty states, page titles, alt text — lives in a copy table: a module of exported entries, each a string or a function of a typed sample (`(sample) => string`), one table per surface. Components render from the table, so a string literal in a component is a bug.

Vocabulary comes from the project's domain doc (`CONTEXT.md`): its terms are used exactly, lowercase in running copy, with proper nouns and status badges keeping their capitals. A term the doc marks internal-only is rephrased around rather than swapped for a substitute noun — it reaches no copy at all. One spelling convention throughout.

## The guard

One test renders every entry of every table with sample values and refuses a **banned list**: internal-only terms, retired synonyms of the vocabulary, first person, the other spelling convention, jargon the users do not speak, and any phrase a decision retired. A word decided for exactly one entry gets an allow-list keyed by that entry, never a global exemption. The negative path plants a banned phrase in a sample table and proves the guard fires. Rendered-screen specs assert their body text against the same list, so a literal that slipped past the table is caught where it renders.

Done when every client-visible string reads from a table, the guard renders them all, the banned list carries every internal-only term and every phrase a decision retired, and a planted phrase fails the suite.
