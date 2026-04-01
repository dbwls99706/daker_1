"use client";

import { memo } from "react";
import { useCountdown } from "@/hooks/useCountdown";

interface CountdownTimerProps {
  targetIso: string;
  label?: string;
  compact?: boolean;
}

function getUrgencyColor(totalSeconds: number) {
  if (totalSeconds <= 3600) return { bg: "from-red-600 to-red-700", text: "text-red-100", pulse: true };
  if (totalSeconds <= 86400) return { bg: "from-orange-600 to-red-600", text: "text-orange-100", pulse: true };
  if (totalSeconds <= 259200) return { bg: "from-yellow-600 to-orange-600", text: "text-yellow-100", pulse: false };
  return { bg: "from-gray-900 to-gray-800", text: "text-white", pulse: false };
}

const Digit = memo(function Digit({ value, unit, urgency }: { value: number; unit: string; urgency: ReturnType<typeof getUrgencyColor> }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`relative rounded-lg bg-gradient-to-b ${urgency.bg} px-2.5 py-1.5 shadow-md min-w-[2.5rem] text-center dark-countdown-digit ${urgency.pulse ? "animate-pulse-glow" : ""}`}>
        <span className={`text-xl font-bold tabular-nums leading-none ${urgency.text}`}>{String(value).padStart(2, "0")}</span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
      </div>
      <span className="mt-1 text-[10px] font-medium text-gray-500 uppercase tracking-wider">{unit}</span>
    </div>
  );
});

export const CountdownTimer = memo(function CountdownTimer({ targetIso, label, compact }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired, totalSeconds } = useCountdown(targetIso);
  const urgency = getUrgencyColor(totalSeconds);

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm font-semibold text-red-700">마감됨</span>
      </div>
    );
  }

  if (compact) {
    const isUrgent = totalSeconds <= 86400;
    return (
      <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm tabular-nums ${
        isUrgent ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
      }`}>
        <svg className={`h-4 w-4 flex-shrink-0 ${isUrgent ? "text-red-500 animate-pulse" : "text-orange-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={`font-semibold ${isUrgent ? "text-red-700" : "text-gray-900"}`}>
          {days > 0 && `${days}일 `}{String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" role="timer" aria-label={label || "마감까지 남은 시간"}>
      {label && (
        <p className="mb-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {label}
        </p>
      )}
      <div className="flex items-center justify-center gap-2">
        <Digit value={days} unit="일" urgency={urgency} />
        <span className="text-xl font-bold text-gray-400 -mt-4">:</span>
        <Digit value={hours} unit="시" urgency={urgency} />
        <span className="text-xl font-bold text-gray-400 -mt-4">:</span>
        <Digit value={minutes} unit="분" urgency={urgency} />
        <span className="text-xl font-bold text-gray-400 -mt-4">:</span>
        <Digit value={seconds} unit="초" urgency={urgency} />
      </div>
    </div>
  );
});
