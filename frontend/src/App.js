import React from "react";

import useGame from "./hooks/useGame";
import StartScreen from "./components/StartScreen";
import GameScreen from "./components/GameScreen";
import ErrorBanner from "./components/ErrorBanner";

function App() {
  const game = useGame();

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <ErrorBanner message={game.error} onDismiss={game.dismissError} />
      {game.gameStarted ? (
        <GameScreen
          topic={game.topic}
          position={game.position}
          history={game.history}
          userInput={game.userInput}
          setUserInput={game.setUserInput}
          onSubmit={game.submitArgument}
          isWaitingResponse={game.isWaitingResponse}
          userScore={game.userScore}
          opponentScore={game.opponentScore}
          onRestart={game.resetGame}
        />
      ) : (
        <StartScreen onStart={game.startGame} />
      )}
    </div>
  );
}

export default App;
