"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { MeResponse, UserRole } from "@/types";

export function useMe() {
  return useQuery<MeResponse>({
    queryKey: queryKeys.me,
    queryFn: () => apiClient.getMe(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useRole(): { role: UserRole | null; isLoaded: boolean } {
  const { data, isLoading, isError } = useMe();

  if (isLoading) return { role: null, isLoaded: false };
  if (isError || !data) return { role: null, isLoaded: true };

  return { role: data.role, isLoaded: true };
}
