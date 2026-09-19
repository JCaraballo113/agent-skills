---
name: setup-tooling
description: Bootstrap a project with my preferred tooling. Drives an intent interview first, then composes the matching modules — a per-platform stack (JS/TS web via setup-js-stack, Expo/React Native mobile via setup-expo-stack), lint-guardrails, setup-evm-stack for on-chain web projects, design-tooling, and agent-rules. Use when the user says "setup tooling" or "bootstrap this project", sets up a mobile/expo app, or starts a fresh repo.
---

# Setup Tooling

Orchestrator: encodes my tastes into a project. **Drive intent first** —
the interview decides which modules apply; never install anything
before it.

## 1. Drive intent

Ask up front (AskUserQuestion works well); don't guess:

1. **Ecosystem** — JS/TS is the only ecosystem with stack modules today.
   For anything else, say so, apply only the ecosystem-agnostic modules
   below, and offer to draft a `setup-<lang>-stack` module as a follow-up.
2. **Platform** — web, mobile (Expo/React Native), or both. Web →
   `setup-js-stack`; mobile → `setup-expo-stack`; both → compose the two
   (a web+mobile monorepo).
3. **Project type** — for web: full-stack app, SPA, backend/API, library,
   CLI; for mobile: an Expo app (± API routes/backend). The stack module
   maps type → scaffold.
4. **Frontend?** — decides design tooling and which **design tool**
   (Pencil or Figma). Mobile apps always have one.
5. **Database?** — decides the DB portion of the stack module (on mobile,
   the backend-per-project decision).
6. **On-chain contracts?** — a web frontend that reads and writes EVM
   contracts through the user's wallet takes `setup-evm-stack` as a layer
   over the web stack.
7. **Existing code?** — never re-scaffold over existing work; layer the
   missing pieces instead.

## 2. Compose modules

In order, skipping what intent ruled out:

1. The stack module for the platform — `setup-js-stack`
   (web) and/or `setup-expo-stack` (mobile); both for a
   web+mobile monorepo. Framework, package-manager baseline, database, CI.
   JS/TS only.
2. `lint-guardrails` — every project, any ecosystem.
3. `setup-evm-stack` — on-chain web projects only; it
   adds exemptions to the guardrails config, so it lands on top of one.
4. `design-tooling` — frontend projects only, with the
   design tool from intent.
5. `agent-rules` — every project.
6. If `setup-matt-pocock-skills` appears in the available-skills list
   (any scope, possibly namespaced), invoke it to layer the
   agent-workflow conventions (issue tracker, triage labels, domain
   docs) on top of the fresh tooling. If not, skip silently — don't
   hunt for it.

## 3. Report

Summarize what landed — scaffold, scripts, rule files, hooks, CI,
design files — and what was skipped and why.
