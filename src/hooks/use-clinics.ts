"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { CreateClinicInput, UpdateClinicInput, PaginationParams } from "@/types";
import { toast } from "sonner";

export function useClinics(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.clinics.all(params),
    queryFn: () => apiClient.getClinics(params),
  });
}

export function useClinic(id: number) {
  return useQuery({
    queryKey: queryKeys.clinics.detail(id),
    queryFn: () => apiClient.getClinic(id),
    enabled: id > 0,
  });
}

export function useCreateClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClinicInput) => apiClient.createClinic(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinics"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      toast.success("Clínica creada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClinicInput }) =>
      apiClient.updateClinic(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinics"] });
      toast.success("Clínica actualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteClinic(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinics"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      toast.success("Clínica eliminada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
