"use client";

import { useEffect, useState } from "react";
import { seedIfNeeded } from "@/lib/storage";

export function useSeedData() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedIfNeeded();
    setReady(true);
  }, []);

  return ready;
}
