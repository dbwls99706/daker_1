"use client";

interface DonutChartProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  title?: string;
}

export function DonutChart({ segments, size = 180, thickness = 28, title }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedOffset = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90" aria-hidden="true">
          {segments.map((seg) => {
            const pct = seg.value / total;
            const dashLength = pct * circumference;
            const offset = accumulatedOffset;
            accumulatedOffset += dashLength;
            return (
              <circle
                key={seg.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={-offset}
                className="transition-all duration-700"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-xs text-gray-500">{title || "합계"}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-700 font-medium">{seg.label}</span>
            <span className="text-gray-500 ml-auto tabular-nums">{seg.value}</span>
            <span className="text-gray-400 text-xs">({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
