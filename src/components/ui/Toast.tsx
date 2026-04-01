"use client";

import { useEffect, useState, useRef } from "react";

type ToastType = "success" | "info" | "warning" | "error";

interface ToastProps {
  message: string | null;
  type?: ToastType;
  onDone?: () => void;
  duration?: number;
}

const typeConfig: Record<ToastType, { icon: string; bg: string; border: string; text: string; progressColor: string }> = {
  success: {
    icon: "✓",
    bg: "bg-green-900",
    border: "border-green-700",
    text: "text-green-50",
    progressColor: "bg-green-400",
  },
  info: {
    icon: "ℹ",
    bg: "bg-gray-900",
    border: "border-gray-700",
    text: "text-gray-50",
    progressColor: "bg-blue-400",
  },
  warning: {
    icon: "⚠",
    bg: "bg-yellow-900",
    border: "border-yellow-700",
    text: "text-yellow-50",
    progressColor: "bg-yellow-400",
  },
  error: {
    icon: "✕",
    bg: "bg-red-900",
    border: "border-red-700",
    text: "text-red-50",
    progressColor: "bg-red-400",
  },
};

export function Toast({ message, type = "success", onDone, duration = 2500 }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!message) {
      setVisible(false);
      setExiting(false);
      return;
    }
    setVisible(true);
    setExiting(false);
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, duration - 300);
    const timer = setTimeout(() => {
      setVisible(false);
      setExiting(false);
      onDoneRef.current?.();
    }, duration);
    return () => { clearTimeout(timer); clearTimeout(exitTimer); };
  }, [message, duration]);

  if (!visible || !message) return null;

  const config = typeConfig[type];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed right-4 top-4 sm:top-20 z-50 rounded-lg ${config.bg} border ${config.border} px-4 py-3 ${config.text} shadow-xl min-w-[200px] max-w-[340px] transition-all duration-300 ${
        exiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0 animate-fade-in"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold flex-shrink-0" aria-hidden="true">
          {config.icon}
        </span>
        <span className="text-sm font-medium">{message}</span>
      </div>
      <div className="mt-2 h-0.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full ${config.progressColor} rounded-full`}
          style={{ animation: `toast-progress ${duration}ms linear` }}
        />
      </div>
    </div>
  );
}
