import React, {useState} from "react";

const SERVER_URL = '';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);

  const [topic, setTopic] = useState("");
  const [position, setPosition] = useState("");
  const [opponentPosition, setOpponentPosition] = useState("")
  const [figure, setFigure] = useState("");

  const [history, setHistory] = useState([]);
  const [userScore, setUserScore] = useState(null);
  const [opponentScore, setOpponentScore] = useState(null);

  const [userInput, setUserInput] = useState("");
  const [isWaitingResponse, setIsWaitingResponse] = useState(false);


  const startGame = async () => {
    resetGame();
    try {
      const response = await fetch(`${SERVER_URL}/api/get-topic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      setTopic(data.topic);

      const userPosition = Math.random() < 0.5 ? "찬성" : "반대";
      const opponentPosition = userPosition === "찬성" ? "반대" : "찬성";
      setPosition(userPosition);
      setOpponentPosition(opponentPosition);
    } catch (error) {
      console.error("Error fetching topic:", error);
    }
    setGameStarted(true);
  };

  const startConversation = async () => {
    resetGame();
    try {
      const response = await fetch(`${SERVER_URL}/api/historical/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          figure: "알베르트 아인슈타인", // You can allow user selection for this
        }),
      });
      const data = await response.json();
      setFigure("알베르트 아인슈타인");
      setHistory([{ opponent: data.introduction }]);
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
    setConversationStarted(true);
  };

  const resetGame = () => {
    setGameStarted(false);
    setConversationStarted(false);
    setTopic("");
    setPosition("");
    setHistory([]);
    setUserScore(null);
    setOpponentScore(null);
    setUserInput("");
  };

  const handleInputSubmit = async () => {
    if (!userInput) return;

    const updatedHistory = [...history, { user: userInput }];
    setHistory(updatedHistory);

    try {
      setIsWaitingResponse(true);

      // Select appropriate API based on mode
      const apiEndpoint = conversationStarted
        ? `${SERVER_URL}/api/get-historical-respond`
        : `${SERVER_URL}/api/get-argument`;


      const response = await fetch(`${SERVER_URL}/api/get-argument`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: updatedHistory,
          opposite_position: opponentPosition,
          topic,
        }),
        body: JSON.stringify(
          conversationStarted
            ? {
                figure,
                history: updatedHistory,
                message: userInput,
              }
            : {
                history: updatedHistory,
                opposite_position: opponentPosition,
                topic,
              }
        ),
      });
      const data = await response.json();
      const opponentResponse = conversationStarted ? data.response : data.argument;
      const finalHistory = [...updatedHistory, { opponent: opponentResponse }];
      setHistory(finalHistory);

      // Fetch scores
      await fetchScores(userInput, opponentResponse);
    } catch (error) {
      console.error("Error fetching response:", error);
    }
    setUserInput("");
  };

  const fetchScores = async (userText, opponentText) => {
    if (conversationStarted) {
      // 대화 모드에서는 점수를 계산하지 않고 응답 대기 상태를 해제
      setIsWaitingResponse(false);
      return;
    }

    function calculateTotalScore(inputString) {
      // 정규식을 사용하여 숫자만 추출
      const scores = inputString.match(/\d+/g); // 모든 숫자를 배열로 추출

      // 숫자 배열을 합산
      return scores.reduce((sum, score) => sum + parseInt(score, 10), 0);
    }
    try {
      const userScoreResponse = await fetch(`${SERVER_URL}/api/get-scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          history,
          position,
          text: userText,
        }),
      });
      const userScoreData = await userScoreResponse.json();
      setUserScore(`${userScoreData.scores}, 총점: ${calculateTotalScore(userScoreData.scores)}/500`);

      const opponentScoreResponse = await fetch(`${SERVER_URL}/api/get-scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          history,
          position: opponentPosition,
          text: opponentText,
        }),
      });
      const opponentScoreData = await opponentScoreResponse.json();
      setOpponentScore(`${opponentScoreData.scores}, 총점: ${calculateTotalScore(opponentScoreData.scores)}/500`);
      setIsWaitingResponse(false);
    } catch (error) {
      console.error("Error fetching scores:", error);
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <button onClick={gameStarted ? resetGame : startGame}>
        {gameStarted ? "Restart Game" : "Start Game"}
      </button>
      <button
        onClick={conversationStarted ? resetGame : startConversation}>
        {conversationStarted ? "Restart Conversation" : "Start Conversation"}
      </button>
      {gameStarted && (
        <div>
          <h2>Topic: {topic}</h2>
          <h3>Your Position: {position}</h3>
          <div
            style={{
              maxHeight: "300px",
              overflowY: "scroll",
              border: "1px solid #ccc",
              padding: "10px",
              margin: "10px 0",
            }}
          >
            {history.map((entry, index) => (
              <div
                key={index}
                style={{
                  textAlign: entry.user ? "right" : "left",
                  margin: "5px 0",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "10px",
                    backgroundColor: entry.user ? "#d4f4fa" : "#f4d4fa",
                    borderRadius: "5px",
                  }}
                >
                  {entry.user || entry.opponent}
                </span>
              </div>
            ))}
          </div>
          <div>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter your argument..."
              style={{ width: "80%", padding: "10px", marginRight: "10px" }}
              disabled={isWaitingResponse}
            />
            <button onClick={handleInputSubmit} style={{ padding: "10px" }}>
              Submit
            </button>
          </div>
          <div>
            <h4>User Score: {userScore !== null ? userScore : "N/A"}</h4>
            <h4>Opponent Score: {opponentScore !== null ? opponentScore : "N/A"}</h4>
          </div>
        </div>
      )}
      {conversationStarted && (
        <div>
          <h2>Start a Conversation with a Historical Figure</h2>
          {!figure ? (
            <div>
              <input
                type="text"
                value={figure}
                onChange={(e) => setFigure(e.target.value)}
                placeholder="Enter the name of a historical figure..."
                style={{ width: "80%", padding: "10px", marginRight: "10px" }}
                disabled={isWaitingResponse}
              />
              <button
                onClick={startConversation}
                style={{ padding: "10px" }}
                disabled={!figure || isWaitingResponse}
              >
                Start Conversation
              </button>
            </div>
          ) : (
            <div>
              <h2>Historical Figure: {figure}</h2>
              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "scroll",
                  border: "1px solid #ccc",
                  padding: "10px",
                  margin: "10px 0",
                }}
              >
                {history.map((entry, index) => (
                  <div
                    key={index}
                    style={{
                      textAlign: entry.user ? "right" : "left",
                      margin: "5px 0",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "10px",
                        backgroundColor: entry.user ? "#d4f4fa" : "#f4d4fa",
                        borderRadius: "5px",
                      }}
                    >
                      {entry.user || entry.opponent}
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Talk to the historical figure..."
                  style={{ width: "80%", padding: "10px", marginRight: "10px" }}
                  disabled={isWaitingResponse}
                />
                <button onClick={handleInputSubmit} style={{ padding: "10px" }}>
                  Submit
                </button>
              </div>
            </div>
          )}
  </div>
)}
    </div>
  );
}

export default App;
