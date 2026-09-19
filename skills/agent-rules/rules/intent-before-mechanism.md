# `intent-before-mechanism.md` — the generated rule

Applies to **every project**.

# Intent before mechanism

Write the decision in domain language before its implementation detail.

A reader can answer “what behavior does this choose?” from names, structure,
and tests without tracing math, control flow, or library behavior. Put
non-obvious mechanics behind a name that states the decision; use examples in
tests to make the boundary concrete.

Use an abstraction when it makes the governing intent clearer than direct cases.
