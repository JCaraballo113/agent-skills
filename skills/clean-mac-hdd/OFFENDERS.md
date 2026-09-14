# Known offenders

Producers met on real machines. Sizes are the ones observed, to calibrate what "large" means for each.

| Path | Producer | Class | Reclaim | Stop the leak |
|---|---|---|---|---|
| `~/.foundry/anvil/tmp/anvil-state-*` | Foundry `anvil`. Once in-memory history fills, it writes one state file per mined block; with `--block-time 1` that is a file a second, each growing with chain state. Anvil removes the dir on a clean exit only, so a `concurrently -k` or Ctrl-C kill leaves it behind. Observed: 120 GB across 7 sessions. | Leak | `pgrep -fl anvil` first; then `rm -rf ~/.foundry/anvil/tmp` | Add `--prune-history` to the launch line: keeps only the latest state, writes nothing. |
| `~/Library/Containers/com.docker.docker/.../Docker.raw` | Docker Desktop's VM disk. Sparse: `ls` shows the reserved size (60 GB), `du` the allocated (20 GB). | Data | `docker system prune -f` for stopped containers and dangling images; `docker system prune -a` also drops unused images. The file itself shrinks only from Docker Desktop → Settings → Resources → Disk image size. | Lower the disk image limit in Settings. |
| `~/.npm/_cacache` | npm. Observed 13 GB. | Regenerable | `npm cache clean --force` | — |
| `~/Library/Caches/Yarn` | Yarn classic. Observed 11 GB. | Regenerable | `cd ~ && yarn cache clean` — from inside a repo with a `packageManager` field, Corepack refuses the global yarn and the command does nothing. | — |
| `~/Library/pnpm`, `~/Library/Caches/pnpm` | pnpm store and metadata cache. Observed 7 GB + 1.5 GB. | Regenerable | `pnpm store prune` removes orphaned packages; the store keeps what current repos use. | — |
| `~/Documents/repos/*/node_modules` | Every checked-out JS repo. Observed 19 GB across ~30 repos. | Regenerable | `find ~/Documents/repos -maxdepth 3 -type d -name node_modules -prune -exec du -sk {} +` to list; delete those of repos untouched for months, `pnpm install` rebuilds. | — |
| `~/Documents/repos/*/test-ledger` | Solana `solana-test-validator` ledgers. Observed 5 GB each. | Leak | `rm -rf` the ledger dir; the validator recreates it. | Run the validator with `--reset` or a ledger path under the scratch dir. |
| `~/Library/Application Support/Claude/vm_bundles` | Claude desktop app's sandbox VM image. Observed 10 GB. | Data | Part of the app; deleting it triggers a re-download on next use. | — |
| `~/.claude` | Claude Code: plugin cache, session transcripts, file history. Observed 1.2 GB. | Data | Small by design; the session temp dir under `/private/tmp/claude-<uid>` clears itself. | — |
| `~/Library/Developer/CoreSimulator` | Xcode iOS simulators. Observed 2.7 GB; grows past 20 GB with several runtimes. | Regenerable | `xcrun simctl delete unavailable`; unused runtimes from Xcode → Settings → Platforms. | — |
| `~/Library/Developer/Xcode/DerivedData` | Xcode build products. | Regenerable | `rm -rf ~/Library/Developer/Xcode/DerivedData` | — |
| `~/Library/Caches/ms-playwright`, `~/.agent-browser` | Playwright and agent-browser browser downloads. Observed 0.7 GB each. | Regenerable | `npx playwright uninstall --all`; agent-browser re-downloads on demand. | — |
| `~/Library/Caches/pip`, `~/Library/Caches/go-build`, `~/.cargo/registry` | Language package and build caches. Observed 1 GB, 0.5 GB, 0.3 GB. | Regenerable | `pip cache purge`; `go clean -cache`; `cargo cache -a` or `rm -rf ~/.cargo/registry/cache`. | — |
| `~/.ollama/models` | Ollama model weights. Observed 1.9 GB. | Data | `ollama list` then `ollama rm <model>` for models no longer used. | — |
| `~/Library/Group Containers/group.net.whatsapp.WhatsApp.shared` | WhatsApp desktop media. Observed 10 GB. | Data | WhatsApp → Settings → Storage; or sign out and back in to drop the local media cache. | — |
| `~/Library/Caches/<browser>`, `~/Library/Application Support/<browser>` | Edge, Chrome, Brave profiles and caches. Observed 1–5 GB each. | Regenerable (Caches) / Data (Application Support) | Clear browsing data inside the browser; the Caches folder is safe to delete with the browser closed. | — |
| `/opt/homebrew` | Homebrew formulae, old versions, download cache. | Regenerable | `brew cleanup --prune=all` | — |
