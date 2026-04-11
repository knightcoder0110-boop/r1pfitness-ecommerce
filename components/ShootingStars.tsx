"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Star {
  id: number;
  x: number;
  y: number;
  angle: number;
  size: number;
  duration: number;
  delay: number;
}

let nextId = 0;

export default function ShootingStars() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const spawn = () => {
      const star: Star = {
        id: nextId++,
        x: Math.random() * 100,
        y: Math.random() * 40,
        angle: 30 + Math.random() * 30,
        size: 1 + Math.random() * 1.5,
        duration: 0.8 + Math.random() * 0.6,
        delay: 0,
      };
      setStars((prev) => [...prev.slice(-4), star]);
    };

    const interval = setInterval(spawn, 1800 + Math.random() * 2000);
    spawn();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {stars.map((star) => (
          <motion.div
            key={star.id}
            initial={{
              x: `${star.x}vw`,
              y: `${star.y}vh`,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: `${star.x + 30}vw`,
              y: `${star.y + 30 * Math.tan((star.angle * Math.PI) / 180)}vh`,
              opacity: 0,
              scale: 0.2,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: star.duration,
              ease: "easeOut",
            }}
            onAnimationComplete={() =>
              setStars((prev) => prev.filter((s) => s.id !== star.id))
            }
            className="absolute"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
            }}
          >
            {/* core */}
            <div
              className="absolute rounded-full bg-gold"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                boxShadow: `0 0 ${star.size * 4}px ${star.size * 2}px rgba(201,168,76,0.4)`,
              }}
            />
            {/* tail */}
            <div
              className="absolute top-0 left-0 rounded-full"
              style={{
                width: `${star.size * 40}px`,
                height: `${star.size}px`,
                background: `linear-gradient(to left, rgba(201,168,76,0.5), transparent)`,
                transformOrigin: "right center",
                transform: `rotate(${180 + star.angle}deg) translateX(0)`,
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
