'use client';
import { useEffect, useRef } from 'react';
export function CandleFlame({ className = '', breath = 0 }: { className?: string; breath?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null), breathRef = useRef(breath);
  breathRef.current = breath;
  useEffect(() => {
    const node = canvas.current, context = node?.getContext('2d');
    if (!node || !context) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0, last = 0;
    function draw(time: number) {
      if (!context || !node) return;
      if (time - last < 42 && !reduced) { frame = requestAnimationFrame(draw); return; }
      last = time;
      const sway = reduced ? 0 : Math.sin(time / 270) * 3 + Math.sin(time / 83) * 1.5;
      const strength = breathRef.current;
      context.clearRect(0, 0, 100, 150);
      const glow = context.createRadialGradient(50, 93, 1, 50, 93, 52);
      glow.addColorStop(0, '#ffc67788'); glow.addColorStop(1, '#ffc67700');
      context.fillStyle = glow; context.fillRect(0, 0, 100, 150);
      const tip = 33 + strength * 35;
      context.beginPath(); context.moveTo(50, 139);
      context.bezierCurveTo(21, 113, 49 + sway + strength * 21, 77, 50 + sway + strength * 25, tip);
      context.bezierCurveTo(55 + sway + strength * 25, 77, 79, 120, 50, 139);
      const flame = context.createLinearGradient(50, tip, 50, 139);
      flame.addColorStop(0, '#ffdc8b'); flame.addColorStop(.45, '#fff1b4'); flame.addColorStop(.8, '#f3a443'); flame.addColorStop(1, '#c47547');
      context.fillStyle = flame; context.fill();
      context.beginPath(); context.ellipse(50, 124, 6, 12, 0, 0, Math.PI * 2); context.fillStyle = '#fff7d9'; context.fill();
      if (!reduced) frame = requestAnimationFrame(draw);
    }
    draw(50);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={canvas} width={100} height={150} className={className} aria-hidden="true" />;
}
