# Technical Architecture

## Components

`index.html`

Playable dashboard and demo surface.

`src/sdk/fairproof.js`

Browser SDK prototype. Handles match creation, card commitments, move verification, and receipt creation.

`src/app.js`

Demo application logic for the card battle game.

`docs/midnight-mapping.md`

Wave 2 plan for mapping local proof receipts and commitments to Midnight.

`src/sdk/midnight.js`

Dependency-free adapter that prepares `create_match`, `submit_move`, and `record_result` contract calls for a future Midnight wallet/provider layer.

`contracts/FairProofVerifier.interface.md`

Version-neutral contract interface specification covering public ledger state, entrypoints, and replay-protection invariants.

`tests/sdk.test.js`

Basic SDK smoke test for valid and invalid move verification.

## Flow

1. The SDK creates a shuffled game state.
2. Each player hand receives a private salt.
3. Each hand is committed with SHA-256.
4. The player selects one card.
5. The SDK verifies that the card exists in the committed private hand.
6. A public receipt is created.
7. The UI records the result in match history.

## Privacy Design

Public data includes commitments, the selected move, proof hash, ruleset, and validity result.

Private data includes the full hand, salt, unplayed cards, opponent hand, and future strategy.

## Midnight Plan

Wave 2 will replace local verification with Compact contract integration and a TypeScript SDK wrapper. The contract should store commitments and proof receipt hashes, not private game state.
