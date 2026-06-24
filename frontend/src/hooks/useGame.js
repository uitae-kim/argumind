import { useState } from "react";

import { getTopic, getArgument, getScores, getGames, getGameResult } from "../api/client";
import {
  SCORE_AXES,
  DEFAULT_CATEGORY,
  DEFAULT_PERSONA,
  DEFAULT_MAX_TURNS,
} from "../constants";

// Screen state machine — replaces the old single gameStarted boolean.
export const SCREENS = {
  START: "start",
  SETUP: "setup",
  DEBATE: "debate",
  RESULT: "result",
  HISTORY: "history",
};

const mean = (nums) =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

// Build the verdict payload from the completed transcript so the result screen
// never depends on best-effort server persistence.
function buildResult(history, meta) {
  const userScored = history.filter((m) => m.side === "user" && m.score);
  const oppScored = history.filter((m) => m.side === "opponent" && m.score);

  const axisAvg = (msgs) =>
    SCORE_AXES.reduce((acc, { key }) => {
      acc[key] = mean(msgs.map((m) => m.score.scores[key] ?? 0));
      return acc;
    }, {});

  const userTrend = userScored.map((m) => m.score.total);
  const opponentTrend = oppScored.map((m) => m.score.total);
  const userTotal = mean(userTrend);
  const opponentTotal = mean(opponentTrend);

  let winner = "tie";
  if (userTotal > opponentTotal) winner = "user";
  else if (opponentTotal > userTotal) winner = "opponent";

  return {
    topic: meta.topic,
    position: meta.position,
    opponentPosition: meta.opponentPosition,
    userAxisAvg: axisAvg(userScored),
    opponentAxisAvg: axisAvg(oppScored),
    userTrend,
    opponentTrend,
    userTotal,
    opponentTotal,
    winner,
    turnsPlayed: userScored.length,
    maxTurns: meta.maxTurns,
  };
}

export default function useGame() {
  const [screen, setScreen] = useState(SCREENS.START);

  // Setup selections (persist across a match so "restart" keeps them).
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [persona, setPersona] = useState(DEFAULT_PERSONA);
  const [maxTurns, setMaxTurns] = useState(DEFAULT_MAX_TURNS);

  // Active game.
  const [gameId, setGameId] = useState(null);
  const [topic, setTopic] = useState("");
  const [position, setPosition] = useState("");
  const [opponentPosition, setOpponentPosition] = useState("");
  const [activeMaxTurns, setActiveMaxTurns] = useState(DEFAULT_MAX_TURNS);
  const [history, setHistory] = useState([]); // [{ side, text, score|null }]
  const [completedTurns, setCompletedTurns] = useState(0);

  const [userInput, setUserInput] = useState("");
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);
  const [error, setError] = useState("");

  // Verdict + history list.
  const [result, setResult] = useState(null);
  const [games, setGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);

  const dismissError = () => setError("");

  const clearGame = () => {
    setGameId(null);
    setTopic("");
    setPosition("");
    setOpponentPosition("");
    setHistory([]);
    setCompletedTurns(0);
    setUserInput("");
    setIsWaitingResponse(false);
    setResult(null);
    setError("");
  };

  const goToStart = () => {
    clearGame();
    setScreen(SCREENS.START);
  };

  const goToSetup = () => {
    clearGame();
    setScreen(SCREENS.SETUP);
  };

  const startGame = async () => {
    clearGame();
    try {
      const data = await getTopic({
        category,
        opponent_persona: persona,
        max_turns: maxTurns,
      });
      setGameId(data.game_id ?? null);
      setTopic(data.topic);
      setPosition(data.user_position);
      setOpponentPosition(data.opponent_position);
      setActiveMaxTurns(data.max_turns ?? maxTurns);
      setScreen(SCREENS.DEBATE);
    } catch (err) {
      setError(`주제를 불러오지 못했습니다: ${err.message}`);
      setScreen(SCREENS.SETUP);
    }
  };

  const scoreSide = (text, sidePosition, side, historyForContext, turnIndex) =>
    getScores({
      game_id: gameId,
      topic,
      position: sidePosition,
      history: historyForContext.map((m) => ({ side: m.side, text: m.text })),
      text,
      side,
      turn_index: turnIndex,
      opponent_persona: persona,
    });

  const submitArgument = async () => {
    if (!userInput.trim() || isWaitingResponse) return;

    const turnIndex = completedTurns;
    const submittedText = userInput.trim();
    const withUser = [...history, { side: "user", text: submittedText, score: null }];
    setHistory(withUser);
    setUserInput("");
    setError("");
    setIsWaitingResponse(true);

    try {
      const argData = await getArgument({
        game_id: gameId,
        topic,
        opposite_position: opponentPosition,
        opponent_persona: persona,
        history: withUser.map((m) => ({ side: m.side, text: m.text })),
      });
      const opponentText = argData.argument;
      const scoringContext = [
        ...withUser,
        { side: "opponent", text: opponentText, score: null },
      ];

      const [userScore, opponentScore] = await Promise.all([
        scoreSide(submittedText, position, "user", scoringContext, turnIndex),
        scoreSide(opponentText, opponentPosition, "opponent", scoringContext, turnIndex),
      ]);

      const finalHistory = [
        ...history,
        { side: "user", text: submittedText, score: userScore },
        { side: "opponent", text: opponentText, score: opponentScore },
      ];
      setHistory(finalHistory);

      const turnsDone = turnIndex + 1;
      setCompletedTurns(turnsDone);

      if (activeMaxTurns > 0 && turnsDone >= activeMaxTurns) {
        setResult(
          buildResult(finalHistory, {
            topic,
            position,
            opponentPosition,
            maxTurns: activeMaxTurns,
          })
        );
        setScreen(SCREENS.RESULT);
      }
    } catch (err) {
      setError(`상대 반박/채점을 불러오지 못했습니다: ${err.message}`);
      // Roll back the optimistic user bubble so the turn can be retried.
      setHistory(history);
    } finally {
      setIsWaitingResponse(false);
    }
  };

  const goToHistory = async () => {
    setScreen(SCREENS.HISTORY);
    setGamesLoading(true);
    setError("");
    try {
      setGames(await getGames());
    } catch (err) {
      setError(`기록을 불러오지 못했습니다: ${err.message}`);
      setGames([]);
    } finally {
      setGamesLoading(false);
    }
  };

  const openGame = async (id) => {
    try {
      const data = await getGameResult(id);
      setResult({
        topic: data.topic,
        position: data.user_position,
        opponentPosition: data.opponent_position,
        userAxisAvg: data.user_axis_avg,
        opponentAxisAvg: data.opponent_axis_avg,
        userTrend: data.user_trend,
        opponentTrend: data.opponent_trend,
        userTotal: data.user_total,
        opponentTotal: data.opponent_total,
        winner: data.winner,
        turnsPlayed: (data.turns || []).length,
        maxTurns: data.max_turns,
      });
      setScreen(SCREENS.RESULT);
    } catch (err) {
      setError(`결과를 불러오지 못했습니다: ${err.message}`);
    }
  };

  return {
    screen,
    // setup
    category,
    setCategory,
    persona,
    setPersona,
    maxTurns,
    setMaxTurns,
    // active game
    topic,
    position,
    opponentPosition,
    history,
    turnIndex: completedTurns,
    activeMaxTurns,
    userInput,
    setUserInput,
    isWaitingResponse,
    error,
    // verdict + history
    result,
    games,
    gamesLoading,
    // actions
    dismissError,
    goToStart,
    goToSetup,
    goToHistory,
    startGame,
    submitArgument,
    openGame,
  };
}
