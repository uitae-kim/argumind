import React from "react";

// Sparkline of cumulative per-turn totals. Two polylines (user cyan,
// opponent ember). Handles empty and single-point arrays gracefully.
const VB_W = 300;
const VB_H = 98;
const X0 = 30;
const X1 = 270;
const Y_TOP = 18;
const Y_BASE = 80;

function xFor(i, n) {
  if (n <= 1) return (X0 + X1) / 2;
  return X0 + ((X1 - X0) * i) / (n - 1);
}

export default function ScoreTrend({ userTrend = [], opponentTrend = [] }) {
  const n = Math.max(userTrend.length, opponentTrend.length);

  if (n === 0) {
    return (
      <svg
        className="spark"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        role="img"
        aria-label="턴별 점수 추이 데이터 없음"
      >
        <line
          x1="20"
          y1={Y_BASE}
          x2="288"
          y2={Y_BASE}
          stroke="#262E3E"
          strokeWidth="1"
        />
        <text
          x={VB_W / 2}
          y={Y_BASE / 2 + 14}
          textAnchor="middle"
          fill="#5C6479"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="11"
        >
          아직 기록이 없습니다
        </text>
      </svg>
    );
  }

  // Shared scale across both series so the two lines are comparable.
  const all = [...userTrend, ...opponentTrend].filter((v) => v != null);
  const max = Math.max(...all, 1);
  const min = Math.min(...all);
  const span = max - min || 1;
  const yFor = (v) => Y_TOP + (Y_BASE - Y_TOP) * (1 - (v - min) / span);

  const toPoints = (arr) =>
    arr.map((v, i) => `${xFor(i, arr.length)},${yFor(v)}`).join(" ");

  const ariaLabel = `턴별 누적 점수 추이: 나 ${userTrend.join(
    ", "
  )} · AI ${opponentTrend.join(", ")}`;

  return (
    <svg
      className="spark"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={ariaLabel}
    >
      <line
        x1="20"
        y1={Y_BASE}
        x2="288"
        y2={Y_BASE}
        stroke="#262E3E"
        strokeWidth="1"
      />

      <polyline
        points={toPoints(opponentTrend)}
        fill="none"
        stroke="#FF7A4D"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <g fill="#FF7A4D">
        {opponentTrend.map((v, i) => (
          <circle
            key={i}
            cx={xFor(i, opponentTrend.length)}
            cy={yFor(v)}
            r="3"
          />
        ))}
      </g>

      <polyline
        points={toPoints(userTrend)}
        fill="none"
        stroke="#2FE3C2"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <g fill="#2FE3C2">
        {userTrend.map((v, i) => (
          <circle key={i} cx={xFor(i, userTrend.length)} cy={yFor(v)} r="3" />
        ))}
      </g>

      <g
        fill="#8B93A7"
        fontFamily="'IBM Plex Mono', monospace"
        fontSize="10"
      >
        {Array.from({ length: n }).map((_, i) => (
          <text key={i} x={xFor(i, n)} y="94" textAnchor="middle">
            T{i + 1}
          </text>
        ))}
      </g>
    </svg>
  );
}
