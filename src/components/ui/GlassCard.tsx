"use client";

import React from "react";
import { clsx } from "clsx";

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
  strong?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, bordered = true, strong = false, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        strong ? "glass-panel" : "glass-card",
        bordered ? "border border-white/5" : "border border-transparent",
        "rounded-2xl p-6 md:p-8",
        className,
      )}
      {...props}
    />
  ),
);
GlassCard.displayName = "GlassCard";
