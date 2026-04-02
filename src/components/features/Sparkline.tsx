"use client";

import React, { useId, useMemo, useRef, useState, useCallback } from "react";

/* ──────────────────────────────────────────────
   Sparkline – inline SVG sparkline chart
   ────────────────────────────────────────────── */

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  filled?: boolean;
  className?: string;
  label?: string;
}

/**
 * Convert a series of points into a smooth SVG path using Catmull-Rom → cubic
 * Bezier conversion.  Tension = 0.3 gives a subtle smoothing effect.
 */
function catmullRomPath(
  points: { x: number; y: number }[],
  tension = 0.3
): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  if (points.length === 2)
    return `M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`;

  const d: string[] = [`M${points[0].x},${points[0].y}`];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + ((p2.x - p0.x) * tension) / 3;
    const cp1y = p1.y + ((p2.y - p0.y) * tension) / 3;
    const cp2x = p2.x - ((p3.x - p1.x) * tension) / 3;
    const cp2y = p2.y - ((p3.y - p1.y) * tension) / 3;

    d.push(`C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
  }

  return d.join(" ");
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  color = "#3b82f6",
  filled = true,
  className = "",
  label = "Sparkline chart",
}: SparklineProps) {
  const uid = useId();
  const gradientId = `spark-grad-${uid}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    value: number;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Padding so the last-point dot and line aren't clipped
  const pad = { top: 4, right: 6, bottom: 4, left: 2 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const points = useMemo(() => {
    if (data.length === 0) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // avoid division by zero when all values equal

    return data.map((v, i) => ({
      x: pad.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW),
      y: pad.top + innerH - ((v - min) / range) * innerH,
      value: v,
    }));
  }, [data, innerW, innerH, pad.left, pad.top]);

  const linePath = useMemo(() => catmullRomPath(points), [points]);

  const areaPath = useMemo(() => {
    if (points.length < 2) return "";
    return `${linePath} L${points[points.length - 1].x},${height - pad.bottom} L${points[0].x},${height - pad.bottom} Z`;
  }, [linePath, points, height, pad.bottom]);

  // Approximate total path length for dash animation (over-estimate is fine)
  const approxLength = useMemo(() => {
    let len = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return Math.ceil(len) || 1;
  }, [points]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (points.length === 0 || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / rect.width) * width;
      // Find nearest point
      let closest = points[0];
      let minDist = Infinity;
      for (const p of points) {
        const d = Math.abs(p.x - relX);
        if (d < minDist) {
          minDist = d;
          closest = p;
        }
      }
      setTooltip({
        x: closest.x,
        y: closest.y,
        value: closest.value,
        screenX: e.clientX,
        screenY: e.clientY,
      });
    },
    [points, width]
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  // Edge case: no data
  if (data.length === 0) {
    return (
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className={className}
      >
        <line
          x1={pad.left}
          y1={height / 2}
          x2={width - pad.right}
          y2={height / 2}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeDasharray="4 3"
        />
      </svg>
    );
  }

  // Edge case: single data point
  if (data.length === 1) {
    const p = points[0];
    return (
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className={className}
      >
        <circle cx={p.x} cy={p.y} r={3} fill={color} />
      </svg>
    );
  }

  const last = points[points.length - 1];

  return (
    <span className={`relative inline-block ${className}`}>
      <svg
        ref={svgRef}
        role="img"
        aria-label={label}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ width, height }}
        className="overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          {filled && (
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          )}
        </defs>

        {/* Area fill */}
        {filled && (
          <path
            d={areaPath}
            fill={`url(#${gradientId})`}
            className="animate-[sparkFadeIn_0.6s_ease-out_forwards]"
            style={{ opacity: 0 }}
          />
        )}

        {/* Smooth line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={approxLength}
          strokeDashoffset={approxLength}
          className="animate-[sparkDraw_0.8s_ease-out_forwards]"
        />

        {/* Last-point dot */}
        <circle
          cx={last.x}
          cy={last.y}
          r={2.5}
          fill={color}
          className="animate-[sparkDotPop_0.3s_ease-out_0.7s_forwards]"
          style={{ opacity: 0, transform: "scale(0)", transformOrigin: `${last.x}px ${last.y}px` }}
        />

        {/* Hover indicator */}
        {tooltip && (
          <>
            <line
              x1={tooltip.x}
              y1={pad.top}
              x2={tooltip.x}
              y2={height - pad.bottom}
              stroke={color}
              strokeOpacity={0.25}
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <circle cx={tooltip.x} cy={tooltip.y} r={3} fill={color} stroke="white" strokeWidth={1.5} />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <span
          className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-full rounded bg-gray-900 px-2 py-0.5 text-xs font-medium text-white shadow dark:bg-gray-100 dark:text-gray-900"
          style={{
            left: `${(tooltip.x / width) * 100}%`,
            top: `${(tooltip.y / height) * 100}%`,
            marginTop: -8,
          }}
        >
          {tooltip.value.toLocaleString()}
        </span>
      )}

      {/* Keyframe styles (injected once) */}
      <style>{`
        @keyframes sparkDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes sparkFadeIn {
          to { opacity: 1; }
        }
        @keyframes sparkDotPop {
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </span>
  );
}

/* ──────────────────────────────────────────────
   ParticipationTrend – weekly submission activity
   ────────────────────────────────────────────── */

interface ParticipationTrendProps {
  leaderboards: {
    hackathonSlug: string;
    entries: { submittedAt: string }[];
  }[];
  hackathons: { slug: string; title: string }[];
}

/**
 * Aggregates submission timestamps into weekly buckets and renders a Sparkline
 * showing submission activity over time.
 */
export function ParticipationTrend({
  leaderboards,
  hackathons,
}: ParticipationTrendProps) {
  const weeklyData = useMemo(() => {
    // Collect all submission dates
    const dates: Date[] = [];
    for (const lb of leaderboards) {
      for (const entry of lb.entries) {
        if (entry.submittedAt) {
          const d = new Date(entry.submittedAt);
          if (!isNaN(d.getTime())) dates.push(d);
        }
      }
    }

    if (dates.length === 0) return [];

    dates.sort((a, b) => a.getTime() - b.getTime());

    // Determine week boundaries (Monday-based ISO weeks)
    const startOfWeek = (d: Date) => {
      const copy = new Date(d);
      const day = copy.getDay();
      const diff = (day === 0 ? -6 : 1) - day; // Monday = 1
      copy.setDate(copy.getDate() + diff);
      copy.setHours(0, 0, 0, 0);
      return copy.getTime();
    };

    const firstWeek = startOfWeek(dates[0]);
    const lastWeek = startOfWeek(dates[dates.length - 1]);
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const numWeeks = Math.floor((lastWeek - firstWeek) / msPerWeek) + 1;

    const buckets = new Array<number>(Math.max(numWeeks, 1)).fill(0);

    for (const d of dates) {
      const idx = Math.floor((startOfWeek(d) - firstWeek) / msPerWeek);
      if (idx >= 0 && idx < buckets.length) {
        buckets[idx]++;
      }
    }

    return buckets;
  }, [leaderboards]);

  const hackathonNames = useMemo(
    () => hackathons.map((h) => h.title).join(", "),
    [hackathons]
  );

  if (weeklyData.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          최근 제출 트렌드
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          제출 데이터가 없습니다
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
        최근 제출 트렌드
      </span>
      <Sparkline
        data={weeklyData}
        width={160}
        height={36}
        color="#8b5cf6"
        filled
        label={`주간 제출 트렌드 — ${hackathonNames}`}
      />
      <span className="text-[10px] text-gray-400 dark:text-gray-500">
        {weeklyData.length}주 · 총 {weeklyData.reduce((a, b) => a + b, 0)}건
      </span>
    </div>
  );
}
