import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCountdown } from "@/hooks/useCountdown";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useCountdown", () => {
  it("returns isExpired=true for past dates", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    const { result } = renderHook(() => useCountdown(past));
    expect(result.current.isExpired).toBe(true);
    expect(result.current.totalSeconds).toBe(0);
  });

  it("returns positive values for future dates", () => {
    const future = new Date(Date.now() + 90061000).toISOString(); // ~1day + 1hr + 1sec
    const { result } = renderHook(() => useCountdown(future));
    expect(result.current.isExpired).toBe(false);
    expect(result.current.days).toBeGreaterThanOrEqual(1);
    expect(result.current.totalSeconds).toBeGreaterThan(0);
  });

  it("counts down when time passes", () => {
    vi.useFakeTimers();
    const future = new Date(Date.now() + 10000).toISOString(); // 10s ahead
    const { result } = renderHook(() => useCountdown(future));

    const initialSeconds = result.current.totalSeconds;

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.totalSeconds).toBeLessThan(initialSeconds);
    vi.useRealTimers();
  });

  it("decomposes time correctly", () => {
    // 1 day + 2 hours + 3 minutes + 4 seconds = 93784 seconds
    const target = new Date(Date.now() + 93784000).toISOString();
    const { result } = renderHook(() => useCountdown(target));

    // Allow ±1 second due to test execution time
    expect(result.current.days).toBe(1);
    expect(result.current.hours).toBe(2);
    expect(result.current.minutes).toBe(3);
    expect(result.current.seconds).toBeGreaterThanOrEqual(3);
    expect(result.current.seconds).toBeLessThanOrEqual(4);
  });
});
