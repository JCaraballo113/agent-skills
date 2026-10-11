#!/bin/bash
# Publishes proof images (scripts/shot.mjs screenshots, frames from a render)
# to the `proof` branch, which is never merged, under <folder>/, and prints
# the Markdown that shows each in a PR or comment. Readers need access to the
# repo, as for the PR itself. Git only, so it works where gh can't.
#
#   scripts/proof.sh <folder, e.g. the branch name> <file.png> [<file.png> ...]
set -euo pipefail

folder="${1:?folder}"
shift
[ "$#" -gt 0 ] || { echo "Give at least one file." >&2; exit 2; }
folder="${folder//\//-}"
repo="$(git remote get-url origin | sed -E 's#^(https://[^/]+/|git@[^:]+:)##; s#\.git$##')"
work="$(mktemp -d)"
trap 'git worktree remove --force "$work" >/dev/null 2>&1 || rm -rf "$work"' EXIT

if git ls-remote --exit-code --heads origin proof >/dev/null 2>&1; then
  git fetch -q origin proof
  git worktree add -q --detach "$work" FETCH_HEAD
else
  git worktree add -q --detach "$work"
  git -C "$work" checkout -q --orphan "proof-$$"
  git -C "$work" rm -rfq . >/dev/null 2>&1 || true
  git -C "$work" clean -fdxq
fi

mkdir -p "$work/$folder"
for file in "$@"; do
  cp "$file" "$work/$folder/"
done
git -C "$work" add "$folder"
git -C "$work" commit -qm "Proof: $folder"
for attempt in 1 2 3; do
  if git -C "$work" push -q origin HEAD:refs/heads/proof; then
    break
  fi
  [ "$attempt" = 3 ] && { echo "Couldn't push to the proof branch." >&2; exit 1; }
  git -C "$work" fetch -q origin proof
  git -C "$work" rebase -q FETCH_HEAD
done

for file in "$@"; do
  name="$(basename "$file")"
  echo "![${name%.*}](https://github.com/$repo/blob/proof/$folder/$name?raw=true)"
done
