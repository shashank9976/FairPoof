# FairProofVerifier Contract Interface

This is the Wave 2 contract boundary. It is intentionally an interface specification, not deployable Compact source. The intended compiler reference is pinned in `contracts/toolchain.json`; generated TypeScript bindings must be produced before implementation.

## Ledger State

The contract should retain only public verification state:

```text
matches: matchId -> {
  rulesetId,
  playerCommitment,
  opponentCommitment,
  created
}

rounds: (matchId, round) -> {
  playedCardId,
  proofHash,
  accepted,
  recorded
}
```

It must never store a full hand, salt, unplayed cards, or strategy data.

## Public Entrypoints

```text
create_match(matchId, rulesetId, playerCommitment, opponentCommitment)
submit_move(matchId, round, playedCardId, proofHash)
record_result(matchId, round, accepted)
get_match_receipt(matchId, round)
```

## Invariants

1. `matchId` cannot be created twice.
2. A move cannot be submitted for an unknown match.
3. `(matchId, round)` can be submitted only once.
4. A result can be recorded only for an existing move.
5. A result cannot be overwritten.
6. The contract stores hashes and selected public fields only.

## SDK Handoff

`src/sdk/midnight.js` prepares the first three entrypoint payloads. The future generated TypeScript binding should replace the adapter's generic payload objects while preserving the FairProof developer-facing API.

## Compile Gate

Before converting this interface to `.compact` source:

- Pin the Compact compiler version.
- Confirm current ledger declaration and kernel operation syntax.
- Add a local contract test for every invariant above.
- Generate TypeScript bindings and connect them behind the adapter.
- Run the contract against a local Midnight network before testnet submission.
