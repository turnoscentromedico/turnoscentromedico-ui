"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useUserPreferences } from "./use-user-preferences";

const DEFAULT_PAGE_SIZE = 25;

/**
 * Returns a [pageSize, setPageSize] pair synced to user preferences.
 * `section` is the preference key, e.g. "patients", "appointments".
 */
export function usePageSize(section: string) {
  const { getPreference, setPreference, isLoading } = useUserPreferences();
  const prefKey = `pageSize.${section}`;
  const saved = getPreference<number>(prefKey, DEFAULT_PAGE_SIZE);

  const [pageSize, setPageSizeLocal] = useState(saved);
  const initialised = useRef(false);

  useEffect(() => {
    if (!isLoading && !initialised.current) {
      initialised.current = true;
      if (saved !== pageSize) {
        setPageSizeLocal(saved);
      }
    }
  }, [isLoading, saved, pageSize]);

  const setPageSize = useCallback(
    (size: number) => {
      setPageSizeLocal(size);
      setPreference(prefKey, size);
    },
    [prefKey, setPreference],
  );

  return [pageSize, setPageSize] as const;
}
