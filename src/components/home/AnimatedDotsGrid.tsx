"use client";

import { useEffect, useRef, useCallback } from "react";

interface Dot {
  x: number;
  y: number;
  baseOpacity: number;
  currentOpacity: number;
  targetOpacity: number;
  scale: number;
  targetScale: number;
}

export function AnimatedDotsGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const frameRef = useRef<number>(0);

  const initDots = useCallback((width: number, height: number) => {
    const dots: Dot[] = [];
    const spacing = 32; // Spacing between dots
    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        dots.push({
          x: col * spacing,
          y: row * spacing,
          baseOpacity: 0.08 + Math.random() * 0.04, // Reduced base opacity
          currentOpacity: 0.08 + Math.random() * 0.04,
          targetOpacity: 0.08 + Math.random() * 0.04,
          scale: 1,
          targetScale: 1,
        });
      }
    }

    dotsRef.current = dots;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      initDots(width, height);
    };

    resize();
    window.addEventListener("resize", resize);

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const influenceRadius = 120; // Reduced influence radius
      const maxScale = 1.8; // Reduced max scale

      dotsRef.current.forEach((dot) => {
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < influenceRadius) {
          const factor = 1 - distance / influenceRadius;
          const eased = factor * factor * factor; // Cubic easing for smoother falloff
          dot.targetOpacity = dot.baseOpacity + eased * 0.25; // Reduced highlight intensity
          dot.targetScale = 1 + eased * (maxScale - 1);
        } else {
          dot.targetOpacity = dot.baseOpacity;
          dot.targetScale = 1;
        }

        // Smooth interpolation
        dot.currentOpacity += (dot.targetOpacity - dot.currentOpacity) * 0.12;
        dot.scale += (dot.targetScale - dot.scale) * 0.12;

        // Draw dot
        const radius = 1 * dot.scale; // Smaller base radius
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${dot.currentOpacity})`;
        ctx.fill();
      });
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(frameRef.current);
    };
  }, [initDots]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[1]"
      style={{ pointerEvents: "none" }}
    />
  );
}
