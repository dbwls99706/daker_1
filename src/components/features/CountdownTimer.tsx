"use client";

import { useCountdown } from "@/hooks/useCountdown";

interface CountdownTimerProps {
  targetIso: string;
  label?: string;
  compact?: boolean;
}

function Digit({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative rounded-lg bg-gradient-to-b from-gray-900 to-gray-800 px-2.5 py-1.5 text-white shadow-md min-w-[2.5rem] text-center dark-countdown-digit">
        <span className="text-xl font-bold tabular-nums leading-none">{String(value).padStart(2, "0")}</span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
      </div>
      <span className="mt-1 text-[10px] font-medium text-gray-500 uppercase tracking-wider">{unit}</span>
    </div>
  );
}

export function CountdownTimer({ targetIso, label, compact }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetIso);

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm font-semibold text-red-700">마감됨</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 border border-gray-200 px-3 py-1.5 text-sm tabular-nums">
        <svg className="h-4 w-4 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-semibold text-gray-900">
          {days > 0 && `${days}일 `}{String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" role="timer" aria-label={label || "마감까지 남은 시간"}>
      {label && <p className="mb-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">{label}</p>}
      <div className="flex items-center justify-center gap-2">
        <Digit value={days} unit="일" />
        <span className="text-xl font-bold text-gray-400 -mt-4">:</span>
        <Digit value={hours} unit="시" />
        <span className="text-xl font-bold text-gray-400 -mt-4">:</span>
        <Digit value={minutes} unit="분" />
        <span className="text-xl font-bold text-gray-400 -mt-4">:</span>
        <Digit value={seconds} unit="초" />
      </div>
    </div>
  );
}
