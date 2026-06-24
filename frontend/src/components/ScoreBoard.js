import React from "react";

import { SCORE_LABELS } from "../constants";

// Formats a structured score response into the existing readable summary string.
function formatScore(data) {
  if (!data || !data.scores) return "N/A";
  const parts = Object.entries(SCORE_LABELS).map(
    ([key, label]) => `${label}: ${data.scores[key] ?? 0}`
  );
  const max = data.max_total ?? 500;
  return `${parts.join(", ")}, 총점: ${data.total ?? 0}/${max}`;
}

export default function ScoreBoard({ userScore, opponentScore }) {
  return (
    <div>
      <h4>User Score: {formatScore(userScore)}</h4>
      <h4>Opponent Score: {formatScore(opponentScore)}</h4>
    </div>
  );
}
