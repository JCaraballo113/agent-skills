# Pencil

The `.pen` branch of `design-tooling`: a design file driven through the
Pencil MCP.

- One `.pen` per app under `designs/` (`designs/<app>.pen`), referenced
  from the agent docs. `.pen` files are encrypted — reach them only
  through the MCP tools.
- Repeated and data-driven content is mocked as **MCP-generated instances
  driven by real values** — rows the agent builds from the live data,
  never Script nodes.
- Gotchas the MCP does not confess: an empty or `fit_content` frame at the
  root poisons the whole root (Copy the root to heal it); Copy of
  descendants-by-name works for components only; the MCP never saves the
  `.pen` — the human presses ⌘S, so say so at the end of every design pass.
