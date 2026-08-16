"use client";

import { useEffect, useState } from "react";

/** True after the component has hydrated — safe to enable interactive form submit. */
export function useClientReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}
