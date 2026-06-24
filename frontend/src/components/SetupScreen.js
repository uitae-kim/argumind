import React from "react";

import {
  CATEGORIES,
  PERSONAS,
  MATCH_LENGTHS,
  personaLabel,
} from "../constants";

// 02 설정 (Setup). Picks topic area + opponent persona + match length.
// Stance (찬성/반대) stays random — foreshadowed by the chip pair in .setup-note.
export default function SetupScreen({
  category,
  persona,
  maxTurns,
  onCategory,
  onPersona,
  onMaxTurns,
  onStart,
  onBack,
  isStarting,
}) {
  return (
    <div className="setup">
      <p className="eyebrow">새 토론 설정</p>
      <h2>무엇을 두고 겨룰까요</h2>

      <div className="setup-section">
        <p className="sec-label">
          <span className="no">01</span> · 주제 영역
        </p>
        <div className="opt-grid">
          {CATEGORIES.map((c) => {
            const selected = c.key === category;
            return (
              <button
                key={c.key}
                type="button"
                className={"opt-card" + (selected ? " is-selected" : "")}
                aria-pressed={selected}
                onClick={() => onCategory(c.key)}
              >
                <span className="ot">{c.label}</span>
                <span className="od">{c.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="setup-section">
        <p className="sec-label">
          <span className="no">02</span> · 상대 토론자
        </p>
        <div className="opt-grid cols-2">
          {PERSONAS.map((p) => {
            const selected = p.key === persona;
            return (
              <button
                key={p.key}
                type="button"
                className={"opt-card" + (selected ? " is-selected" : "")}
                aria-pressed={selected}
                onClick={() => onPersona(p.key)}
              >
                <span className="persona">
                  <span className="avatar avatar-negate" aria-hidden="true">
                    {p.avatar}
                  </span>
                  <div>
                    <span className="ot">{p.label}</span>
                    <span className="od">{p.desc}</span>
                  </div>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="setup-section">
        <p className="sec-label">
          <span className="no">03</span> · 매치 길이
        </p>
        <div className="seg" role="group" aria-label="매치 길이">
          {MATCH_LENGTHS.map((m) => {
            const selected = m.value === maxTurns;
            return (
              <button
                key={m.value}
                type="button"
                className={selected ? "is-selected" : ""}
                aria-pressed={selected}
                onClick={() => onMaxTurns(m.value)}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="setup-note">
        <span className="chip chip-affirm">
          <span className="dot"></span>나
        </span>{" "}
        <span className="chip chip-negate">
          <span className="dot"></span>AI · {personaLabel(persona)}
        </span>{" "}
        찬성·반대 입장은 토론을 시작할 때 무작위로 배정됩니다.
      </p>

      <div className="setup-cta">
        <button className="btn btn-primary" type="button" onClick={onStart} disabled={isStarting}>
          {isStarting ? (
            <span className="btn-loading">
              <span className="btn-spinner" aria-hidden="true"></span>
              토론 준비 중…
            </span>
          ) : (
            "토론 시작"
          )}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onBack} disabled={isStarting}>
          뒤로
        </button>
      </div>
    </div>
  );
}
