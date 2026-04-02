"use client";

import { useState, useEffect } from "react";

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

  let accumulatedOffset = 0;

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
            {segments.map((seg, idx) => {
              const pct = seg.value / total;
              const dashLength = pct * circumference;
              const offset = accumulatedOffset;
              accumulatedOffset += dashLength;
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
                  strokeDasharray={animated ? `${dashLength} ${circumference - dashLength}` : `0 ${circumference}`}
                  strokeDashoffset={animated ? -offset : 0}
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
          <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
            <span className={`text-2xl font-bold text-gray-900 transition-all duration-300 ${animated ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>
              {hoveredIndex !== null ? segments[hoveredIndex].value : total}
            </span>
            <span className={`text-xs text-gray-500 transition-all duration-300 ${animated ? "opacity-100" : "opacity-0"}`}>
              {hoveredIndex !== null ? segments[hoveredIndex].label : (title || "합계")}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2" role="list" aria-label="차트 범례">
          {segments.map((seg, idx) => (
            <div
              key={seg.label}
              className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1.5 transition-all duration-200 cursor-pointer ${
                hoveredIndex === idx ? "bg-gray-100 dark:bg-gray-800 scale-105" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
              role="listitem"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div
                className={`h-3 w-3 rounded-full flex-shrink-0 transition-transform duration-200 ${hoveredIndex === idx ? "scale-125" : ""}`}
                style={{ backgroundColor: seg.color, boxShadow: hoveredIndex === idx ? `0 0 8px ${seg.color}60` : "none" }}
                aria-hidden="true"
              />
              <span className="text-gray-700 font-medium">{seg.label}</span>
              <span className="text-gray-500 ml-auto tabular-nums font-semibold">{seg.value}</span>
              <span className="text-gray-400 text-xs">({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
