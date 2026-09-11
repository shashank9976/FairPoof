globalThis.FairProofMidnight = (() => {
  const CONTRACT_NAME = "FairProofVerifier";

  function requireField(input, field) {
    if (input[field] === undefined || input[field] === null || input[field] === "") {
      throw new TypeError(`Missing required field: ${field}`);
    }
    return input[field];
  }

  function prepareCreateMatch(input) {
    return {
      contract: CONTRACT_NAME,
      entrypoint: "create_match",
      args: {
        matchId: requireField(input, "matchId"),
        rulesetId: requireField(input, "rulesetId"),
        playerCommitment: requireField(input, "playerCommitment"),
        opponentCommitment: requireField(input, "opponentCommitment")
      }
    };
  }

  function prepareSubmitMove(input) {
    return {
      contract: CONTRACT_NAME,
      entrypoint: "submit_move",
      args: {
        matchId: requireField(input, "matchId"),
        round: requireField(input, "round"),
        playedCardId: requireField(input, "playedCardId"),
        proofHash: requireField(input, "proofHash")
      }
    };
  }

  function prepareRecordResult(input) {
    return {
      contract: CONTRACT_NAME,
      entrypoint: "record_result",
      args: {
        matchId: requireField(input, "matchId"),
        round: requireField(input, "round"),
        accepted: Boolean(requireField(input, "accepted"))
      }
    };
  }

  return { prepareCreateMatch, prepareSubmitMove, prepareRecordResult };
})();
