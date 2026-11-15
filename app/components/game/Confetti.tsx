"use client";

import { useEffect, useRef } from "react";

const COLORS = [
  "#22d3ee",
  "#e879f9",
  "#a3e635",
  "#fbbf24",
  "#fb7185",
  "#ffffff",
];

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  color: string;
  round: boolean;
  wobble: number;
}

/**
 * Full-screen confetti: two cannons fire from the bottom corners, then a
 * gentle rain falls for a few seconds. Change `runKey` to fire it again.
 * Skipped entirely when the user prefers reduced motion.
 */
export function Confetti({ runKey = 0 }: { runKey?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = (): void => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const pieces: Piece[] = [];
    const rand = (a: number, b: number): number => a + Math.random() * (b - a);

    const make = (x: number, y: number, vx: number, vy: number): Piece => ({
      x,
      y,
      vx,
      vy,
      w: rand(6, 12),
      h: rand(4, 8),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.3, 0.3),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      round: Math.random() < 0.25,
      wobble: rand(0, Math.PI * 2),
    });

    const cannon = (fromLeft: boolean, count: number): void => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (let i = 0; i < count; i++) {
        const angle = rand(-1.25, -0.55); // radians, upward
        const speed = rand(11, 24) * Math.min(1.2, h / 800);
        const dir = fromLeft ? 1 : -1;
        pieces.push(
          make(
            fromLeft ? -10 : w + 10,
            h + 10,
            Math.cos(angle) * speed * dir,
            Math.sin(angle) * speed,
          ),
        );
      }
    };

    const rain = (count: number): void => {
      const w = window.innerWidth;
      for (let i = 0; i < count; i++)
        pieces.push(make(rand(0, w), -20, rand(-1.5, 1.5), rand(1, 4)));
    };

    const start = performance.now();
    const fired = new Set<number>();
    const schedule: [number, () => void][] = [
      [0, () => (cannon(true, 90), cannon(false, 90))],
      [700, () => (cannon(true, 60), cannon(false, 60))],
      [1500, () => (cannon(true, 50), cannon(false, 50))],
    ];
    const RAIN_UNTIL = 5500;

    let last = start;
    let raf = 0;
    const frame = (now: number): void => {
      const elapsed = now - start;
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;

      schedule.forEach(([t, fn], i) => {
        if (elapsed >= t && !fired.has(i)) {
          fired.add(i);
          fn();
        }
      });
      if (elapsed > 1800 && elapsed < RAIN_UNTIL && Math.random() < 0.6)
        rain(2);

      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        p.vy += 0.28 * dt; // gravity
        p.vx *= 0.992 ** dt; // air drag
        p.vy *= 0.992 ** dt;
        p.wobble += 0.12 * dt;
        p.x += (p.vx + Math.sin(p.wobble) * 0.6) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;

        if (p.y > h + 30 || p.x < -60 || p.x > w + 60) {
          pieces.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        // flip effect: squash height over time
        const squash = Math.abs(Math.cos(p.wobble));
        if (p.round) {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.w / 2, (p.h / 2) * (0.3 + squash), 0, 0, 7);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, (-p.h / 2) * squash, p.w, p.h * squash + 1);
        }
        ctx.restore();
      }

      if (pieces.length > 0 || elapsed < RAIN_UNTIL)
        raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
  }, [runKey]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] h-screen w-screen"
    />
  );
}
