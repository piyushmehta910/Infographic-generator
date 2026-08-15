"use client";

import React from "react";

/** Simple brand logo (SVG) — used in header, footer, and trust bar. */
export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 32 32"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#10B981" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="28" height="28" rx="7" fill="url(#logoGrad)" />
    <path
      d="M9 23 L7.5 12 L10 12"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M16 23 L14 12 L16.5 12"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M24 23 L21.5 12 L24 12"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);
