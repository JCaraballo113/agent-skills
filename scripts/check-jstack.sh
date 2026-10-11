#!/usr/bin/env bash
# Fails when a skill or agent still carries a Cursor-only term from the pstack port.
# docs/jstack-port.md maps each term to its Claude Code replacement.
set -euo pipefail
cd "$(dirname "$0")/.."

banned=(
  'AskQuestion'
  '~/\.cursor|\.cursor/'
  'grok-[0-9]'
  'pstack-models|setup-pstack|poteto-mode|poteto-agent|/poteto-help'
  'principle skill|\*\*principle-|principle-[a-z-]+ skill'
  'Origin (CLI|forge|API|landing)|through Origin'
  'cursor-team-kit'
  'generalPurpose'
  'readonly: (true|false)|readonly/Ask mode'
  'environment: "?(cloud|local)'
  '\bTask\b (tool|call|subagent)|`Task`'
  'agent-transcripts'
  'Comment Sicko"'
  'is_background'
  '^mode: true|^reminder:'
  '\bCursor\b'
)

status=0
for pattern in "${banned[@]}"; do
  if hits=$(grep -rnIE --exclude-dir=node_modules "${pattern}" skills agents | grep -vE 'AskUserQuestion' ); then
    if [ -n "$hits" ]; then
      echo "Cursor-only term /${pattern}/ (see docs/jstack-port.md):"
      echo "$hits" | sed 's/^/  /'
      status=1
    fi
  fi
done
exit $status
