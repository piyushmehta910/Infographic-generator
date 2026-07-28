'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

const icons = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColors = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
};

export default function Toast() {
  const { toast, dismissToast } = useUIStore();
  const Icon = toast ? icons[toast.type] : null;

  return (
    <AnimatePresence>
      {toast && Icon && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          className={`fixed top-4 left-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-lg ${colors[toast.type]}`}
        >
          <Icon className={`w-5 h-5 ${iconColors[toast.type]}`} />
          <div>
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.message && <p className="text-xs opacity-80">{toast.message}</p>}
          </div>
          <button onClick={dismissToast} className="ml-4 p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}