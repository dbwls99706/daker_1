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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.classList.contains("dark"));
    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

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

  const getBarStyle = (color: string, barHeight: number, index: number, isActive: boolean) => ({
    height: animated ? barHeight : 4,
    backgroundColor: color,
    minWidth: 24,
    transitionDelay: `${index * 70}ms`,
    filter: isDark && !isActive ? "brightness(0.82) saturate(0.9)" : undefined,
    opacity: isDark && !isActive ? 0.92 : 1,
  });

  return (
    <div role="figure" aria-label={title || "바 차트"}>
      {title && <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>}
      <span className="sr-only">{description}</span>
      <div className="relative flex items-end gap-3 justify-center rounded-xl px-2" style={{ height: maxHeight + 40 }} aria-hidden="true">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[80%] opacity-100 dark:opacity-70"
          style={{
            backgroundImage: "repeating-linear-gradient(to top, rgba(148,163,184,0.16) 0px, rgba(148,163,184,0.16) 1px, transparent 1px, transparent 20px)",
          }}
        />
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
                  activeIndex === index ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-200"
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
                style={getBarStyle(color, barHeight, index, activeIndex === index)}
              />
              <span
                className={`pointer-events-none absolute -top-5 rounded-full bg-gray-900/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm transition-opacity dark:bg-black/85 ${
                  activeIndex === index ? "opacity-100" : "opacity-0"
                }`}
              >
                {d.value}점 · {share}%
              </span>
              <span
                className={`w-full truncate text-center text-[10px] leading-tight transition-colors ${
                  activeIndex === index ? "text-blue-700 dark:text-blue-300" : "text-gray-500 dark:text-gray-400"
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
