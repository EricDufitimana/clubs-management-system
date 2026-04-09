"use client";

import { AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useToastStore } from "@/hooks/use-toast";
import { ToastItem } from "./toast";
import { cn } from "@/lib/utils";
import type { ToastPosition } from "@/hooks/use-toast";

const positionClasses: Record<ToastPosition, string> = {
  "top-left":      "top-5 left-5 items-start",
  "top-center":    "top-5 left-1/2 -translate-x-1/2 items-center",
  "top-right":     "top-5 right-5 items-end",
  "bottom-left":   "bottom-5 left-5 items-start",
  "bottom-center": "bottom-5 left-1/2 -translate-x-1/2 items-center",
  "bottom-right":  "bottom-5 right-5 items-end",
};

export function Toaster() {
  const { toasts, position } = useToastStore();
  const isBottom = position.startsWith("bottom");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-label="Notifications"
      className={cn(
        "pointer-events-none fixed z-[9999] flex flex-col gap-2.5",
        positionClasses[position]
      )}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} isBottom={isBottom} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
