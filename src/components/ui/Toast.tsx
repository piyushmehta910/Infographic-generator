"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Info, AlertTriangle } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";

const icons = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
};

// Dark-theme styling that matches the navy app shell.
const colors = {
  success: "bg-surface-800 border-emerald-500/30 text-emerald-100",
  error: "bg-surface-800 border-red-500/40 text-red-100",
  warning: "bg-surface-800 border-amber-500/40 text-amber-100",
  info: "bg-surface-800 border-brand-500/40 text-brand-100",
};

const iconColors = {
  success: "text-emerald-400",
  error: "text-red-400",
  warning: "text-amber-400",
  info: "text-brand-400",
};

export default function Toast() {
  const { toast, dismissToast } = useUIStore();
  const Icon = toast ? icons[toast.type] : null;

  return (
    <AnimatePresence>
      {toast && Icon && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -50, x: "-50%" }}
          className={`fixed top-4 left-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-lg backdrop-blur-md ${colors[toast.type]}`}
        >
          <Icon className={`w-5 h-5 ${iconColors[toast.type]}`} />
          <div>
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.message && (
              <p className="text-xs opacity-80">{toast.message}</p>
            )}
          </div>
          <button
            onClick={dismissToast}
            aria-label="Dismiss notification"
            className="ml-4 p-1 hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
