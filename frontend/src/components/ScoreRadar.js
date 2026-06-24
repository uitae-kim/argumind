import React from "react";

import { SCORE_AXES, MAX_AXIS } from "../constants";

// Geometry: regular pentagon, first vertex straight up, going clockwise —
// matches the axis order in SCORE_AXES (논리적 일관성 at top).
const CENTER = 175;
const RADIUS = 120;
const N = SCORE_AXES.length;

// angle for axis i: start at -90deg (up), clockwise.
function angle(i) {
  return -Math.PI / 2 + (2 * Math.PI * i) / N;
}

function vertex(i, r) {
  const a = angle(i);
  return [CENTER + r * Math.cos(a), CENTER + r * Math.sin(a)];
}

function ringPoints(scale) {
  return SCORE_AXES.map((_, i) => vertex(i, RADIUS * scale).join(","))
    .join(" ");
}

function polyForScores(scores) {
  return SCORE_AXES.map((axis, i) => {
    const v = Math.max(0, Math.min(MAX_AXIS, scores[axis.key] ?? 0));
    return vertex(i, RADIUS * (v / MAX_AXIS)).join(",");
  }).join(" ");
}

// Label anchor placement around the pentagon (mono labels).
function labelProps(i) {
  const [x, y] = vertex(i, RADIUS + 22);
  let anchor = "middle";
  const a = angle(i);
  const cos = Math.cos(a);
  if (cos > 0.25) anchor = "start";
  else if (cos < -0.25) anchor = "end";
  return { x: Math.round(x), y: Math.round(y) + 4, anchor };
}

// Pentagon radar: two overlapping polygons (user cyan, opponent ember).
export default function ScoreRadar({ userScores = {}, opponentScores = {} }) {
  return (
    <div
      className="radar-wrap"
      aria-label="5개 평가 축 레이더 차트: 나(찬성) 대 AI(반대)"
    >
      <svg
        viewBox="-30 12 410 322"
        role="img"
        aria-label="5축 점수 레이더: 나(찬성) 대 AI(반대)"
        style={{ width: "100%", maxWidth: "380px", height: "auto" }}
      >
        {[0.25, 0.5, 0.75, 1].map((scale, idx) => (
          <polygon
            key={scale}
            points={ringPoints(scale)}
            fill="none"
            stroke={idx === 3 ? "#2c3447" : "#262E3E"}
            strokeWidth={idx === 3 ? 1.5 : 1}
          />
        ))}
        <g stroke="#1f2636" strokeWidth="1">
          {SCORE_AXES.map((_, i) => {
            const [x, y] = vertex(i, RADIUS);
            return <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} />;
          })}
        </g>
        <polygon
          points={polyForScores(opponentScores)}
          fill="rgba(255,122,77,0.16)"
          stroke="#FF7A4D"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <polygon
          points={polyForScores(userScores)}
          fill="rgba(47,227,194,0.18)"
          stroke="#2FE3C2"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <g
          fill="#8B93A7"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="11.5"
        >
          {SCORE_AXES.map((axis, i) => {
            const { x, y, anchor } = labelProps(i);
            return (
              <text key={axis.key} x={x} y={y} textAnchor={anchor}>
                {axis.label}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
