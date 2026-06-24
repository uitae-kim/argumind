import React from "react";

import TopicHeader from "./TopicHeader";
import ChatHistory from "./ChatHistory";
import ArgumentInput from "./ArgumentInput";
import ScoreBoard from "./ScoreBoard";

export default function GameScreen({
  topic,
  position,
  history,
  userInput,
  setUserInput,
  onSubmit,
  isWaitingResponse,
  userScore,
  opponentScore,
  onRestart,
}) {
  return (
    <div>
      <button onClick={onRestart}>Restart Game</button>
      <TopicHeader topic={topic} position={position} />
      <ChatHistory history={history} />
      <ArgumentInput
        value={userInput}
        onChange={setUserInput}
        onSubmit={onSubmit}
        disabled={isWaitingResponse}
      />
      <ScoreBoard userScore={userScore} opponentScore={opponentScore} />
    </div>
  );
}
