"use client";

import { useState, useEffect, useMemo } from "react";

interface DonutChartProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  title?: string;
}

export function DonutChart({ segments, size = 180, thickness = 28, title }: DonutChartProps) {
  const [animated, setAnimated] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimated(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  if (total === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        차트 데이터가 없습니다
      </div>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const description = segments.map((s) => `${s.label}: ${s.value}개 (${Math.round((s.value / total) * 100)}%)`).join(", ");

  // Pre-calculate offsets to avoid mutable variable in render
  const segmentData = useMemo(() => {
    let acc = 0;
    return segments.map((seg) => {
      const pct = seg.value / total;
      const dashLength = pct * circumference;
      const offset = acc;
      acc += dashLength;
      return { ...seg, dashLength, offset };
    });
  }, [segments, total, circumference]);

  return (
    <div role="figure" aria-label={`${title || "도넛 차트"}: 총 ${total}개`}>
      <span className="sr-only">{description}</span>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 drop-shadow-sm" aria-hidden="true">
            {/* Background track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={thickness}
              className="text-gray-100 dark:text-gray-800"
              opacity={0.5}
            />
            {segmentData.map((seg, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <circle
                  key={seg.label}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isHovered ? thickness + 6 : thickness}
                  strokeDasharray={animated ? `${seg.dashLength} ${circumference - seg.dashLength}` : `0 ${circumference}`}
                  strokeDashoffset={animated ? -seg.offset : 0}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out cursor-pointer"
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 6px ${seg.color}80)` : "none",
                    opacity: hoveredIndex !== null && !isHovered ? 0.5 : 1,
                  }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
          </svg>
          {/* Center label — always shows total; hovered segment shown below */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none" aria-hidden="true">
            <span className={`text-2xl font-bold text-gray-900 tabular-nums transition-opacity duration-300 ${animated ? "opacity-100" : "opacity-0"}`}>
              {total}
            </span>
            <span className={`text-xs text-gray-500 transition-opacity duration-300 ${animated ? "opacity-100" : "opacity-0"}`}>
              {title || "합계"}
            </span>
          </div>
        </div>
        {/* Legend — no scale transform to avoid overlap */}
        <div className="flex flex-col gap-1" role="list" aria-label="차트 범례">
          {segments.map((seg, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <div
                key={seg.label}
                className={`flex items-center gap-2 text-sm rounded-lg px-2.5 py-1.5 cursor-pointer transition-all duration-150 ${
                  isHovered ? "ring-1 ring-gray-300 dark:ring-gray-600 shadow-sm -translate-y-0.5" : ""
                }`}
                style={isHovered ? { backgroundColor: `${seg.color}12` } : undefined}
                role="listitem"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className="h-3 w-3 rounded-full flex-shrink-0 transition-shadow duration-150"
                  style={{
                    backgroundColor: seg.color,
                    boxShadow: isHovered ? `0 0 8px ${seg.color}60` : "none",
                  }}
                  aria-hidden="true"
                />
                <span className="font-semibold text-gray-900 dark:text-gray-100">{seg.label}</span>
                <span className="ml-auto tabular-nums font-bold text-gray-900 dark:text-gray-100">{seg.value}</span>
                <span className="text-gray-500 dark:text-gray-400 text-xs font-medium tabular-nums">({Math.round((seg.value / total) * 100)}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
