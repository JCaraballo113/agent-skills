# Cloud session facts

As of October 2026, from https://code.claude.com/docs/en/claude-code-on-the-web, https://code.claude.com/docs/en/cloud-environments and https://code.claude.com/docs/en/routines, plus what a real setup showed. These pages change; when a fact matters to a decision and the user's screen disagrees, fetch the page again.

## The VM

- Ubuntu 24.04 on x86-64; the setup script runs as root, so `apt-get install` works. A tool that downloads a per-platform binary needs its linux-x64 build (Chrome for Testing has no Linux ARM build).
- Ubuntu's own packages are older than Homebrew's: ffmpeg is 6.1, for example, where a Mac has a newer one, and some flags behave differently.
- About 4 vCPUs, 16 GB RAM, 30 GB disk.
- Preinstalled:
  - Python 3 with pip, poetry, uv, black, mypy, pytest, ruff;
  - Node 20, 21 and 22 (at `/opt/node20` etc., 22 on `PATH`), with npm, yarn, pnpm, bun, eslint, prettier and chromedriver;
  - Ruby 3.1–3.3; PHP 8.3; OpenJDK 21 with Maven and Gradle; Go; Rust;
  - GCC, Clang, cmake, ninja; Docker and docker compose; PostgreSQL 16; Redis 7;
  - git, gh, jq, yq, ripgrep, tmux.
- `check-tools` on the VM prints the versions.
- Anything else, including a newer Node, comes from the setup script.
  - A newer Node: `npm install -g n && n <major> && hash -r`.
  - Node 25+ has no corepack, so install the pinned package manager with npm (`npm install -g pnpm@<version>`).
- Bash waits 2 minutes for a foreground command, 10 at most. Raise the limits with `BASH_DEFAULT_TIMEOUT_MS` / `BASH_MAX_TIMEOUT_MS` in the environment variables.

## A headless browser

Chrome Headless Shell, Puppeteer, Playwright and Remotion need these on Ubuntu 24.04, none of them preinstalled:

```bash
apt-get install -y --no-install-recommends libnss3 libdbus-1-3 libatk1.0-0t64 libgbm1 libasound2t64 libxrandr2 libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0t64 libpango-1.0-0 libcairo2 libcups2t64 fonts-liberation
```

`ldd <browser binary> | grep "not found"` lists any still missing.

## Proof a person can see

A run can show its work in the PR, not just say it passed:

- **Screenshots**: `scripts/shot.mjs` (in this skill; copy it to the repo's `scripts/`) drives Chrome Headless Shell over the DevTools protocol with Node alone: open a page, click or run script, wait for text, save a PNG. It needs the headless-browser libraries above. A repo that already downloads a browser can point it there with `--browser`.
- **Images in a PR**: GitHub's REST API takes no attachments, so `scripts/proof.sh` (also here) pushes them to a `proof` branch that's never merged, one folder per issue, and prints Markdown linking `https://github.com/<owner>/<repo>/blob/proof/<folder>/<file>?raw=true`. In a private repo only people with access see them, as with the PR itself. Git only, so it works where `gh` can't.

## Reproducing the VM

To find a cloud-only failure without a cloud round trip, run the repo in a container that matches the VM:

```dockerfile
FROM --platform=linux/amd64 ubuntu:24.04
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates xz-utils git libatomic1 <the repo's apt packages>
# then the runtime at the version the setup script installs
```

Run it with `--platform linux/amd64 --cpus 4 --memory 16g`, and feed it the working tree with `git archive $(git stash create || echo HEAD) | docker run -i … tar -x`. A plain tar from macOS carries `._*` files that test runners pick up. On Apple silicon the amd64 image runs under emulation: slower, but faithful. An arm64 image is faster for anything that doesn't fetch platform binaries.

## Setup script

- Runs before Claude Code starts on a session's first boot.
- It must:
  - exit 0, or the session fails to start (`|| true` on non-critical lines);
  - finish within about 5 minutes, or the environment isn't cached. Run independent installs in parallel with `&` and `wait`.
- Its filesystem is snapshotted and reused by later sessions.
- The snapshot is rebuilt when the script or the allowed hosts change, and about every 7 days.
- Running services aren't kept in the snapshot. Start them per session, or with a SessionStart hook in the repo.

## Network

- **Trusted** (the default) allows the package registries, GitHub, nodejs.org, the Ubuntu archives, `*.googleapis.com` and other common hosts. The full list is on the cloud-environments page.
- **Custom** is your own list, plus the defaults when ticked. **Full** is any host. **None** blocks all outbound traffic.
- GitHub goes through its own proxy whatever the level. That proxy passes GitHub's REST API but blocked its GraphQL API (seen in October 2026), so `gh issue …` and `gh pr …` fail in a session; `gh api` on REST paths works (`gh api repos/<owner>/<repo>/issues/<n>`, `-X POST …/pulls` for a PR).

## What carries over from the repo

Carried over:

- `CLAUDE.md` and `.claude/rules/`;
- `.claude/skills/`, `.claude/agents/`, `.claude/commands/`;
- `.claude/settings.json` hooks and permissions;
- `.mcp.json` servers, for a session with one repository.

Not carried over:

- **Plugins.** Neither the repo's `enabledPlugins` / `extraKnownMarketplaces` nor the user's own plugins are installed.
  - Install them from the setup script with `claude plugin marketplace add <owner/repo>` and `claude plugin install <plugin>@<marketplace>`. This worked in practice.
  - Uploading a skill to claude.ai also loads it into cloud sessions.
- **The user's local setup:** `~/.claude/CLAUDE.md`, user-level skills and agents, and MCP servers added at local or user scope.
- **Anything that only exists on the user's machine:** desktop apps, a local browser, macOS tools.

## Billing and models

- Cloud sessions and routines need a claude.ai sign-in. An API key isn't accepted.
- They count toward the plan's usage limits alongside all other Claude use. Parallel sessions use them up proportionally faster.
- With usage credits on (claude.ai/settings/usage), routines keep running past the limit as metered overage. Off, they wait for the limit to reset.
- Never put a model provider's API key in the environment.
- **Model:**
  - A routine has its own picker in its prompt box.
  - A session uses the composer's pick or `/model <name>`.
  - `ANTHROPIC_MODEL` in the environment variables may set a default. That's not documented for cloud sessions, so confirm with `/status`.

## Starting work

- `claude --cloud "<task>"` clones the remote at the current branch, so push first. Each call is its own session.
- `claude --teleport` pulls a session and its branch into the terminal.
- Sessions also start from claude.ai/code and the Claude app.
- Auto-fix (on a PR, from its session's CI bar) answers failing checks and review comments. It needs the Claude GitHub App.

## Routines

- Created at claude.ai/code/routines, or with `/schedule` in the CLI.
- **Triggers:**
  - A schedule, hourly at most.
  - An API endpoint with a bearer token. Its `text` arrives wrapped as untrusted data.
  - GitHub events. The docs list only pull request and release events; the routine form also offers issue events (Issue: Opened, Issue: Labeled) with filters such as Labels is one of.
  - GitHub events past an hourly cap are dropped.
- **A draft PR starts no routine** (seen in October 2026): Pull request: Opened fired for a ready PR and never for a draft, with or without an Is draft filter, and a Head branch filter on `claude/` didn't match either. A routine that should see a run's PRs needs them opened ready, with its own check of the branch in the prompt.
- A GitHub-triggered run gets a short block added to its prompt, wrapped in `<github-trigger-context>`, that names the event and nothing more (seen in October 2026; the docs don't say):

  ```
  Event: issues.labeled
  Repository: <owner/repo>
  Issue: #105 — <title>
  URL: https://github.com/<owner/repo>/issues/105
  ```

  It leaves out the issue's body, its comments and which label was added: the run fetches those with `gh`. A label filter decides which events start a run, by the issue's labels when the event fires (adding any label to an issue that still has the filtered one starts a run); the run itself can't tell which label fired, so it checks the issue's labels.
- All the user's connectors are included by default, and a run uses them without asking. Remove every one the routine doesn't need.
- Runs act as the user on GitHub and push `claude/` branches. Use branch protection to fence the rest.
