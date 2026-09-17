# Fork trial

Every flow is trialed against a local anvil fork before it touches the
live network: the live RPC is only anvil's upstream, no real funds move,
and the deployed bytecode answers what no unit test can — ABI variants,
role wiring, enum orderings, revert selectors. Run by a human from the
runbook; the scripts are theirs, the method is this file.

## The anvil

One anvil per network. `--fork-url <live RPC>`, a **fork chain id** that
is not the live one (anvil's 31337, then 31338…) so the app and the wallet
both know they are on a fork, port `2049 + liveChainId % 63486`
(Ethereum → 2050) so a fork started by any repo on the machine is
interchangeable, `--auto-impersonate`, `--block-time 1`,
`--prune-history`. Fork only from a live upstream RPC. The app detects a
fork by URL: a local (`127.0.0.1` / `localhost`) RPC URL for a network
swaps that network's viem chain for its anvil definition (fork id, local
URL, `multicall3` declared) and keeps the live explorer links. Wallet
setup uses the fork chain id and the local URL.

## The script family

`package.json` scripts, `bash scripts/fork*.sh`, env through the
project's secrets runner (Doppler, dotenv):

- `fork` — the anvil(s). `FORK_RPC_URL` overrides the upstream, `FORK_PORT`
  the port. Multi-network: `FORK_SIDES=<network>` keeps one side live.
- `fork:seed [wallet] [whale]` — gas, tokens and access for a wallet
  (default: anvil account #0), by the **seed ladder** below.
- `fork:dev` — `concurrently`: the fork, a wait-for-chain-id, the seed,
  then the app with each forked network's local URL in its env.
  `dev:fork` is the app alone against a fork already running.
- `fork:smoke` — the **smoke** below.
- `fork:unstick` — clears a wallet's queued-nonce transactions
  (`txpool_content` shows them; `anvil_removePoolTransactions`, or
  `anvil_dropAllTransactions` with `--all`; `--nonce` realigns) and can
  zero an allowance so a two-step flow re-arms.

Every script checks the chain id it is aimed at (live or fork) and exits
with the start command otherwise.

## The seed ladder

Fork-only state, applied in order, each rung falling through to the next
under `set -e` (`|| return 1` inside functions):

1. **Gas**: `anvil_setBalance`. **Code**: anvil's default accounts carry
   a mainnet EIP-7702 delegation that breaks ERC-721 receipt — `cast
   codesize` ≠ 0 → `anvil_setCode <wallet> 0x`.
2. **Tokens**: impersonate whoever can mint (a `supplyController()`, a
   MINTER role holder) and mint-then-transfer; else transfer from a
   holder, idle or deprecated holders first so a live exchange rate is
   not moved; else probe the balances slot with `anvil_setStorageAt`
   until `balanceOf` reads the amount (a proxy hides the slot). A whale
   argument skips to the transfer rung.
3. **Access**: read the authority off the gated contract, its owner off
   the authority, impersonate the owner, grant. The role id comes from
   the app's own constant (grep it) so the seed and the gate agree; warn
   when the chain's authority differs from the app's.

Print each rung that fired and the final balances, so the runbook can
name the lines to look for.

## The smoke

`cast` replays the exact calls the app encodes — approve, deposit,
submit, cancel, bridge — from the seeded wallet, and asserts what only
bytecode can answer: the deployed selector is dispatched, the event fires,
the enum value after each step, each named revert (`cast sig` the error,
match the selector, not a string). Exit non-zero on the first failed
assertion with its name. **Run it before the ticket closes and paste the
output into the report**; a smoke that has never run against the fork
proves nothing. Prove only what the fork produces itself — a cross-chain
delivery or an oracle answer is planted state: the fork proves the source
side, the live lane proves the rest.

## The runbook section

`docs/runbook.md` gains one section per trial, copy-paste from the repo
root: prerequisites (foundry, secrets), one-time wallet setup (anvil
account #0's key with the local-only warning, the fork network entry),
the one command, the seed lines to confirm before opening the browser,
the browser trial step by step, the contract-level verify (`fork:smoke`
and its expected output), troubleshooting (a wallet's cached nonce after a
restart, a chain-id mismatch, a busy port and the fork that may already
own it, the seed fallback), and the à-la-carte scripts and env overrides.
