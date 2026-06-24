import React from "react";

import useGame, { SCREENS } from "./hooks/useGame";
import StartScreen from "./components/StartScreen";
import SetupScreen from "./components/SetupScreen";
import GameScreen from "./components/GameScreen";
import ResultScreen from "./components/ResultScreen";
import HistoryScreen from "./components/HistoryScreen";
import ErrorBanner from "./components/ErrorBanner";

function App() {
  const game = useGame();

  return (
    <div className="app-shell">
      <ErrorBanner message={game.error} onDismiss={game.dismissError} />

      {game.screen === SCREENS.START && (
        <StartScreen onStart={game.goToSetup} onHistory={game.goToHistory} />
      )}

      {game.screen === SCREENS.SETUP && (
        <SetupScreen
          category={game.category}
          persona={game.persona}
          maxTurns={game.maxTurns}
          onCategory={game.setCategory}
          onPersona={game.setPersona}
          onMaxTurns={game.setMaxTurns}
          onStart={game.startGame}
          onBack={game.goToStart}
          isStarting={game.isStarting}
        />
      )}

      {game.screen === SCREENS.DEBATE && (
        <GameScreen
          topic={game.topic}
          position={game.position}
          opponentPosition={game.opponentPosition}
          history={game.history}
          turnIndex={game.turnIndex}
          maxTurns={game.activeMaxTurns}
          userInput={game.userInput}
          onInput={game.setUserInput}
          onSubmit={game.submitArgument}
          isWaitingResponse={game.isWaitingResponse}
          onRestart={game.goToSetup}
        />
      )}

      {game.screen === SCREENS.RESULT && (
        <ResultScreen
          result={game.result}
          onRestart={game.goToSetup}
          onHistory={game.goToHistory}
        />
      )}

      {game.screen === SCREENS.HISTORY && (
        <HistoryScreen
          games={game.games}
          loading={game.gamesLoading}
          onBack={game.goToStart}
          onOpen={game.openGame}
        />
      )}
    </div>
  );
}

export default App;
