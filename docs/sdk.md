# FairProof SDK Notes

FairProof's Wave 1 SDK is a browser-first JavaScript prototype in `src/sdk/fairproof.js`. It models the privacy flow that will later be backed by Midnight verification.

## Project Layout

- `src/sdk/fairproof.js` - browser entrypoint and public API.
- `tests/sdk.test.js` - Node smoke and tamper-resistance tests.
- `examples/browser-sdk-example.html` - minimal browser integration.
- `docs/midnight-mapping.md` - planned Compact contract boundary.
- `src/sdk/contract-simulator.js` - local executable model of contract invariants.

The browser entrypoint intentionally has no framework dependency. A future package can wrap the same functions as an npm module without changing the demo contract.

## Core Concepts

`createMatch`

Creates private player states, salts, commitments, and a public match state.

`verifyMove`

Checks whether a submitted move is valid against a private hand and published commitment.

`createReceipt`

Creates a public receipt that can be shown in the match history or sent to a future on-chain verifier.

The receipt does not include the private hand or salt. The test suite covers forged cards, changed salts, changed commitments, and unsupported rulesets.

`createReplayGuard`

Tracks claimed `(matchId, round)` pairs and rejects a second claim for the same round. The local demo uses this guard before resolving a round; the Midnight contract must enforce the same invariant on-chain.

## Public vs Private

Public:

- Ruleset name
- Match ID
- Hand commitments
- Played card
- Validity result
- Proof hash

Private:

- Full hand
- Salt
- Unplayed cards
- Opponent strategy

## Wave 2 Midnight Mapping

The current `commitment`, `proofHash`, and `receipt` fields are the bridge to Midnight.

In Wave 2, the local verifier should be replaced by:

- A Compact contract that stores match commitments.
- A verifier entrypoint for proof receipts.
- A TypeScript wrapper that keeps the same `createMatch`, `verifyMove`, and `createReceipt` developer shape.
