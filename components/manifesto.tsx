"use client";

import { motion } from "framer-motion";
import { siteConfig } from "@/lib/siteConfig";

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const line = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Manifesto() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className="flex flex-col items-center gap-2 sm:gap-3 text-center py-12 sm:py-16"
    >
      {siteConfig.manifestoLines.map((text, i) => (
        <motion.p
          key={i}
          variants={line}
          className="font-display text-xl sm:text-2xl md:text-3xl tracking-[0.15em] text-text"
        >
          {text}
        </motion.p>
      ))}
    </motion.div>
  );
}
