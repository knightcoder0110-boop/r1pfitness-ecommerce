"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error";

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onDismiss: () => void;
}

export default function Toast({ message, type, visible, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-sm shadow-2xl max-w-sm w-[calc(100%-2rem)]"
          style={{
            background: type === "success"
              ? "rgba(13,13,13,0.97)"
              : "rgba(13,13,13,0.97)",
            border: type === "success"
              ? "1px solid rgba(201,168,76,0.5)"
              : "1px solid rgba(196,87,42,0.5)",
            boxShadow: type === "success"
              ? "0 0 30px rgba(201,168,76,0.15), 0 8px 32px rgba(0,0,0,0.6)"
              : "0 0 30px rgba(196,87,42,0.15), 0 8px 32px rgba(0,0,0,0.6)",
          }}
          role="alert"
          aria-live="polite"
        >
          {/* Icon */}
          <span className="text-xl flex-shrink-0">
            {type === "success" ? "🤙" : "✗"}
          </span>

          {/* Message */}
          <p
            className="font-serif italic text-sm leading-snug flex-1"
            style={{ color: type === "success" ? "#C9A84C" : "#C4572A" }}
          >
            {message}
          </p>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="text-text/30 hover:text-text/70 transition-colors text-lg leading-none flex-shrink-0 cursor-pointer"
            aria-label="Dismiss"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
