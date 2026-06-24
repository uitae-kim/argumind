import React from "react";

// Surfaces API failures to the user instead of only logging to the console.
export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      style={{
        backgroundColor: "#ffe0e0",
        border: "1px solid #f5a5a5",
        color: "#a30000",
        padding: "10px",
        borderRadius: "5px",
        margin: "10px 0",
      }}
    >
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} style={{ marginLeft: "10px" }}>
          닫기
        </button>
      )}
    </div>
  );
}
