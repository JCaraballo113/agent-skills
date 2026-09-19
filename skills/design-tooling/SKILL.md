---
name: design-tooling
description: Design-first frontend tooling — every UI is designed in the project's design tool (Pencil or Figma, each through its MCP) with the impeccable skill governing design quality; design precedes implementation. Use when the user says "setup design tooling", or via setup-tooling on a frontend project.
---

# Design Tooling

Every UI is designed before it is implemented, in one design tool per
project, with the **`impeccable`** skill governing design quality.

**The tool** is this module's own detail question — **Pencil** (a `.pen`
file through the Pencil MCP) or **Figma** (a file through the Figma MCP)
— asked once when `setup-tooling` has not already
answered it; an existing project keeps the tool its agent docs name.

Check availability: `impeccable` in the available-skills list (any scope,
possibly namespaced) and the chosen tool's MCP connected. Prompt the user
to install anything missing with its command from
[skill.deps.json](./skill.deps.json); never install these silently.

Then, tool-agnostic:

- Run `impeccable init` (or note it as the next step) so `PRODUCT.md` and
  `DESIGN.md` capture the product context and the visual system the design
  work anchors to. `DESIGN.md` is the system of record for tokens, type,
  motion and voice; the design file composes screens against it, and a
  token that moves in one moves in the other in the same change.
- Encode the convention in the agent docs: where the designs live and
  through which MCP; `/impeccable` governs design quality; design precedes
  implementation.
- Keep a record per design decision in `designs/decisions/NNNN-<slug>.md`
  — what was chosen, why, the rejected alternatives — the same shape in
  either tool, so a project that migrates keeps its history.
- Design each screen in two passes, template then page: first the
  structure (layout, dynamic-content bounds), then real representative
  content, following the design-system agent rule
  (`agent-rules`) for the extremes and for mocking
  repeated, data-driven content from real values. A screen is designed
  when its extremes are mocked, at desktop and phone width.
- Copy drafted in the design file obeys the project's voice rule (also
  `agent-rules`) exactly as code does; a design-only
  string is still client-visible.

Then the tool's own mechanics: [PENCIL.md](./PENCIL.md) or
[FIGMA.md](./FIGMA.md).
