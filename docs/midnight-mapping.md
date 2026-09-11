# Midnight Preparation

FairProof Wave 1 uses local browser verification to demonstrate the product flow. Wave 2 should move the trust-critical parts to Midnight while keeping the same developer API shape.

## Current Local Flow

1. `createMatch` creates private player state.
2. Each player receives a salt and private hand.
3. The SDK publishes a hand commitment.
4. `verifyMove` checks that a submitted card exists in the committed private hand.
5. `createReceipt` produces a public proof receipt.

## Selective Disclosure Mapping

Public on Midnight:

- Match ID
- Ruleset ID
- Player commitment
- Opponent commitment
- Played card
- Proof receipt hash
- Validity result

Private off-chain or shielded:

- Full player hand
- Salt
- Unplayed cards
- Opponent hand
- Future strategy

## Compact Contract Shape

The Wave 2 Compact contract should support:

- `create_match(match_id, ruleset_id, player_commitment, opponent_commitment)`
- `submit_move(match_id, round, played_card, proof_hash)`
- `record_result(match_id, round, accepted)`
- `get_match_receipt(match_id, round)`

The contract should not store full hands, salts, or strategy data.

The complete Wave 2 interface is specified in `contracts/FairProofVerifier.interface.md`. It defines the ledger state, public entrypoints, replay rules, and the compile gate for converting the design into version-pinned Compact source. The compiler reference is recorded in `contracts/toolchain.json`.

## TypeScript SDK Shape

The browser prototype already models the intended SDK surface:

- `FairProof.createMatch`
- `FairProof.verifyMove`
- `FairProof.createReceipt`

In Wave 2, these should become TypeScript functions that call Midnight wallet/provider APIs and submit commitments or receipt hashes to the Compact contract.

## Adapter Boundary

`src/sdk/midnight.js` is a dependency-free preparation adapter. It converts FairProof values into deterministic contract-call payloads, but does not connect to a wallet or submit a transaction yet.

```js
const call = FairProofMidnight.prepareSubmitMove({
  matchId,
  round: 1,
  playedCardId: proof.publicMove.id,
  proofHash: proof.proofHash
});
```

The future wallet/provider layer should receive this object and handle signing, network selection, and transaction submission.

## Contract Inputs

| Entrypoint | Public inputs | Private witness | Result |
| --- | --- | --- | --- |
| `create_match` | Match ID, ruleset, both commitments | None at contract boundary | Match commitments stored |
| `submit_move` | Round, played card ID, proof hash | Hand and salt supplied to the privacy proof | Move receipt registered |
| `record_result` | Round, accepted flag | None | Public outcome recorded |

Replay protection must be enforced in the contract by rejecting an already-used `(match_id, round)` pair. The local Wave 1 demo remains a simulation until this contract is deployed.

## Why Midnight Fits

FairProof needs public verifiability without full transparency. Midnight's privacy-first model is a strong fit because the game can disclose only the facts needed for fairness while keeping hidden state private.
