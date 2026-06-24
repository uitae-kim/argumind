import { useState } from "react";

import { getTopic, getArgument, getScores } from "../api/client";

// Owns all debate game state and the turn flow. Components stay presentational.
export default function useGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [topic, setTopic] = useState("");
  const [position, setPosition] = useState("");
  const [opponentPosition, setOpponentPosition] = useState("");
  const [history, setHistory] = useState([]);
  const [userScore, setUserScore] = useState(null);
  const [opponentScore, setOpponentScore] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [error, setError] = useState("");

  const resetGame = () => {
    setGameStarted(false);
    setGameId(null);
    setTopic("");
    setPosition("");
    setOpponentPosition(""); // explicitly cleared (previously left stale)
    setHistory([]);
    setUserScore(null);
    setOpponentScore(null);
    setUserInput("");
    setIsWaitingResponse(false);
    setError("");
  };

  const startGame = async () => {
    resetGame();
    try {
      const data = await getTopic();
      setTopic(data.topic);
      setGameId(data.game_id ?? null);
      // Positions are assigned by the server so a persisted Game is self-contained.
      setPosition(data.user_position);
      setOpponentPosition(data.opponent_position);
      setGameStarted(true);
    } catch (err) {
      setError(`주제를 불러오지 못했습니다: ${err.message}`);
    }
  };

  const fetchScores = async (userText, opponentText, historyForContext, turnIndex) => {
    const userData = await getScores({
      game_id: gameId,
      topic,
      position,
      history: historyForContext,
      text: userText,
      side: "user",
      turn_index: turnIndex,
    });
    setUserScore(userData);

    const opponentData = await getScores({
      game_id: gameId,
      topic,
      position: opponentPosition,
      history: historyForContext,
      text: opponentText,
      side: "opponent",
      turn_index: turnIndex,
    });
    setOpponentScore(opponentData);
  };

  const submitArgument = async () => {
    if (!userInput || isWaitingResponse) return;

    const turnIndex = Math.floor(history.length / 2);
    const submittedText = userInput;
    const updatedHistory = [...history, { user: submittedText }];
    setHistory(updatedHistory);
    setUserInput("");
    setError("");
    setIsWaitingResponse(true);

    try {
      const data = await getArgument({
        game_id: gameId,
        topic,
        opposite_position: opponentPosition,
        history: updatedHistory,
      });
      const opponentArgument = data.argument;
      const finalHistory = [...updatedHistory, { opponent: opponentArgument }];
      setHistory(finalHistory);

      // Pass the up-to-date history (not the stale state) into scoring.
      await fetchScores(submittedText, opponentArgument, finalHistory, turnIndex);
    } catch (err) {
      setError(`상대 반박/채점을 불러오지 못했습니다: ${err.message}`);
    } finally {
      setIsWaitingResponse(false);
    }
  };

  return {
    gameStarted,
    topic,
    position,
    opponentPosition,
    history,
    userScore,
    opponentScore,
    userInput,
    isWaitingResponse,
    error,
    startGame,
    resetGame,
    submitArgument,
    setUserInput,
    dismissError: () => setError(""),
  };
}
