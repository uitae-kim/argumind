// Centralized API client for the ArguMind backend.
// All network access lives here so components/hooks stay free of fetch details.

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "";

async function postJSON(path, body) {
  const response = await fetch(`${SERVER_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

export const getTopic = () => postJSON("/api/get-topic");
export const getArgument = (payload) => postJSON("/api/get-argument", payload);
export const getScores = (payload) => postJSON("/api/get-scores", payload);
