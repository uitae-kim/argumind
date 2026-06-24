import React from "react";

export default function ArgumentInput({ value, onChange, onSubmit, disabled }) {
  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your argument..."
        style={{ width: "80%", padding: "10px", marginRight: "10px" }}
        disabled={disabled}
      />
      <button onClick={onSubmit} style={{ padding: "10px" }}>
        Submit
      </button>
    </div>
  );
}
