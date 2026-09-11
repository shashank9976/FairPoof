# Wave 1 Progress Notes

## Completed

- Built a working card battle demo.
- Added multi-round gameplay and persistent scoring.
- Added used-card tracking.
- Added player and opponent hand commitments.
- Added valid proof generation.
- Added invalid proof rejection example.
- Added public proof receipts.
- Added match history.
- Created a browser SDK structure in `src/sdk/fairproof.js`.
- Added SDK notes and a standalone SDK example.
- Added basic SDK smoke tests.
- Added Midnight mapping documentation for Wave 2.

## Current Limitations

- Proof generation is simulated locally with commitment checks.
- The prototype does not yet include real Compact contracts.
- No Midnight wallet/provider integration has been added yet.
- The demo supports one ruleset: `card-battle-v1`.

## What Changed During Wave 1

The project moved from a concept into a usable local prototype with a playable game, an SDK-style API, proof receipts, invalid proof handling, and a clear path toward Midnight selective disclosure.
