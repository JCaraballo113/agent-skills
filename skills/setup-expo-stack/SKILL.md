---
name: setup-expo-stack
description: The Expo/React Native mobile stack module for setup-tooling — Expo (latest SDK) + Expo Router, NativeWind v5 + Tailwind v4, TanStack Query, Zod, Zustand when needed, react-native-reanimated for motion, jest-expo + @testing-library/react-native for tests, tsc typecheck and lefthook commit gates, EAS for build/update/CI/submit, all on pnpm with the 1-day package-age guard. Backend decided per project (Supabase client SDK or a shared API + Drizzle). Use when the user says "setup expo", "setup the mobile stack", "bootstrap an expo app", "scaffold a react native app", or bootstraps a fresh Expo repo — usually composed by setup-tooling.
---

# Setup Expo Stack

The Expo/React Native instantiation of the preferred stack — mobile's
answer to `setup-js-stack`. Intent answers (backend,
existing code, web+mobile monorepo) normally arrive from
the `setup-tooling` skill; invoked standalone, ask them first —
never scaffold before the interview, never re-scaffold over existing code.

The **Expo skills bundle is the knowledge layer** this module defers to —
the mobile equivalent of what `impeccable` is to design: `expo-router`,
`expo-project-structure`, `expo-tailwind-setup`, `expo-data-fetching`,
`expo-dev-client`, and the `eas-*` skills. Gate on it — these count as
installed when they appear in the available-skills list in any scope,
possibly namespaced (e.g. `expo:expo-router`). If missing, prompt the user
with the install command from [skill.deps.json](./skill.deps.json) (the
Claude Code plugin, or `npx skills add expo/skills` for other agents).
Don't reteach what those skills own — point at them.

## The stack matrix

| Concern | Mobile app | + API routes / backend |
| --- | --- | --- |
| Framework | Expo + Expo Router (file-based, `src/app` routes-only) | same |
| Language | TypeScript (`expo/tsconfig.base`) | same |
| Styling | NativeWind v5 + Tailwind v4 (`expo-tailwind-setup`) | — |
| Data fetching | TanStack Query (`expo-data-fetching`) | — |
| Client state | Zustand (only if needed) | — |
| Validation | Zod (single source of truth, shared client/server) | Zod |
| Motion | react-native-reanimated (+ gesture-handler), when the UI animates | — |
| Backend/DB | decide per project | API routes or external API + Drizzle — see Backend |
| Design | `design-tooling` | — |
| Tests | jest-expo + @testing-library/react-native, colocated | jest-expo |
| Lint | `lint-guardrails` on `eslint-config-expo/flat` | same |
| Build / Update / CI / Submit | EAS (`eas-workflows`, `eas-app-stores`) | same |

Scaffolders (verify current flags against the tool's docs before running):

```bash
pnpm create expo-app@latest            # Expo Router + TypeScript template
pnpm expo install jest-expo jest @types/jest @testing-library/react-native --dev
npx expo lint                          # generates eslint.config.js on eslint-config-expo/flat
```

Use `pnpm expo install` (not bare `pnpm add`) for any package with a native
side — it pins the version matched to the project's Expo SDK.

## pnpm baseline

Same pnpm baseline as `setup-js-stack` (packageManager
pinned via corepack, `minimumReleaseAge: 1440`, the standard scripts). Expo
deltas only:

- `.npmrc` with `node-linker=hoisted` — React Native's native-module
  resolution expects a hoisted layout; verify against current Expo pnpm
  guidance for the SDK in use.
- Scripts: `start` (`expo start`), `ios` / `android` / `web`, `test`
  (`jest`), `lint` (`eslint --max-warnings 0`), `typecheck`
  (`tsc --noEmit`), `prepare` (`lefthook install`).

## Structure — defer to `expo-project-structure`

The layout lives there: `src/app` routes-only, screen bodies in `screens/`,
kebab-case components, server code in `app/api` + `src/server` (new projects
only). Styling and data-fetching mechanics likewise live in their matrix
skills — defer, don't hand-roll.

## Testing — jest-expo, colocated

jest-expo (`preset: "jest-expo"`) with @testing-library/react-native;
`react-test-renderer` is deprecated on React 19, don't add it.
`agent-rules` generates the testing instruction against jest-expo —
it owns the layout (Expo colocation) and the happy/negative-path grouping.

Vitest is deliberately excluded: it can't transform React Native's
untranspiled source or resolve Metro's platform files, so RN component
rendering fails under it — jest-expo is Expo's supported path.

## Backend — decided per project

Mobile has no in-app Postgres; the interview picks the shape:

- **Supabase client SDK** (`@supabase/supabase-js`) directly in the app —
  simplest for mobile-only.
- **Shared API** — Expo API routes (deployed on EAS Hosting) or an external
  Hono/TanStack backend owning Drizzle + Supabase Postgres, matching the web
  stack. Best for a web+mobile monorepo; the DB portion then follows
  `setup-js-stack` and its same-commit migration rule.

## Commit gate + CI

lefthook commit gate as in `setup-js-stack` (pre-commit
lint on staged files, pre-push typecheck + tests). CI and release run on
**EAS** — EAS Workflows for lint/typecheck/test + build (`eas-workflows`),
EAS Update for OTA JS updates, EAS Submit for store releases
(`eas-app-stores`). A plain GitHub Actions workflow calling the `eas` CLI is
the fallback when the project isn't on EAS Workflows.

Native builds run in the cloud on EAS Build — no local Xcode/Android Studio
required to ship; install them only for local `expo run:ios` /
`run:android`. `expo-dev-client` when the app needs custom native modules;
`eas-simulator` for shareable simulator builds.

If a dep in [skill.deps.json](./skill.deps.json) is missing (the Expo
skills, pnpm), prompt the user with its install command first.
