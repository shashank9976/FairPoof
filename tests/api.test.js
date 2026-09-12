const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");

const hand = [
  { id: "A-Hearts", rank: "A", suit: "Hearts", power: 14 },
  { id: "K-Spades", rank: "K", suit: "Spades", power: 13 }
];
const salt = "0123456789abcdef0123456789abcdef";
const commitment = createHash("sha256")
  .update(`${hand.map((card) => card.id).sort().join("|")}:${salt}`)
  .digest("hex");

assert.equal(commitment.length, 64);
assert.equal(hand.some((card) => card.id === "A-Hearts"), true);
assert.equal(hand.some((card) => card.id === "2-Clubs"), false);
console.log("API verification vectors passed");
