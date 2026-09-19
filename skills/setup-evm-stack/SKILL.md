---
name: setup-evm-stack
description: The EVM layer module for setup-tooling — wagmi + viem on TanStack Query, a wallet layer chosen per project, vendored ABIs and address provenance under src/lib/web3/, an anvil fork trial (fork / seed / dev / smoke / unstick + a runbook section) and a fixture-transport DOM test tier. Use when a web project reads and writes on-chain contracts, when the user says "set up the web3 stack", or via setup-tooling.
---

# Setup EVM Stack

The on-chain layer over `setup-js-stack`: a frontend
that reads and writes deployed EVM contracts through the user's wallet.
Intent answers normally arrive from `setup-tooling`;
invoked standalone, ask them first — never scaffold before the interview,
and never re-scaffold over existing code. Verify every API shape below
against the current wagmi and viem docs before writing it.

## Detail questions (this module's own)

1. **Wallet layer** — Privy (external wallets only), RainbowKit, ConnectKit,
   or injected-only. Each ships a wagmi connector; the app never holds
   keys.
2. **Networks** — which chains, with their live chain ids. One build
   serves every listed network; the wallet's chain id becomes a network
   exactly once, at the gate.
3. **Contract source of truth** — the address book (a deployments repo,
   a JSON file, an explorer page). Addresses are copied from it, never
   re-derived, and each is verified against the live chain with `cast`
   before it lands.
4. **Contracts deployed yet?** — a deployment is what the fork trial and
   the smoke run against. Without one, land the layout and the test tier
   now, and add those two the day an address exists.

If foundry (`anvil`, `cast`) is missing, prompt the user with its install
command from [skill.deps.json](./skill.deps.json).

## Compose

1. **Dependencies and layout.** `wagmi`, `viem`, `@tanstack/react-query`,
   the wallet layer. `src/lib/web3/`:
   - `networks.ts` — one entry per network: its viem chain (live, or the
     anvil fork when its RPC URL is local — see FORK-TRIAL.md), RPC URL,
     explorer links, address block. Shared addresses in one union;
     network-only addresses on that member alone, so a render on the
     wrong network cannot reach them without narrowing.
   - `abis/` — vendored, one file per contract, a provenance header each
     and a `README.md` table (file → contract → source). Re-copy from the
     source; never hand-edit.
   - `errors.ts` — revert selectors mapped to client copy, selectors
     pinned by a test with their `cast sig` provenance in the README.
   - `README.md` — contract wiring, invariants and address provenance:
     the home of every explanation lint keeps out of code.
2. **Fork trial** — the `fork` script family, the app's local-URL fork
   detection and the runbook section, per [FORK-TRIAL.md](./FORK-TRIAL.md).
3. **Test tier** — the fixture transport and wallet connector seams, the
   `dom` Vitest project and its render helper, per
   [FIXTURE-TRANSPORT.md](./FIXTURE-TRANSPORT.md).
4. **Lint exemptions** in the config `lint-guardrails`
   writes: `src/lib/web3/abis/**` keeps its size, magic numbers and
   provenance comments; `scripts/**` keeps size, params, complexity,
   magic numbers and console. Shell scripts stay unlinted — their header
   comments carry the method.
5. **Round trips.** Chain reads batch through a multicall contract **per
   chain**: reads on one chain go through it, reads on two chains never
   share one, and the node methods (`eth_getTransactionReceipt`,
   `eth_getBlockByNumber`, `eth_getCode`) are not `eth_call`s and join no
   batch at all. Reads that cannot batch but depend on nothing are issued
   together instead, and each flow's round-trip count lives in the
   `README.md` beside it — the `round-trips` rule
   (`agent-rules`) is the general form.
6. **Hard constraints**, one sentence each, into the agent docs and the
   instructions `agent-rules` writes: no success state
   before an on-chain receipt; amounts parsed at the boundary, never
   trusted for shape; missing price or USD data renders as "—", never
   `$0.00`, and never disables token-denominated actions; the app never
   holds keys or funds; client-side gating is presentational, the
   contracts enforce. The testing rule's negative path names the on-chain
   refusals — wrong network, not-whitelisted, paused, user-rejected,
   reverted, failed RPC read — and the two test seams.

## Done when

`src/lib/web3/` holds the networks, the vendored ABIs with their
provenance table, and the revert selectors a test pins; the guardrails
config carries the exemptions; a component renders through the fixture
transport in the `dom` project; every flow that reads the chain states its
round-trip count; and every hard constraint reads back in the agent
docs. Against deployed contracts, `fork:smoke` has also run
green and its output is in the report, and the runbook section walks a
human through the trial end to end — report those two as waiting when
there is no address yet.
