# Known offenders

Producers met inside WSL 2 distros. Host-side files are listed last; everything else is inside Linux.

| Path | Producer | Class | Reclaim | Stop the leak |
|---|---|---|---|---|
| `/var/lib/docker` | Docker Engine installed inside the distro (as opposed to Docker Desktop). Images, build cache, dangling volumes. Often the single largest folder. | Regenerable | `docker system df` to see; `docker system prune -a --volumes` for everything not used by a running container. | `docker builder prune` on a schedule; a build-cache limit in `/etc/docker/daemon.json`. |
| `/var/cache/apt/archives` | apt's downloaded `.deb` files. | Regenerable | `sudo apt clean && sudo apt autoremove --purge` | — |
| `/var/log/journal` | systemd journal with no size cap. Grows for the life of the distro. | Leak | `sudo journalctl --vacuum-size=100M` | `SystemMaxUse=100M` in `/etc/systemd/journald.conf`. |
| `/var/log/*.gz`, `/var/log/*.1` | Rotated logs; also `/var/log/syslog` when nothing rotates it. | Regenerable | `sudo find /var/log -name '*.gz' -delete`; `sudo truncate -s 0 /var/log/syslog` | logrotate with a `maxsize`. |
| `/var/lib/snapd/snaps` | Snap keeps two old revisions of every package. | Regenerable | `sudo snap set system refresh.retain=2`, then remove disabled revisions: `snap list --all \| awk '/disabled/{print $1, $3}' \| while read n r; do sudo snap remove "$n" --revision="$r"; done` | `refresh.retain=2` |
| `~/.foundry/anvil/tmp/anvil-state-*` | Foundry `anvil`. Once in-memory history fills it writes one state file per mined block; removes the dir on a clean exit only, so a killed process leaves it. Observed 120 GB on a Mac. | Leak | `pgrep -fl anvil` first; then `rm -rf ~/.foundry/anvil/tmp` | Add `--prune-history` to the anvil launch line. |
| `~/.npm/_cacache`, `~/.cache/yarn`, `~/.local/share/pnpm/store`, `~/.cache/pnpm` | npm, Yarn, pnpm. | Regenerable | `npm cache clean --force`; `cd ~ && yarn cache clean` (from inside a Corepack repo the command does nothing); `pnpm store prune` | — |
| `~/**/node_modules`, `.next`, `.turbo`, `node_modules/.cache` | Every checked-out JS repo. | Regenerable | `find ~ -maxdepth 4 -type d -name node_modules -prune -exec du -sk {} + \| sort -rn`; delete those of repos untouched for months, `pnpm install` rebuilds. | — |
| `~/.cache/pip`, `~/.cache/go-build`, `~/go/pkg/mod`, `~/.cargo/registry`, `~/.rustup/toolchains` | Language caches and toolchains. | Regenerable | `pip cache purge`; `go clean -cache -modcache`; `cargo cache -a` or delete `registry/cache`; `rustup toolchain list` then `rustup toolchain uninstall <old>` | — |
| `~/.cache/huggingface`, `~/.ollama/models` | Model weights. | Data | `huggingface-cli delete-cache`; `ollama rm <model>` | — |
| `/tmp`, `~/.local/share/Trash` | Temp files of killed tools; files "deleted" from a GUI file manager. | Leak | `rm -rf /tmp/* ~/.local/share/Trash/*` with nothing running. | — |
| `/mnt/c/...` | The Windows drive, counted by any `du` without `-x`. Not WSL space at all. | — | Use `clean-windows-hdd`. | — |
| `core`, `core.<pid>`, `*.hprof` | Core dumps and JVM heap dumps left where a process crashed. | Leak | `find ~ -name 'core.[0-9]*' -o -name '*.hprof'` then delete. | `ulimit -c 0` in the shell profile. |
| **Host:** `%LOCALAPPDATA%\Packages\<distro>\LocalState\ext4.vhdx` | The distro's disk. Grows on every write, never shrinks on its own. The gap between its size and the distro's `du` total is pure compaction yield. | Leak | Step 4 of the skill: `wsl --shutdown` then compact. | `wsl --manage <distro> --set-sparse true` |
| **Host:** `%LOCALAPPDATA%\Docker\wsl\disk\docker_data.vhdx` | Docker Desktop's disk, same rule. | Leak | Prune inside Docker first, then compact the same way. | A disk-size limit in Docker Desktop → Settings → Resources. |
| **Host:** `%USERPROFILE%\AppData\Local\Temp\swap.vhdx` | WSL's swap file, sized to a quarter of RAM by default and recreated on every boot. | Data | Cap it with `swap=2GB` in `%USERPROFILE%\.wslconfig`, then `wsl --shutdown`. | `.wslconfig` |
