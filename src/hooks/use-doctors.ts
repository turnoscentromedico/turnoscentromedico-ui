"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { CreateDoctorInput, UpdateDoctorInput, PaginationParams } from "@/types";
import { toast } from "sonner";

export function useDoctors(params?: {
  clinicId?: number;
  specialtyId?: number;
  enabled?: boolean;
} & PaginationParams) {
  const { enabled = true, ...rest } = params ?? {};
  return useQuery({
    queryKey: queryKeys.doctors.filtered(rest),
    queryFn: () => apiClient.getDoctors(rest),
    enabled,
  });
}

export function useDoctor(id: number) {
  return useQuery({
    queryKey: queryKeys.doctors.detail(id),
    queryFn: () => apiClient.getDoctor(id),
    enabled: id > 0,
  });
}

export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDoctorInput) => apiClient.createDoctor(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctors"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      toast.success("Doctor creado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDoctorInput }) =>
      apiClient.updateDoctor(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctors"] });
      toast.success("Doctor actualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteDoctor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctors"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      toast.success("Doctor eliminado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
