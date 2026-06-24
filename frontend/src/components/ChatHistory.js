import React from "react";

export default function ChatHistory({ history }) {
  return (
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
  );
}
