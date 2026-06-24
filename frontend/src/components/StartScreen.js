import React from "react";

// 01 시작 (Landing). The hero is the thesis; the .loop spells out the real
// sequence 배정 -> 논쟁 -> 판정. onStart fires the primary CTA, onHistory the ghost.
export default function StartScreen({ onStart, onHistory }) {
  return (
    <div className="page">
      <div className="hero">
        <p className="eyebrow hero-eyebrow">ArguMind · 변증의 장</p>
        <h1 className="hero-title">
          모든 진실은 <span className="affirm">찬성</span>과{" "}
          <span className="negate">반대</span> 사이에서 벼려진다
        </h1>
        <p className="hero-sub">
          ArguMind는 당신에게 한쪽 입장을 무작위로 배정합니다. 당신은 AI
          토론자를 상대로 논쟁하고, 심판 AI가 매 턴을 5개 축으로 채점합니다.
        </p>
        <div className="hero-cta">
          <button className="btn btn-primary" type="button" onClick={onStart}>
            토론 시작
          </button>
          <button className="btn btn-ghost" type="button" onClick={onHistory}>
            기록 보기
          </button>
          <span className="hero-note">입장은 무작위 배정 · 매 턴 5축 채점</span>
        </div>
      </div>
      <ol className="loop">
        <li className="loop-step">
          <span className="k">01</span>
          <h2 className="h">배정</h2>
          <p className="p">
            주제가 던져지고, 찬성과 반대 중 한쪽이 당신에게 배정됩니다. 입장은
            고를 수 없습니다.
          </p>
        </li>
        <li className="loop-step">
          <span className="k">02</span>
          <h2 className="h">논쟁</h2>
          <p className="p">
            턴을 주고받으며 AI 토론자와 맞섭니다. 상대의 허점을 짚고, 당신의
            주장을 세웁니다.
          </p>
        </li>
        <li className="loop-step">
          <span className="k">03</span>
          <h2 className="h">판정</h2>
          <p className="p">
            심판 AI가 5개 축으로 매 턴을 채점하고, 누적 점수로 승부를 가립니다.
          </p>
        </li>
      </ol>
    </div>
  );
}
