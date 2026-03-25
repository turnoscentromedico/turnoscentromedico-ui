"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { AppSettings } from "@/types";
import { toast } from "sonner";

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => apiClient.getSettings(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AppSettings>) => apiClient.updateSettings(data),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.settings, data);
      toast.success("Configuración guardada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCalendarSettings() {
  const { data } = useSettings();

  const show24h = data?.["calendar.show24h"] === "true";
  const slotMinTime = show24h ? "00:00:00" : `${data?.["calendar.slotMinTime"] ?? "06:00"}:00`;
  const slotMaxTime = show24h ? "24:00:00" : `${data?.["calendar.slotMaxTime"] ?? "21:00"}:00`;
  const scrollTime = show24h ? "07:00:00" : slotMinTime;

  return { slotMinTime, slotMaxTime, scrollTime, show24h };
}
