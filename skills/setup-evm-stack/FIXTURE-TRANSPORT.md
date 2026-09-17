# Fixture transport

The DOM test tier for a wagmi app: components render against a viem
`custom` transport that answers from fixtures, records every wire request,
and fails the test on any request it was not given. The hooks stay real:
the component's own reads and writes go over the wire, and the fixture
decides what the chain says. Build it from viem's `custom`
transport and wagmi's `createConnector`, checked against their current
docs.

## Two seams

- **The fixture transport** — `createChainFixture({ [chainId]: {...} })`
  returns `transport(chainId)` for the wagmi config plus the recordings.
  Per chain it answers `eth_chainId`, `eth_call` (a multicall3
  `aggregate3` is unpacked and each inner call answered, a fixtured error
  becoming that call's failed return), `eth_sendTransaction`,
  `eth_getTransactionReceipt`, `eth_getTransactionByHash`, `eth_getCode`
  and `eth_getBlockByNumber`. Anything else, any unknown chain, any call to
  an unfixtured address / selector / argument set is recorded as
  **unexpected** and thrown.
- **The wallet connector** — a wagmi `createConnector` holding the wallet
  state (`address`, `chainId`, optional `code` at the address, `codeFails`,
  `refusesSwitch`): answers accounts and chain id itself, forwards every
  other request to the fixture on its current chain, records a
  `wallet_switchEthereumChain` and either refuses (a
  `UserRejectedRequestError`) or moves. No real wallet, no auth session.

## Fixture shapes

- **Read**: `{ address, abi, functionName, args? }` plus one of `result`,
  `results` (answered in sequence, the last repeated — a value that
  changes between polls) or `error` (a revert with that message). Omitted
  `args` match any arguments.
- **Write**: the same call plus `hash`, `result` (the simulation answer,
  required when the function returns something), `receipt` (`status`,
  `reason`, `logs` as RPC logs — build them with `encodeEventTopics` /
  `encodeAbiParameters` so the component decodes real events) and
  `rejected` (the wallet refuses to sign). Simulation of a sent write
  whose receipt reverted fails with its reason.
- **Code**: `{ [address]: hex | { error } }` — a contract wallet, an
  EIP-7702 designator, a failed code read.
- **Block**: `{ number?, timestamp?, unreadable? }` — the reference clock
  and `sentAt` come from here, never from `Date.now()`.

Recordings: `requests` (chain, method, params), `calls` (decoded reads),
`transactions` (decoded sends with `from`), `unexpected`. Tests assert on
these to prove a call was encoded as decided — the gas cap read at quote
time, the value sent to the wei — and that a read was **not** made.

## Render and setup

`renderWithWallet(ui, { fixture, wallet })` builds a wagmi config with one
transport per configured chain and the fixture connector, connects it, and
renders under `WagmiProvider` + a fresh `QueryClient` (`retry: false`). The
`dom` Vitest project (jsdom, `.test.tsx`; `.test.ts` stays on node) has a
setup file with jest-dom, cleanup, and an `afterEach` that throws when any
mounted fixture recorded an unexpected request — so a component that reads
something nobody decided fails the test that rendered it.

## Values

Fixture values are **deliberately inconsistent with any default** — a rate
of 1.01 where 1:1 would pass by accident, a gas cap of 250 000 where the
live value is 200 000 — so only the decided source of a value can pass.
Per-project fixture modules compose each screen's base read set from small
exported helpers (`valuationReads()`, `sharesRead(network)`,
`quoteRead(network, fees)`), plus a `failingReads(reads)` variant for the
read-failed states. Each screen names the helpers it needs, so a test
inherits only what it asked for.
