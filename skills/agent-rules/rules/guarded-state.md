# `guarded-state.md` — the generated rule

Applies to **projects with state a person must not be moved out of freely** — a request in flight, an unsaved edit, a multi-step flow mid-way, an optimistic write not yet confirmed. Generalize the specifics below to the project's own states, controls, and the fact its platform already tracks.

## The guard belongs to the state

A **guarded state** is one the product must not leave freely. The guard belongs to the state, not to the control that first enforced it — and that is where this goes wrong:

- **A new control inherits nothing.** Adding a picker, a tab, a link, a shortcut or a menu item beside an existing flow adds a new way out of its guarded state, and the guard written for the old control does not extend to it. Before adding one, list what the state already refuses, and make the new control refuse the same things.
- **The second call site means the guard is in the wrong place.** Writing the same check twice is the signal to move it to the source both controls go through — the hook, the provider, the frame, the router. A guard at a call site protects that call site; a guard at the source protects the next one somebody adds.

## Finding the source

The source is wherever the *capability* lives, not where the button is. Ask what every offending control must call in order to do the damage, and put the refusal there. If nothing common exists, that absence is the finding — introduce it rather than fanning the check out.

Prefer a fact the platform already tracks over one the project publishes itself: a library that already knows the state — a mutation registry, a form's dirty flag, a router's navigation blocker — beats a bespoke context, because it covers the controls nobody has written yet.

## Pinning it

Pin the invariant **once per control that can violate it**, not once per bug. A test written against the control that prompted the fix passes while the next control ships the same defect. When a fix adds a guard, the test names the state and the observable refusal, and the list of controls is the thing that grows.

Mutation-check a guard by removing **every** guard that could carry it: two redundant guards each satisfy the test alone, so removing one proves nothing.

## Done when

Every control that can leave the guarded state refuses it from the shared source, each has a test asserting the observable refusal, and no call site repeats a check the source could make.
