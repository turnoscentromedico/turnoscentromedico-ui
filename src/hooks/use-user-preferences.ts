"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useCallback } from "react";

const LS_KEY = "user-preferences";

function readLocalStorage(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalStorage(data: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {
    /* quota exceeded, ignore */
  }
}

export function useUserPreferences() {
  const qc = useQueryClient();

  const { data: preferences = readLocalStorage(), isLoading } = useQuery({
    queryKey: queryKeys.userPreferences,
    queryFn: async () => {
      const data = await apiClient.getUserPreferences();
      writeLocalStorage(data);
      return data;
    },
    initialData: readLocalStorage,
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      apiClient.updateUserPreferences(patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: queryKeys.userPreferences });
      const prev = qc.getQueryData<Record<string, unknown>>(queryKeys.userPreferences);
      const optimistic = { ...prev, ...patch };
      qc.setQueryData(queryKeys.userPreferences, optimistic);
      writeLocalStorage(optimistic);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(queryKeys.userPreferences, ctx.prev);
        writeLocalStorage(ctx.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.userPreferences });
    },
  });

  const setPreference = useCallback(
    (key: string, value: unknown) => {
      mutation.mutate({ [key]: value });
    },
    [mutation],
  );

  const getPreference = useCallback(
    <T = unknown>(key: string, fallback: T): T => {
      return (preferences[key] as T) ?? fallback;
    },
    [preferences],
  );

  return {
    preferences,
    isLoading,
    setPreference,
    getPreference,
    updatePreferences: mutation.mutate,
  };
}
