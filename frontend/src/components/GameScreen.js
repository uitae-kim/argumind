import React from "react";

import { SCORE_AXES, MAX_ARGUMENT_LENGTH } from "../constants";

// Short mono labels for the per-turn .miniscore readout (mockup uses 2-char heads).
const MINI_LABELS = ["논리", "관련", "창의", "반박", "요약"];

function MiniScore({ score }) {
  const scores = (score && score.scores) || {};
  return (
    <div className="miniscore">
      {SCORE_AXES.map((axis, i) => (
        <span className="m" key={axis.key}>
          {MINI_LABELS[i]} <b>{scores[axis.key] ?? 0}</b>
        </span>
      ))}
      <span className="tot">{score.total ?? 0}</span>
    </div>
  );
}

function Argument({ entry, turn }) {
  const isUser = entry.side === "user";
  const chipClass = isUser ? "chip-affirm" : "chip-negate";
  const chipLabel = isUser ? "찬성" : "반대";
  return (
    <div className={"arg " + (isUser ? "arg-affirm" : "arg-negate")}>
      <div className="arg-head">
        <span className="arg-turn">T{turn}</span>
        <span className={chipClass}>
          <span className="dot"></span>
          {chipLabel}
        </span>
      </div>
      <div className="arg-text">{entry.text}</div>
      {entry.score && <MiniScore score={entry.score} />}
      {entry.score && entry.score.comment && (
        <div className="judge-note">
          <span className="jl">심판</span>
          <span>{entry.score.comment}</span>
        </div>
      )}
    </div>
  );
}

function TurnPips({ maxTurns, turnIndex }) {
  if (maxTurns === 0) {
    return <div className="rail-turn">TURN {turnIndex + 1}</div>;
  }
  const pips = [];
  for (let i = 0; i < maxTurns; i++) {
    let cls = "pip";
    if (i < turnIndex) cls += " done";
    else if (i === turnIndex) cls += " now";
    pips.push(<span className={cls} key={i}></span>);
  }
  return (
    <>
      <div className="rail-turn">
        TURN {String(Math.min(turnIndex + 1, maxTurns)).padStart(2, "0")} /{" "}
        {String(maxTurns).padStart(2, "0")}
      </div>
      <div
        className="turn-pips"
        aria-label={`${maxTurns}턴 중 ${turnIndex + 1}턴 진행 중`}
      >
        {pips}
      </div>
    </>
  );
}

// 03 진행 (Debate). Splits history by side across the central seam:
// user (찬성) right, opponent (반대) left. Composer is folded in as a <form>.
export default function GameScreen({
  topic,
  position,
  opponentPosition,
  history,
  turnIndex,
  maxTurns,
  userInput,
  onInput,
  onSubmit,
  isWaitingResponse,
  onRestart,
}) {
  const userArgs = [];
  const oppArgs = [];
  // Number turns per side independently (T1, T2, ... within each column).
  history.forEach((entry) => {
    if (entry.side === "user") {
      userArgs.push({ entry, turn: userArgs.length + 1 });
    } else {
      oppArgs.push({ entry, turn: oppArgs.length + 1 });
    }
  });

  const userRole = position || "찬성";
  const oppRole = opponentPosition || "반대";
  const canSubmit = !isWaitingResponse && userInput.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canSubmit) onSubmit();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) onSubmit();
    }
  };

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
          <TurnPips maxTurns={maxTurns} turnIndex={turnIndex} />
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

      <div className="arena">
        <div className="col col-affirm">
          {userArgs.map(({ entry, turn }, i) => (
            <Argument entry={entry} turn={turn} key={`u${i}`} />
          ))}
        </div>

        <div className="seam"></div>

        <div className="col col-negate">
          {oppArgs.map(({ entry, turn }, i) => (
            <Argument entry={entry} turn={turn} key={`o${i}`} />
          ))}
          {isWaitingResponse && (
            <div className="thinking" role="status" aria-live="polite">
              <div className="pulse">
                <i></i>
                <i></i>
                <i></i>
              </div>
              <div className="lbl">
                AI 토론자가 반박을 구성하고 심판이 채점 중…
              </div>
            </div>
          )}
        </div>
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        <div className="composer-row">
          <div className="composer-field">
            <label className="composer-label" htmlFor="arg-input">
              나의 주장 · {userRole}
            </label>
            <textarea
              id="arg-input"
              placeholder="논거를 입력하세요…"
              maxLength={MAX_ARGUMENT_LENGTH}
              value={userInput}
              onChange={(e) => onInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isWaitingResponse}
            />
          </div>
          <button className="btn btn-submit" type="submit" disabled={!canSubmit}>
            주장 제출
          </button>
        </div>
        <div className="composer-meta">
          <span className="count">
            <b>{userInput.length}</b> / {MAX_ARGUMENT_LENGTH}자
          </span>
          <span className="hint">Enter 제출 · Shift+Enter 줄바꿈</span>
        </div>
      </form>

      <div className="setup-cta setup-cta--center">
        <button className="btn btn-ghost" type="button" onClick={onRestart}>
          토론 그만두기
        </button>
      </div>
    </div>
  );
}
