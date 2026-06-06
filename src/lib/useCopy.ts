"use client";

import { useCallback, useState } from "react";

/** Returns [copied, copy] — copied flips true for ~1.5s after a successful copy. */
export function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, []);
  return [copied, copy];
}
