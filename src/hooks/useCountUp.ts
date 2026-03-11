import { useState, useEffect, useRef } from "react";

export function useCountUp(target: number, duration = 800): number {
  const [count, setCount] = useState(0);
  const prevTargetRef = useRef(target);

  useEffect(() => {
    if (target <= 0) {
      setCount(0);
      return;
    }

    const from = prevTargetRef.current !== target ? prevTargetRef.current : 0;
    prevTargetRef.current = target;

    const start = performance.now();
    let rafId: number;

    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(from + eased * (target - from)));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    }
    rafId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return count;
}
