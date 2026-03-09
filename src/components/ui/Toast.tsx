"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string | null;
  onDone?: () => void;
  duration?: number;
}

export function Toast({ message, onDone, duration = 2500 }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDone]);

  if (!visible || !message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed right-4 top-20 z-50 animate-fade-in rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg"
    >
      {message}
    </div>
  );
}
