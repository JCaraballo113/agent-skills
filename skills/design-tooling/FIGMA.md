# Figma

The Figma branch of `design-tooling`: screens composed in a Figma file and
read or written through the Figma MCP.

- One Figma file per app; its **file key** and the screens canvas name are
  recorded in the agent docs. A **per-screen node map** lives in
  `docs/specs/figma-<app>.md` — screen → node id, one row per state the
  design has — so implementation is asked for by node rather than hunted
  for in screenshots.
- Invoke `figma:figma-design-to-code` before any `get_design_context`, and
  `figma:figma-use` before any `use_figma`.
- Repeated and data-driven content is mocked as component instances driven
  by real values, generated through the MCP rather than duplicated by hand.
- Exported assets (logos, gradients, previews) land under `public/` and are
  named in the agent docs so nothing re-exports them.
