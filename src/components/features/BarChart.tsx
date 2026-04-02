"use client";

import { useEffect, useState } from "react";

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxHeight?: number;
  title?: string;
}

export function BarChart({ data, maxHeight = 160, title }: BarChartProps) {
  const [animated, setAnimated] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimated(true), 40);
    return () => window.clearTimeout(timer);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        차트 데이터가 없습니다
      </div>
    );
  }
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);
  const description = data.map((d) => `${d.label}: ${d.value}점`).join(", ");

  return (
    <div role="figure" aria-label={title || "바 차트"}>
      {title && <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>}
      <span className="sr-only">{description}</span>
      <div className="flex items-end gap-3 justify-center" style={{ height: maxHeight + 40 }} aria-hidden="true">
        {data.map((d, index) => {
          const barHeight = Math.max(4, (d.value / maxValue) * maxHeight);
          const color = d.color || "#3b82f6";
          const share = totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : "0.0";
          return (
            <div
              key={d.label}
              className="group relative flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 transition-colors hover:bg-blue-50/50 max-w-[80px]"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex((current) => (current === index ? null : current))}
              role="button"
              tabIndex={0}
              aria-label={`${d.label} ${d.value}점`}
            >
              <span
                className={`text-xs font-bold tabular-nums transition-colors ${
                  activeIndex === index ? "text-blue-700" : "text-gray-700"
                }`}
              >
                {d.value}
              </span>
              <div
                className={`w-full cursor-pointer rounded-t-md transition-all duration-700 ease-out will-change-transform ${
                  activeIndex === index
                    ? "scale-y-[1.04] brightness-110 shadow-[0_10px_24px_rgba(59,130,246,0.35)]"
                    : "shadow-none"
                }`}
                style={{
                  height: animated ? barHeight : 4,
                  backgroundColor: color,
                  minWidth: 24,
                  transitionDelay: `${index * 70}ms`,
                }}
              />
              <span
                className={`pointer-events-none absolute -top-5 rounded-full bg-gray-900/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm transition-opacity ${
                  activeIndex === index ? "opacity-100" : "opacity-0"
                }`}
              >
                {d.value}점 · {share}%
              </span>
              <span
                className={`w-full truncate text-center text-[10px] leading-tight transition-colors ${
                  activeIndex === index ? "text-blue-700" : "text-gray-500"
                }`}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
