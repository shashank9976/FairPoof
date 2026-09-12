import { createHash } from "node:crypto";

const RULESET = "card-battle-v1";

function sha256Hex(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function isCard(value) {
  return value && typeof value === "object"
    && typeof value.id === "string"
    && typeof value.rank === "string"
    && typeof value.suit === "string"
    && Number.isInteger(value.power);
}

function commitmentFor(hand, salt) {
  return sha256Hex(`${hand.map((card) => card.id).sort().join("|")}:${salt}`);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return json(res, 200, {
      service: "FairProof verification API",
      status: "ok",
      ruleset: RULESET,
      method: "POST",
      endpoint: "/api/verify"
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "method_not_allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { ruleset, privateHand, salt, commitment, move } = body || {};

    if (ruleset !== RULESET || !Array.isArray(privateHand) || privateHand.length === 0
      || privateHand.length > 52 || !privateHand.every(isCard)
      || typeof salt !== "string" || !/^[a-f0-9]{32}$/i.test(salt)
      || typeof commitment !== "string" || !/^[a-f0-9]{64}$/i.test(commitment)
      || !move || !isCard(move.card)) {
      return json(res, 400, { error: "invalid_payload" });
    }

    const cardInHand = privateHand.some((card) => card.id === move.card.id);
    const commitmentMatches = commitmentFor(privateHand, salt) === commitment;
    const valid = cardInHand && commitmentMatches;
    const publicMove = {
      id: move.card.id,
      rank: move.card.rank,
      suit: move.card.suit,
      power: move.card.power
    };
    const proofHash = sha256Hex(`${ruleset}:${commitment}:${move.card.id}:${valid ? "valid" : "invalid"}`);

    return json(res, 200, {
      valid,
      ruleset,
      publicMove,
      commitment,
      disclosed: ["ruleset", "commitment", "played card", "validity result"],
      hidden: ["unplayed cards", "salt", "opponent hand", "future strategy"],
      proofHash,
      checkedAt: new Date().toISOString(),
      verifier: "server"
    });
  } catch {
    return json(res, 400, { error: "invalid_json" });
  }
}
