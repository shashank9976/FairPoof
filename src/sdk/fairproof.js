globalThis.FairProof = (() => {
const encoder = new TextEncoder();

async function sha256Hex(value) {
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createDeck() {
  const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
  const ranks = [
    ["A", 14],
    ["K", 13],
    ["Q", 12],
    ["J", 11],
    ["10", 10],
    ["9", 9],
    ["8", 8],
    ["7", 7],
    ["6", 6],
    ["5", 5],
    ["4", 4],
    ["3", 3],
    ["2", 2]
  ];

  return suits.flatMap((suit) =>
    ranks.map(([rank, power]) => ({
      id: `${rank}-${suit}`,
      rank,
      suit,
      power
    }))
  );
}

function shuffle(cards) {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function commitHand(hand, salt) {
  const canonicalHand = hand.map((card) => card.id).sort().join("|");
  return sha256Hex(`${canonicalHand}:${salt}`);
}

function toPublicCard(card) {
  return {
    id: card.id,
    rank: card.rank,
    suit: card.suit,
    power: card.power
  };
}

async function createPlayerState(hand) {
  const salt = createSalt();
  const commitment = await commitHand(hand, salt);

  return {
    privateHand: hand,
    salt,
    commitment,
    publicHandSize: hand.length
  };
}

async function createMatch({ playerHand, opponentHand, ruleset = "card-battle-v1" }) {
  const player = await createPlayerState(playerHand);
  const opponent = await createPlayerState(opponentHand);

  return {
    id: await sha256Hex(`${ruleset}:${player.commitment}:${opponent.commitment}`),
    ruleset,
    player,
    opponent,
    publicState: {
      ruleset,
      playerCommitment: player.commitment,
      opponentCommitment: opponent.commitment,
      playerHandSize: player.publicHandSize,
      opponentHandSize: opponent.publicHandSize
    }
  };
}

async function verifyMove({ ruleset, privateHand, salt, commitment, move }) {
  const recomputedCommitment = await commitHand(privateHand, salt);
  const cardInHand = privateHand.some((card) => card.id === move.card.id);
  const commitmentMatches = recomputedCommitment === commitment;
  const validRuleset = ruleset === "card-battle-v1";
  const valid = validRuleset && commitmentMatches && cardInHand;

  return {
    valid,
    ruleset,
    publicMove: toPublicCard(move.card),
    commitment,
    disclosed: ["ruleset", "commitment", "played card", "validity result"],
    hidden: ["unplayed cards", "salt", "opponent hand", "future strategy"],
    proofHash: await sha256Hex(
      `${ruleset}:${commitment}:${move.card.id}:${valid ? "valid" : "invalid"}`
    ),
    checkedAt: new Date().toISOString()
  };
}

async function createReceipt({ proof, round, matchId }) {
  return {
    matchId,
    round,
    accepted: proof.valid,
    proofHash: proof.proofHash,
    publicMove: proof.publicMove,
    disclosure: {
      public: proof.disclosed,
      private: proof.hidden
    },
    createdAt: new Date().toISOString()
  };
}

function createReplayGuard() {
  const usedRounds = new Set();

  return {
    claim(matchId, round) {
      const key = `${matchId}:${round}`;
      if (usedRounds.has(key)) return false;
      usedRounds.add(key);
      return true;
    },
    has(matchId, round) {
      return usedRounds.has(`${matchId}:${round}`);
    }
  };
}

return {
  commitHand,
  createDeck,
  createMatch,
  createPlayerState,
  createReplayGuard,
  createReceipt,
  createSalt,
  sha256Hex,
  shuffle,
  toPublicCard,
  verifyMove
};
})();
