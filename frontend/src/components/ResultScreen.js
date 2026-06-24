import React from "react";

import { SCORE_AXES, MAX_TOTAL } from "../constants";
import ScoreRadar from "./ScoreRadar";
import ScoreTrend from "./ScoreTrend";

// Synthesize a one-line 총평 from the user's axis spread vs the opponent's.
function buildSummary(userAxis = {}, oppAxis = {}, winner) {
  const diffs = SCORE_AXES.map((axis) => ({
    label: axis.label,
    delta: (userAxis[axis.key] ?? 0) - (oppAxis[axis.key] ?? 0),
  }));
  const sorted = [...diffs].sort((a, b) => b.delta - a.delta);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const lead =
    winner === "user"
      ? "이번 토론은 당신의 우세였습니다."
      : winner === "opponent"
      ? "이번 토론은 AI 토론자가 앞섰습니다."
      : "팽팽한 접전이었습니다.";

  const strength =
    best && best.delta > 0
      ? ` 특히 ${best.label}에서 상대를 분명히 앞섰고,`
      : "";
  const weakness =
    worst && worst.delta < 0
      ? ` ${worst.label}에서는 다소 뒤처졌습니다.`
      : " 모든 축에서 고르게 균형을 유지했습니다.";

  return lead + strength + weakness;
}

// 04 판정 (Verdict). Left: ruling paper. Right: radar + trend.
export default function ResultScreen({ result, onRestart, onHistory }) {
  const {
    topic,
    position,
    opponentPosition,
    userTotal = 0,
    opponentTotal = 0,
    userAxisAvg = {},
    opponentAxisAvg = {},
    userTrend = [],
    opponentTrend = [],
    winner = "tie",
    turnsPlayed = 0,
  } = result || {};

  const rulingClass =
    winner === "user" ? "win" : winner === "opponent" ? "lose" : "";
  const rulingText =
    winner === "user"
      ? "당신의 승리"
      : winner === "opponent"
      ? "패배"
      : "무승부";

  const diff = Math.abs(userTotal - opponentTotal);
  const rulingSub =
    winner === "tie"
      ? `${turnsPlayed}턴 누적 · 동점`
      : `${turnsPlayed}턴 누적 · ${diff}점 차`;

  const userRole = position || "찬성";
  const oppRole = opponentPosition || "반대";

  return (
    <div>
      <div className="rail">
        <div className="combatant right">
          <div>
            <div className="who">나</div>
            <div className="role">{userRole}</div>
          </div>
          <div className="avatar avatar-affirm" aria-hidden="true">
            나
          </div>
        </div>
        <div className="rail-mid">
          <div className="rail-turn">최종 판정</div>
          <div className="rail-topic">{topic}</div>
        </div>
        <div className="combatant">
          <div className="avatar avatar-negate" aria-hidden="true">
            AI
          </div>
          <div>
            <div className="who">AI 토론자</div>
            <div className="role">{oppRole}</div>
          </div>
        </div>
      </div>

      <div className="verdict">
        <div className="verdict-paper">
          <p className="eyebrow">심판의 판정</p>
          <div className="ruling">
            <span className={rulingClass}>{rulingText}</span>
          </div>
          <div className="ruling-sub">{rulingSub}</div>

          <div className="tally">
            <div className="side affirm">
              <div className="role">나 · {userRole}</div>
              <div className="num">{userTotal}</div>
              <div className="den">/{MAX_TOTAL}</div>
            </div>
            <div className="seam"></div>
            <div className="side negate">
              <div className="role">AI · {oppRole}</div>
              <div className="num">{opponentTotal}</div>
              <div className="den">/{MAX_TOTAL}</div>
            </div>
          </div>

          <div className="axes">
            {SCORE_AXES.map((axis) => {
              const val = Math.round(userAxisAvg[axis.key] ?? 0);
              return (
                <div className="axis" key={axis.key}>
                  <div className="axis-top">
                    <span className="axis-name">{axis.label}</span>
                    <span className="axis-val">{val}</span>
                  </div>
                  <div className="track">
                    <div
                      className="fill-affirm"
                      style={{ width: `${val}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="summary">
            <div className="sl">심판 총평</div>
            <p className="st">
              {buildSummary(userAxisAvg, opponentAxisAvg, winner)}
            </p>
          </div>

          <div className="hero-cta">
            <button className="btn btn-primary" type="button" onClick={onRestart}>
              새 주제로 다시
            </button>
            <button className="btn btn-ghost" type="button" onClick={onHistory}>
              기록 보기
            </button>
          </div>
        </div>

        <div>
          <ScoreRadar
            userScores={userAxisAvg}
            opponentScores={opponentAxisAvg}
          />
          <div className="radar-legend">
            <span className="lg">
              <span className="sw" style={{ background: "#2FE3C2" }}></span>나 ·{" "}
              {userRole}
            </span>
            <span className="lg">
              <span className="sw" style={{ background: "#FF7A4D" }}></span>AI ·{" "}
              {oppRole}
            </span>
          </div>
          <div className="trend">
            <div className="tl">턴별 누적 점수 추이</div>
            <ScoreTrend userTrend={userTrend} opponentTrend={opponentTrend} />
          </div>
        </div>
      </div>
    </div>
  );
}
