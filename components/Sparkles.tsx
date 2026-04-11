"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  fadeDir: number;
  color: string;
}

const COLORS = ["#C9A84C", "#F2EDE4", "#C4572A", "#C9A84C", "#C9A84C"];

export default function Sparkles({ count = 60 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3 - 0.15,
      opacity: Math.random(),
      fadeDir: Math.random() > 0.5 ? 1 : -1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });

    const init = () => {
      particles = Array.from({ length: count }, createParticle);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity += p.fadeDir * 0.008;

        if (p.opacity >= 1) p.fadeDir = -1;
        if (p.opacity <= 0) {
          Object.assign(p, createParticle());
          p.opacity = 0;
          p.fadeDir = 1;
        }

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * 0.7;
        ctx.fill();

        // glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0, p.x, p.y, p.size * 3
        );
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.globalAlpha = p.opacity * 0.2;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(draw);
    };

    resize();
    init();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
