globalThis.FairProofVerifierSimulator = (() => {
  function key(matchId, round) {
    return `${matchId}:${round}`;
  }

  function create() {
    const matches = new Map();
    const rounds = new Map();

    return {
      createMatch(input) {
        if (matches.has(input.matchId)) throw new Error("Match already exists");
        matches.set(input.matchId, {
          rulesetId: input.rulesetId,
          playerCommitment: input.playerCommitment,
          opponentCommitment: input.opponentCommitment,
          created: true
        });
      },
      submitMove(input) {
        if (!matches.has(input.matchId)) throw new Error("Unknown match");
        const roundKey = key(input.matchId, input.round);
        if (rounds.has(roundKey)) throw new Error("Round already submitted");
        rounds.set(roundKey, {
          playedCardId: input.playedCardId,
          proofHash: input.proofHash,
          accepted: null,
          recorded: false
        });
      },
      recordResult(input) {
        const round = rounds.get(key(input.matchId, input.round));
        if (!round) throw new Error("Move not found");
        if (round.recorded) throw new Error("Result already recorded");
        round.accepted = Boolean(input.accepted);
        round.recorded = true;
      },
      getMatchReceipt(matchId, round) {
        const match = matches.get(matchId);
        const move = rounds.get(key(matchId, round));
        if (!match || !move) return null;
        return {
          matchId,
          round,
          rulesetId: match.rulesetId,
          playedCardId: move.playedCardId,
          proofHash: move.proofHash,
          accepted: move.accepted,
          recorded: move.recorded
        };
      }
    };
  }

  return { create };
})();
