# FairProof SDK - Wave 1 Prototype

FairProof is a privacy-preserving rule verification SDK concept for competitive games.

Wave 1 focuses on a working local demo:

- A small card battle game with hidden player hands.
- A lightweight SDK-style verifier in `src/sdk/fairproof.js`.
- Private hand commitments using browser SHA-256 hashing.
- Public proof receipts that show a move was valid without revealing the full hand.
- A disclosure panel showing what is public and what remains private.
- Multi-round scoring with used-card tracking.
- Match history for resolved rounds.
- A deliberate invalid-proof example to show rejected moves.

## Open the Demo

Open `index.html` in a browser.

No install step is required for Wave 1.

SDK notes are in `docs/sdk.md`.

Midnight mapping notes are in `docs/midnight-mapping.md`.

The Wave 2 contract interface is in `contracts/FairProofVerifier.interface.md`. It is a specification until a Compact compiler version is pinned.

Submission drafts are in `submission/`.

A standalone browser SDK example is available at `examples/browser-sdk-example.html`.

Run the SDK smoke test with:

```sh
node tests/sdk.test.js
```

## Wave 1 Scope

This prototype does not implement production zero-knowledge proofs yet. It models the product flow that will later map to Midnight:

1. Player privately holds cards and a salt.
2. Player publishes a commitment to their hand.
3. Player submits a move.
4. FairProof verifies the move against the private state locally.
5. The demo emits a public receipt containing only selected information.

## Next Waves

Wave 2 should replace the local verifier simulation with Midnight Compact contracts and a TypeScript SDK wrapper.

Wave 3 should add reusable developer docs, match audit views, multiple rulesets, and a polished showcase demo.
