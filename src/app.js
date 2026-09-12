const handEl = document.querySelector("#hand");
const proofReceiptEl = document.querySelector("#proofReceipt");
const matchStatusEl = document.querySelector("#matchStatus");
const opponentCommitmentEl = document.querySelector("#opponentCommitment");
const playedCardEl = document.querySelector("#playedCard");
const opponentCardEl = document.querySelector("#opponentCard");
const scoreTextEl = document.querySelector("#scoreText");
const playerCommitmentEl = document.querySelector("#playerCommitment");
const sideOpponentCommitmentEl = document.querySelector("#sideOpponentCommitment");
const roundTextEl = document.querySelector("#roundText");
const matchHistoryEl = document.querySelector("#matchHistory");
const verifyBtn = document.querySelector("#verifyBtn");
const invalidProofBtn = document.querySelector("#invalidProofBtn");
const revealBtn = document.querySelector("#revealBtn");
const newMatchBtn = document.querySelector("#newMatchBtn");

// Create sleek action bar for proof receipt
const receiptActionsEl = document.createElement("div");
receiptActionsEl.className = "receipt-actions";
receiptActionsEl.innerHTML = `
  <button class="secondary-button" type="button" disabled>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy JSON
  </button>
  <button class="secondary-button" type="button" disabled>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download
  </button>
`;
proofReceiptEl.after(receiptActionsEl);
const copyReceiptBtn = receiptActionsEl.querySelector("button:first-child");
const downloadReceiptBtn = receiptActionsEl.querySelector("button:last-child");

let state = {};

async function verifyMoveWithApi(payload) {
  const response = await fetch("/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Verification API returned ${response.status}`);
  return response.json();
}

function suitSymbol(suit) {
  switch (suit) {
    case "Hearts": return "♥";
    case "Diamonds": return "♦";
    case "Clubs": return "♣";
    case "Spades": return "♠";
    default: return suit;
  }
}

function isRedSuit(suit) {
  return suit === "Hearts" || suit === "Diamonds";
}

function cardLabel(card) {
  return `${card.rank} ${suitSymbol(card.suit)}`;
}

function shortHash(hash) {
  if (!hash) return "";
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function renderCard(card, selected) {
  const used = state.usedPlayerCards?.has(card.id);
  const symbol = suitSymbol(card.suit);
  const red = isRedSuit(card.suit);
  
  const button = document.createElement("button");
  button.className = `card ${selected ? "selected" : ""} ${used ? "used" : ""} ${red ? "suit-red" : "suit-black"}`;
  button.type = "button";
  button.disabled = used;
  
  button.innerHTML = `
    <div class="card-header">
      <span class="card-rank">${card.rank}</span>
      <span class="card-suit-mini">${symbol}</span>
    </div>
    <div class="card-center-suit">${symbol}</div>
    <div class="card-footer">
      <span class="power-badge">⚡ ${card.power}</span>
    </div>
  `;
  
  button.addEventListener("click", () => {
    state.selectedCard = card;
    state.latestProof = null;
    verifyBtn.disabled = false;
    revealBtn.disabled = true;
    
    playedCardEl.className = `played-card selected-card ${red ? "suit-red" : "suit-black"}`;
    playedCardEl.innerHTML = `
      <div class="card-header">
        <span class="card-rank">${card.rank}</span>
        <span class="card-suit-mini">${symbol}</span>
      </div>
      <div class="card-center-suit">${symbol}</div>
      <div class="card-footer">
        <span class="power-badge">⚡ ${card.power}</span>
      </div>
    `;
    
    proofReceiptEl.className = "receipt empty-receipt";
    proofReceiptEl.innerHTML = `
      <div class="receipt-placeholder">
        <span class="pulse-icon">⚡</span>
        <span>Selected <strong>${cardLabel(card)}</strong>. Generate a ZK proof to verify.</span>
      </div>
    `;
    matchStatusEl.textContent = "Card selected";
    renderHand();
  });
  return button;
}

function renderHand() {
  handEl.replaceChildren(...state.playerHand.map((card) => renderCard(card, state.selectedCard?.id === card.id)));
}

function renderProof(proof) {
  proofReceiptEl.className = `receipt ${proof.valid ? "valid" : "invalid"}`;
  const statusBadge = proof.valid 
    ? `<span class="receipt-status-badge valid-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> VALID PROOF</span>`
    : `<span class="receipt-status-badge invalid-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> REJECTED PROOF</span>`;

  proofReceiptEl.innerHTML = `
    <div class="receipt-header">
      ${statusBadge}
      <span class="receipt-time">${new Date(proof.checkedAt).toLocaleTimeString()}</span>
    </div>
    <div class="receipt-grid">
      <div><span>Ruleset</span><code>${proof.ruleset}</code></div>
      <div><span>Played Card</span><code>${proof.publicMove.id}</code></div>
      <div><span>Commitment</span><code>${shortHash(proof.commitment)}</code></div>
      <div><span>Proof Hash</span><code>${shortHash(proof.proofHash)}</code></div>
    </div>
  `;
  copyReceiptBtn.disabled = false;
  downloadReceiptBtn.disabled = false;
}

function receiptPayload() {
  return { matchId: state.matchId, round: state.round, ruleset: state.ruleset, proof: state.latestProof };
}

function renderHistory() {
  if (state.history.length === 0) {
    matchHistoryEl.className = "history-list empty-history";
    matchHistoryEl.textContent = "No rounds resolved yet.";
    return;
  }

  matchHistoryEl.className = "history-list";
  matchHistoryEl.replaceChildren(
    ...state.history.map((entry) => {
      const item = document.createElement("div");
      item.className = `history-item ${entry.result.includes("won") && !entry.result.includes("Opponent") ? "history-win" : entry.result.includes("Opponent") ? "history-loss" : "history-tie"}`;
      item.innerHTML = `
        <div class="history-item-header">
          <strong>Round ${entry.round} • ${entry.result}</strong>
          <code>${shortHash(entry.proofHash)}</code>
        </div>
        <div class="history-item-details">
          <span>You: <b>${entry.playerCard}</b></span>
          <span>VS</span>
          <span>Opponent: <b>${entry.opponentCard}</b></span>
        </div>
      `;
      return item;
    })
  );
}

function prepareNextRound() {
  const availablePlayerCards = state.playerHand.filter((card) => !state.usedPlayerCards.has(card.id));
  const availableOpponentCards = state.opponentHand.filter((card) => !state.usedOpponentCards.has(card.id));

  if (availablePlayerCards.length === 0 || availableOpponentCards.length === 0) {
    matchStatusEl.textContent = "Match complete";
    playedCardEl.className = "played-card empty";
    playedCardEl.innerHTML = `<span class="placeholder-icon">🏆</span><span>Match Complete</span>`;
    opponentCardEl.className = "played-card hidden-card";
    opponentCardEl.innerHTML = `<div class="card-back-pattern"></div><span>Done</span>`;
    invalidProofBtn.disabled = true;
    return;
  }

  state.round += 1;
  state.selectedCard = null;
  state.latestProof = null;
  state.opponentCard = availableOpponentCards[Math.floor(Math.random() * availableOpponentCards.length)];
  roundTextEl.textContent = `Round ${state.round}`;
  
  playedCardEl.className = "played-card empty";
  playedCardEl.innerHTML = `<span class="placeholder-icon">🂠</span><span>Select Card</span>`;
  
  opponentCardEl.className = "played-card hidden-card";
  opponentCardEl.innerHTML = `<div class="card-back-pattern"></div><span>Hidden</span>`;
  
  proofReceiptEl.className = "receipt empty-receipt";
  proofReceiptEl.innerHTML = `<div class="receipt-placeholder"><span>Round ${state.round} ready. Select an unused card.</span></div>`;
  matchStatusEl.textContent = `Round ${state.round} ready`;
  verifyBtn.disabled = true;
  revealBtn.disabled = true;
  invalidProofBtn.disabled = false;
  renderHand();
}

function resolveRound() {
  if (!state.replayGuard.claim(state.matchId, state.round)) {
    matchStatusEl.textContent = "Replay rejected";
    revealBtn.disabled = true;
    return;
  }

  const playerPower = state.selectedCard.power;
  const opponentPower = state.opponentCard.power;
  let result = "Tie";

  const oppSymbol = suitSymbol(state.opponentCard.suit);
  const oppRed = isRedSuit(state.opponentCard.suit);
  opponentCardEl.className = `played-card ${oppRed ? "suit-red" : "suit-black"} revealed-card`;
  opponentCardEl.innerHTML = `
    <div class="card-header">
      <span class="card-rank">${state.opponentCard.rank}</span>
      <span class="card-suit-mini">${oppSymbol}</span>
    </div>
    <div class="card-center-suit">${oppSymbol}</div>
    <div class="card-footer">
      <span class="power-badge">⚡ ${state.opponentCard.power}</span>
    </div>
  `;

  if (playerPower > opponentPower) {
    state.playerScore += 1;
    result = "You won";
  }
  if (opponentPower > playerPower) {
    state.opponentScore += 1;
    result = "Opponent won";
  }

  state.usedPlayerCards.add(state.selectedCard.id);
  state.usedOpponentCards.add(state.opponentCard.id);
  state.history.unshift({
    round: state.round,
    result,
    playerCard: cardLabel(state.selectedCard),
    opponentCard: cardLabel(state.opponentCard),
    proofHash: state.latestProof.proofHash
  });

  scoreTextEl.textContent = `${state.playerScore} - ${state.opponentScore}`;
  matchStatusEl.textContent =
    playerPower === opponentPower ? "Round tied" : playerPower > opponentPower ? "You won the round! 🎉" : "Opponent won the round 🤖";

  revealBtn.disabled = true;
  verifyBtn.disabled = true;
  invalidProofBtn.disabled = true;
  renderHistory();
  setTimeout(prepareNextRound, 1400);
}

async function startMatch() {
  const deck = FairProof.shuffle(FairProof.createDeck());
  const playerHand = deck.slice(0, 5);
  const opponentHand = deck.slice(5, 10);
  const match = await FairProof.createMatch({ playerHand, opponentHand });
  const { player, opponent } = match;

  state = {
    matchId: match.id,
    ruleset: match.ruleset,
    playerHand,
    opponentHand,
    opponentCard: opponentHand[Math.floor(Math.random() * opponentHand.length)],
    salt: player.salt,
    commitment: player.commitment,
    opponentCommitment: opponent.commitment,
    selectedCard: null,
    latestProof: null,
    round: 1,
    history: [],
    usedPlayerCards: new Set(),
    usedOpponentCards: new Set(),
    playerScore: 0,
    opponentScore: 0,
    replayGuard: FairProof.createReplayGuard()
  };

  opponentCommitmentEl.textContent = shortHash(opponent.commitment);
  playerCommitmentEl.textContent = shortHash(player.commitment);
  sideOpponentCommitmentEl.textContent = shortHash(opponent.commitment);
  roundTextEl.textContent = "Round 1";
  
  playedCardEl.className = "played-card empty";
  playedCardEl.innerHTML = `<span class="placeholder-icon">🂠</span><span>Select Card</span>`;
  
  opponentCardEl.className = "played-card hidden-card";
  opponentCardEl.innerHTML = `<div class="card-back-pattern"></div><span>Hidden</span>`;
  
  proofReceiptEl.className = "receipt empty-receipt";
  proofReceiptEl.innerHTML = `<div class="receipt-placeholder"><span>Hand committed: <code>${shortHash(player.commitment)}</code></span></div>`;
  
  copyReceiptBtn.disabled = true;
  downloadReceiptBtn.disabled = true;
  scoreTextEl.textContent = "0 - 0";
  matchStatusEl.textContent = "Private hand committed";
  verifyBtn.disabled = true;
  revealBtn.disabled = true;
  invalidProofBtn.disabled = false;
  renderHand();
  renderHistory();
}

verifyBtn.addEventListener("click", async () => {
  verifyBtn.disabled = true;
  const originalText = verifyBtn.innerHTML;
  verifyBtn.innerHTML = `<span class="btn-spinner"></span> Verifying ZK Proof...`;
  matchStatusEl.textContent = "Verifying private move commitment...";
  
  await new Promise(r => setTimeout(r, 350));
  
  const proof = await verifyMoveWithApi({
    ruleset: state.ruleset,
    privateHand: state.playerHand,
    salt: state.salt,
    commitment: state.commitment,
    move: { card: state.selectedCard }
  });

  state.latestProof = proof;
  renderProof(proof);
  matchStatusEl.textContent = proof.valid ? "Proof verified ✓" : "Proof failed ✗";
  revealBtn.disabled = !proof.valid;
  verifyBtn.disabled = false;
  verifyBtn.innerHTML = originalText;
});

invalidProofBtn.addEventListener("click", async () => {
  invalidProofBtn.disabled = true;
  const originalText = invalidProofBtn.innerHTML;
  invalidProofBtn.innerHTML = `<span class="btn-spinner"></span> Forging Invalid Move...`;
  matchStatusEl.textContent = "Simulating forged move proof...";
  
  await new Promise(r => setTimeout(r, 350));

  const forgedCard = FairProof.createDeck().find((card) => !state.playerHand.some((ownedCard) => ownedCard.id === card.id));
  const proof = await verifyMoveWithApi({
    ruleset: state.ruleset,
    privateHand: state.playerHand,
    salt: state.salt,
    commitment: state.commitment,
    move: { card: forgedCard }
  });

  state.latestProof = proof;
  renderProof(proof);
  
  const symbol = suitSymbol(forgedCard.suit);
  const red = isRedSuit(forgedCard.suit);
  playedCardEl.className = `played-card invalid-card ${red ? "suit-red" : "suit-black"}`;
  playedCardEl.innerHTML = `
    <div class="card-header">
      <span class="card-rank">${forgedCard.rank}</span>
      <span class="card-suit-mini">${symbol}</span>
    </div>
    <div class="card-center-suit">${symbol}</div>
    <div class="card-footer">
      <span class="power-badge warning-badge">⚠️ Forged</span>
    </div>
  `;
  matchStatusEl.textContent = "Invalid proof rejected 🛡️";
  revealBtn.disabled = true;
  invalidProofBtn.disabled = false;
  invalidProofBtn.innerHTML = originalText;
});

revealBtn.addEventListener("click", resolveRound);
newMatchBtn.addEventListener("click", startMatch);

copyReceiptBtn.addEventListener("click", async () => {
  if (!state.latestProof) return;
  const text = JSON.stringify(receiptPayload(), null, 2);
  try {
    await navigator.clipboard.writeText(text);
    const origHTML = copyReceiptBtn.innerHTML;
    copyReceiptBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!`;
    setTimeout(() => copyReceiptBtn.innerHTML = origHTML, 1500);
    matchStatusEl.textContent = "Receipt JSON copied to clipboard";
  } catch {
    matchStatusEl.textContent = "Copy blocked by browser";
  }
});

downloadReceiptBtn.addEventListener("click", () => {
  if (!state.latestProof) return;
  const blob = new Blob([JSON.stringify(receiptPayload(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `fairproof-${state.matchId}-round-${state.round}.json`;
  link.click();
  URL.revokeObjectURL(url);
  matchStatusEl.textContent = "Receipt downloaded";
});

startMatch();
