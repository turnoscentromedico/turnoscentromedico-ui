"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useUserPreferences } from "@/hooks/use-user-preferences";

export function ThemeSync() {
  const { setTheme } = useTheme();
  const { getPreference, isLoading } = useUserPreferences();
  const applied = useRef(false);

  useEffect(() => {
    if (isLoading || applied.current) return;
    const saved = getPreference<string>("theme", "");
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
    }
    applied.current = true;
  }, [isLoading, getPreference, setTheme]);

  return null;
}
