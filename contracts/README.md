# FairProof Contract Workspace

The contract interface is defined in `FairProofVerifier.interface.md` and the intended compiler reference is pinned in `toolchain.json`.

The Compact compiler is not installed in the current workspace, so deployable `.compact` source is intentionally not checked in yet. The interface must be converted against the pinned compiler and then compiled before any network deployment.

`src/sdk/contract-simulator.js` provides an executable local model of the contract invariants while the Compact toolchain is unavailable. It is used by the SDK test suite and must be replaced by generated Compact bindings for a real deployment.

## Compile Gate

After installing the official Compact `0.10.1` toolchain, the expected command is:

```text
compactc FairProofVerifier.compact
```

The compile step must generate TypeScript bindings and pass the invariant tests in `FairProofVerifier.interface.md` before the adapter is connected to a wallet or network.
