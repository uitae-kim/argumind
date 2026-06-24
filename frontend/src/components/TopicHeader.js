import React from "react";

export default function TopicHeader({ topic, position }) {
  return (
    <div>
      <h2>Topic: {topic}</h2>
      <h3>Your Position: {position}</h3>
    </div>
  );
}
