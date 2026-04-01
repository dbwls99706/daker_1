"use client";

import { useRef, useState, useCallback } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  style?: React.CSSProperties;
}

export function TiltCard({ children, className = "", intensity = 6, style: externalStyle }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(800px) rotateX(0deg) rotateY(0deg)");
  const [glare, setGlare] = useState("radial-gradient(circle at 50% 50%, transparent 0%, transparent 100%)");
  const [isHovering, setIsHovering] = useState(false);
  const rafRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    // Debounce with rAF
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = cardRef.current!.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const rotateY = (x - 0.5) * intensity * 2;
      const rotateX = (0.5 - y) * intensity * 2;

      setTransform(`perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`);
      setGlare(`radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.15) 0%, transparent 60%)`);
    });
  }, [intensity]);

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setIsHovering(false);
    setTransform("perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)");
    setGlare("radial-gradient(circle at 50% 50%, transparent 0%, transparent 100%)");
  }, []);

  const handleMouseEnter = useCallback(() => {
    // Disable on mobile/touch
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setIsHovering(true);
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative ${className}`}
      onMouseMove={isHovering ? handleMouseMove : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...externalStyle,
        transform,
        transition: isHovering ? "none" : "transform 0.4s ease-out",
        willChange: isHovering ? "transform" : "auto",
        transformStyle: "preserve-3d",
      }}
    >
      {children}
      {/* Glare overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          background: glare,
          opacity: isHovering ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
        aria-hidden="true"
      />
    </div>
  );
}
