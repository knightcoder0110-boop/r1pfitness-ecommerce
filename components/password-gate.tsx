"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { siteConfig } from "@/lib/siteConfig";

interface PasswordGateProps {
  onSwitchToSignup: () => void;
}

export default function PasswordGate({ onSwitchToSignup }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === siteConfig.dropPassword) {
      window.location.href = siteConfig.dropRedirectUrl;
    } else {
      setError("Wrong password. Join the ohana to get it first.");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-8 w-full max-w-md mx-auto"
    >
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full">
        <label
          htmlFor="drop-password"
          className="font-mono text-xs tracking-[0.25em] uppercase text-muted"
        >
          Enter Drop Password
        </label>

        <input
          ref={inputRef}
          id="drop-password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError("");
          }}
          className={`w-full px-4 py-3 text-center font-mono text-sm tracking-wider rounded-sm ${
            shaking ? "animate-shake" : ""
          }`}
          placeholder="••••••••"
          autoComplete="off"
        />

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-coral text-sm font-serif italic text-center"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          whileHover={{ y: -2, boxShadow: "0 0 20px rgba(201,168,76,0.25)" }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 bg-text text-bg font-display text-lg tracking-[0.2em] uppercase rounded-sm transition-colors hover:bg-gold"
        >
          Enter The Drop
        </motion.button>
      </form>

      <div className="flex flex-col items-center gap-2 w-full">
        <p className="font-mono text-sm tracking-[0.2em] uppercase text-muted font-bold">
          No password yet?
        </p>
        <motion.button
          onClick={onSwitchToSignup}
          whileHover={{ y: -2, boxShadow: "0 0 28px rgba(201,168,76,0.35)" }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 border border-gold/60 text-gold font-display text-xl tracking-[0.2em] uppercase rounded-sm bg-gold/5 hover:bg-gold/12 hover:border-gold transition-all duration-200 cursor-pointer"
        >
          Join the Ohana — Get Early Access
        </motion.button>
      </div>
    </motion.div>
  );
}
