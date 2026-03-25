"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { CreateUnavailabilityInput } from "@/types";
import { toast } from "sonner";

export function useDoctorUnavailabilities(doctorId: number) {
  return useQuery({
    queryKey: queryKeys.unavailabilities.byDoctor(doctorId),
    queryFn: () => apiClient.getDoctorUnavailabilities(doctorId),
    enabled: doctorId > 0,
  });
}

export function useCreateUnavailability(doctorId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUnavailabilityInput) =>
      apiClient.createUnavailability(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.unavailabilities.byDoctor(doctorId) });
      toast.success("No-disponibilidad agregada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteUnavailability(doctorId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteUnavailability(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.unavailabilities.byDoctor(doctorId) });
      toast.success("No-disponibilidad eliminada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
