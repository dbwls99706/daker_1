"use client";

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxHeight?: number;
  title?: string;
}

export function BarChart({ data, maxHeight = 160, title }: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        차트 데이터가 없습니다
      </div>
    );
  }
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const description = data.map((d) => `${d.label}: ${d.value}점`).join(", ");

  return (
    <div role="figure" aria-label={title || "바 차트"}>
      {title && <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>}
      <span className="sr-only">{description}</span>
      <div className="flex items-end gap-3 justify-center" style={{ height: maxHeight + 40 }} aria-hidden="true">
        {data.map((d) => {
          const barHeight = Math.max(4, (d.value / maxValue) * maxHeight);
          const color = d.color || "#3b82f6";
          return (
            <div key={d.label} className="flex flex-col items-center gap-1 flex-1 max-w-[80px]">
              <span className="text-xs font-bold text-gray-700 tabular-nums">{d.value}</span>
              <div
                className="w-full rounded-t-md transition-all duration-700"
                style={{ height: barHeight, backgroundColor: color, minWidth: 24 }}
              />
              <span className="text-[10px] text-gray-500 text-center leading-tight truncate w-full">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
