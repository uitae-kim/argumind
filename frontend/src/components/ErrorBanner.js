import React from "react";

// Restyled to the locked .banner contract. Returns null when there is no
// message so callers can mount it unconditionally at the top of any screen.
export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="banner" role="alert">
      <span>{message}</span>
      <button className="x" type="button" aria-label="닫기" onClick={onDismiss}>
        ×
      </button>
    </div>
  );
}
