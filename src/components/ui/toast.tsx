"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckSquare, XSquare, AlertTriangle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Toast as ToastType } from "@/hooks/use-toast";
import { useToastStore } from "@/hooks/use-toast";

// ─── Icons ────────────────────────────────────────────────────────────────────

function SuccessIcon() {
  return <CheckSquare className="h-5 w-5 text-green-500" />;
}

function ErrorIcon() {
  return <XSquare className="h-5 w-5 text-red-500" />;
}

function WarningIcon() {
  return <AlertTriangle className="h-5 w-5 text-amber-500" />;
}

function InfoIcon() {
  return <Info className="h-5 w-5 text-blue-500" />;
}

function Spinner() {
  return <Loader2 className="h-5 w-5 text-violet-500 animate-spin" />;
}

const ICONS = {
  success: <SuccessIcon />,
  error: <ErrorIcon />,
  warning: <WarningIcon />,
  info: <InfoIcon />,
  loading: <Spinner />,
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const variantStyles: Record<ToastType["variant"], string> = {
  success: "bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100",
  error:   "bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100",
  warning: "bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100",
  info:    "bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100",
  loading: "bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100",
};

const progressColor: Record<ToastType["variant"], string> = {
  success: "bg-green-500",
  error:   "bg-red-500",
  warning: "bg-amber-500",
  info:    "bg-blue-500",
  loading: "bg-violet-500",
};

const actionStyles: Record<ToastType["variant"], string> = {
  success: "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
  error:   "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
  warning: "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
  info:    "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
  loading: "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ToastItemProps {
  toast: ToastType;
  isBottom: boolean;
}

export function ToastItem({ toast, isBottom }: ToastItemProps) {
  const remove = useToastStore((s) => s.remove);
  useEffect(() => {
    if (!toast.duration) return; // loading toast — no auto-dismiss

    const timer = setTimeout(() => {
      remove(toast.id);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.duration, toast.id, remove]);

  const slideY = isBottom ? 16 : -16;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: slideY, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={cn(
        "relative flex min-w-[280px] max-w-[360px] items-center gap-3",
        "overflow-hidden rounded-xl border px-4 py-2 shadow-md",
        variantStyles[toast.variant]
      )}
    >
      {/* Icon */}
      <div className="shrink-0">{ICONS[toast.variant]}</div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
              "text-xs font-medium transition-colors",
              actionStyles[toast.variant]
            )}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => remove(toast.id)}
        className="mt-0.5 shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 border border-gray-200 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300 dark:border-gray-700"
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </motion.div>
  );
}
