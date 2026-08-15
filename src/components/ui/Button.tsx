"use client";

import React from "react";
import { clsx } from "clsx";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "cta";
type ButtonSize = "sm" | "md" | "lg" | "xl";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 disabled:pointer-events-none disabled:opacity-50 touch-target";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-gradient text-white shadow-lg shadow-brand-900/40 hover:brightness-110 hover:scale-[1.02]",
  secondary:
    "glass-panel text-surface-100 border border-surface-400/20 hover:bg-white/10",
  outline:
    "border border-brand-400/40 text-brand-300 hover:bg-brand-900/30 hover:text-white",
  ghost: "text-surface-300 hover:text-surface-100 hover:bg-surface-800/40",
  cta: "bg-emerald-500 text-navy-950 font-semibold shadow-lg shadow-emerald-900/30 hover:brightness-110 hover:scale-[1.02]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-8 text-lg",
  xl: "h-16 px-10 text-xl",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      ref={ref}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button };

