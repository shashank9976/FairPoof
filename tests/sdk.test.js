const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const fs = require("node:fs");
const vm = require("node:vm");

const context = {
  crypto: webcrypto,
  TextEncoder,
  console
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("src/sdk/fairproof.js", "utf8"), context);
vm.runInContext(fs.readFileSync("src/sdk/midnight.js", "utf8"), context);
vm.runInContext(fs.readFileSync("src/sdk/contract-simulator.js", "utf8"), context);

async function run() {
  const deck = context.FairProof.createDeck();
  const playerHand = deck.slice(0, 5);
  const opponentHand = deck.slice(5, 10);
  const match = await context.FairProof.createMatch({ playerHand, opponentHand });

  const validProof = await context.FairProof.verifyMove({
    ruleset: match.ruleset,
    privateHand: match.player.privateHand,
    salt: match.player.salt,
    commitment: match.player.commitment,
    move: { card: playerHand[0] }
  });

  const invalidProof = await context.FairProof.verifyMove({
    ruleset: match.ruleset,
    privateHand: match.player.privateHand,
    salt: match.player.salt,
    commitment: match.player.commitment,
    move: { card: deck[20] }
  });

  const tamperedSaltProof = await context.FairProof.verifyMove({
    ruleset: match.ruleset,
    privateHand: match.player.privateHand,
    salt: `${match.player.salt}tampered`,
    commitment: match.player.commitment,
    move: { card: playerHand[0] }
  });

  const tamperedCommitmentProof = await context.FairProof.verifyMove({
    ruleset: match.ruleset,
    privateHand: match.player.privateHand,
    salt: match.player.salt,
    commitment: `${match.player.commitment.slice(0, -1)}0`,
    move: { card: playerHand[0] }
  });

  const unsupportedRulesetProof = await context.FairProof.verifyMove({
    ruleset: "unknown-ruleset",
    privateHand: match.player.privateHand,
    salt: match.player.salt,
    commitment: match.player.commitment,
    move: { card: playerHand[0] }
  });

  const receipt = await context.FairProof.createReceipt({
    proof: validProof,
    round: 1,
    matchId: match.id
  });

  assert.equal(validProof.valid, true);
  assert.equal(invalidProof.valid, false);
  assert.equal(tamperedSaltProof.valid, false);
  assert.equal(tamperedCommitmentProof.valid, false);
  assert.equal(unsupportedRulesetProof.valid, false);
  assert.equal(receipt.accepted, true);
  assert.deepEqual(Object.keys(receipt).sort(), ["accepted", "createdAt", "disclosure", "matchId", "proofHash", "publicMove", "round"]);
  assert.equal(Object.hasOwn(receipt, "salt"), false);
  assert.equal(Object.hasOwn(receipt, "privateHand"), false);

  const moveCall = context.FairProofMidnight.prepareSubmitMove({
    matchId: match.id,
    round: 1,
    playedCardId: validProof.publicMove.id,
    proofHash: validProof.proofHash
  });

  assert.equal(moveCall.contract, "FairProofVerifier");
  assert.equal(moveCall.entrypoint, "submit_move");
  assert.equal(moveCall.args.playedCardId, playerHand[0].id);
  assert.throws(() => context.FairProofMidnight.prepareSubmitMove({ matchId: match.id }), /Missing required field: round/);

  const replayGuard = context.FairProof.createReplayGuard();
  assert.equal(replayGuard.claim(match.id, 1), true);
  assert.equal(replayGuard.claim(match.id, 1), false);
  assert.equal(replayGuard.has(match.id, 1), true);
  assert.equal(replayGuard.claim(match.id, 2), true);

  const verifier = context.FairProofVerifierSimulator.create();
  verifier.createMatch({
    matchId: match.id,
    rulesetId: match.ruleset,
    playerCommitment: match.player.commitment,
    opponentCommitment: match.opponent.commitment
  });
  verifier.submitMove({ matchId: match.id, round: 1, playedCardId: playerHand[0].id, proofHash: validProof.proofHash });
  assert.throws(() => verifier.submitMove({ matchId: match.id, round: 1, playedCardId: playerHand[0].id, proofHash: validProof.proofHash }), /Round already submitted/);
  verifier.recordResult({ matchId: match.id, round: 1, accepted: true });
  assert.throws(() => verifier.recordResult({ matchId: match.id, round: 1, accepted: false }), /Result already recorded/);
  assert.equal(verifier.getMatchReceipt(match.id, 1).accepted, true);
  assert.equal(match.publicState.playerHandSize, 5);
  assert.equal(match.publicState.opponentHandSize, 5);
}

run()
  .then(() => console.log("FairProof SDK tests passed"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
