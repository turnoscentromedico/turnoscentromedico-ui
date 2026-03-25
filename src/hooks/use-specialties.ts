"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { CreateSpecialtyInput, UpdateSpecialtyInput, PaginationParams } from "@/types";
import { toast } from "sonner";

export function useSpecialties(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.specialties.all(params),
    queryFn: () => apiClient.getSpecialties(params),
  });
}

export function useCreateSpecialty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSpecialtyInput) => apiClient.createSpecialty(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["specialties"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      toast.success("Especialidad creada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateSpecialty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSpecialtyInput }) =>
      apiClient.updateSpecialty(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["specialties"] });
      toast.success("Especialidad actualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteSpecialty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteSpecialty(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["specialties"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      toast.success("Especialidad eliminada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
