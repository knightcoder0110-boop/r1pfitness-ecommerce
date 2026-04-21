"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Toast, { type ToastType } from "@/components/toast";

interface SignupFormProps {
  onSwitchToPassword: () => void;
}

export default function SignupForm({ onSwitchToPassword }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  const dismissToast = useCallback(() => {
    setToast((t) => ({ ...t, visible: false }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        showToast("Welcome to the ohana! Check your inbox.", "success");
      } else {
        setStatus("error");
        showToast(data.error || "Something went wrong. Try again.", "error");
      }
    } catch {
      setStatus("error");
      showToast("Network error. Please try again.", "error");
    }
  };

  if (status === "success") {
    return (
      <>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onDismiss={dismissToast}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-6 w-full max-w-md mx-auto text-center"
        >
          <h2 className="font-display text-4xl sm:text-5xl tracking-wider text-gold">
            YOU&apos;RE IN THE OHANA 🤙
          </h2>
          <p className="font-serif italic text-base text-muted leading-relaxed">
            Watch your inbox. When the drop goes live, you&apos;ll be first to know.
          </p>
          <button
            onClick={onSwitchToPassword}
            className="font-serif italic text-sm text-subtle hover:text-gold transition-colors underline underline-offset-4 decoration-text/20 hover:decoration-gold/50 mt-4"
          >
            Already have a password? Enter here
          </button>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={dismissToast}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-6 w-full max-w-md mx-auto"
      >
        <div className="text-center space-y-2">
          <h2 className="font-display text-4xl sm:text-5xl tracking-wider">
            JOIN THE OHANA
          </h2>
          <p className="font-serif italic text-lg sm:text-xl text-text leading-relaxed max-w-sm mx-auto">
            Be the first to receive the drop password. Family gets in first. Always.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 text-center font-mono text-sm tracking-wider rounded-sm"
            placeholder="your@email.com"
            required
          />

          <motion.button
            type="submit"
            disabled={status === "loading"}
            whileHover={{ y: -2, boxShadow: "0 0 20px rgba(196,87,42,0.3)" }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3 bg-coral text-text font-display text-lg tracking-[0.2em] uppercase rounded-sm transition-colors hover:bg-coral/90 disabled:opacity-60 cursor-pointer"
          >
            {status === "loading" ? "Joining..." : "Join The Ohana"}
          </motion.button>
        </form>

        <p className="text-[10px] sm:text-xs text-faint text-center leading-relaxed font-mono max-w-sm">
          By submitting your email, you agree to receive marketing communications from R1P
          Fitness including drop announcements, exclusive access passwords, and promotional
          content. We may share your info with service providers per our Privacy Policy. You
          can unsubscribe at any time.
        </p>

        <button
          onClick={onSwitchToPassword}
          className="font-serif italic text-sm text-subtle hover:text-gold transition-colors underline underline-offset-4 decoration-text/20 hover:decoration-gold/50 cursor-pointer"
        >
          Already have a password? Enter here
        </button>
      </motion.div>
    </>
  );
}
