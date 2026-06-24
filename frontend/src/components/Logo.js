import React from "react";

// ArguMind brand mark: two poles (찬성 cyan / 반대 ember) converging on the
// gold verdict node over the central seam. Mirrors public/favicon.svg.
export default function Logo({ size = 40, title = "ArguMind" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      style={{ display: "block", flex: "none" }}
    >
      <defs>
        <radialGradient id="amNode" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4DDA0" />
          <stop offset="55%" stopColor="#E7C46A" />
          <stop offset="100%" stopColor="#B9933F" />
        </radialGradient>
        <linearGradient id="amSeam" x1="32" y1="6" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2FE3C2" stopOpacity="0" />
          <stop offset="22%" stopColor="#2FE3C2" />
          <stop offset="50%" stopColor="#E7C46A" />
          <stop offset="78%" stopColor="#FF7A4D" />
          <stop offset="100%" stopColor="#FF7A4D" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="15" fill="#0C0F16" />
      <rect x="2.75" y="2.75" width="58.5" height="58.5" rx="14.25" fill="none" stroke="#2A3346" strokeWidth="1.5" />
      <rect x="30.6" y="8" width="2.8" height="48" rx="1.4" fill="url(#amSeam)" />
      <path d="M15 17 L27 32 L15 47" fill="none" stroke="#2FE3C2" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M49 17 L37 32 L49 47" fill="none" stroke="#FF7A4D" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="13" fill="url(#amNode)" opacity="0.22" />
      <path d="M32 22 L42 32 L32 42 L22 32 Z" fill="url(#amNode)" />
      <path d="M32 22 L42 32 L32 42 L22 32 Z" fill="none" stroke="#0C0F16" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
