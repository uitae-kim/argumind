import React from "react";

import { categoryLabel, personaLabel } from "../constants";

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// 05 기록 (History). Record summary derived from the games array, then a
// list of clickable match cards (replay entry). onOpen(id) on click.
export default function HistoryScreen({ games = [], loading, onBack, onOpen }) {
  const wins = games.filter((g) => g.result === "win").length;
  const losses = games.filter((g) => g.result === "lose").length;
  const totals = games
    .map((g) => g.user_total)
    .filter((v) => typeof v === "number");
  const avg = totals.length
    ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length)
    : 0;

  return (
    <div className="history">
      <div className="history-head">
        <div>
          <h2>토론 기록</h2>
          <p className="hsub">지난 토론을 다시 보고 점수 추이를 확인하세요.</p>
        </div>
        <div className="record">
          <div className="r">
            <span className="rn win">{wins}</span>
            <span className="rl">승</span>
          </div>
          <div className="r">
            <span className="rn lose">{losses}</span>
            <span className="rl">패</span>
          </div>
          <div className="r">
            <span className="rn">{avg}</span>
            <span className="rl">평균 점수 (나)</span>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="hsub">기록을 불러오는 중…</p>
      ) : games.length === 0 ? (
        <p className="hsub">아직 토론 기록이 없습니다. 첫 토론을 시작해 보세요.</p>
      ) : (
        <div className="match-list">
          {games.map((g) => {
            const win = g.result === "win";
            const lose = g.result === "lose";
            const badgeClass = win ? "win" : lose ? "lose" : "";
            const badgeText = win ? "승" : lose ? "패" : "—";
            const isAffirm = g.user_position === "찬성";
            const sideChipClass = isAffirm ? "chip-affirm" : "chip-negate";
            return (
              <button
                key={g.id}
                type="button"
                className="match-card"
                aria-label={`${badgeText} · 나 ${g.user_total} 대 AI ${
                  g.opponent_total
                } · ${formatDate(g.created_at)} · ${g.topic}`}
                onClick={() => onOpen(g.id)}
              >
                <span className={"badge " + badgeClass}>{badgeText}</span>
                <div className="match-topic">
                  <div className="mt">{g.topic}</div>
                  <div className="mmeta">
                    <span className={sideChipClass}>
                      <span className="dot"></span>
                      {g.user_position}
                    </span>
                    <span className="chip">{categoryLabel(g.category)}</span>
                    <span className="chip">
                      {personaLabel(g.opponent_persona)}
                    </span>
                  </div>
                </div>
                <div className="match-right">
                  <div className="ms">
                    <b>나 {g.user_total}</b> · AI {g.opponent_total}
                  </div>
                  <div className="md">{formatDate(g.created_at)}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="setup-cta">
        <button className="btn btn-ghost" type="button" onClick={onBack}>
          뒤로
        </button>
      </div>
    </div>
  );
}
