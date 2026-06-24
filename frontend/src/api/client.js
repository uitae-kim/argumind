// Centralized API client for the ArguMind backend.
// All network access lives here so components/hooks stay free of fetch details.

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "";

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`${SERVER_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = (await response.json()).error || "";
    } catch (_) {
      // response had no JSON body
    }
    throw new Error(detail || `요청 실패 (HTTP ${response.status})`);
  }

  return response.json();
}

const postJSON = (path, body) => request(path, { method: "POST", body: body || {} });
const getJSON = (path) => request(path, { method: "GET" });

// Starts a new game. params: { category, opponent_persona, max_turns }
export const getTopic = (params) => postJSON("/api/get-topic", params);
export const getArgument = (payload) => postJSON("/api/get-argument", payload);
export const getScores = (payload) => postJSON("/api/get-scores", payload);

// Reads persisted games (history list + a single game's aggregated result).
export const getGames = () => getJSON("/api/games");
export const getGameResult = (id) => getJSON(`/api/games/${id}`);
