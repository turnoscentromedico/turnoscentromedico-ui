"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { CreatePatientInput, UpdatePatientInput, PaginationParams } from "@/types";
import { toast } from "sonner";

export function usePatients(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.patients.all(params),
    queryFn: () => apiClient.getPatients(params),
  });
}

export function usePatient(id: number) {
  return useQuery({
    queryKey: queryKeys.patients.detail(id),
    queryFn: () => apiClient.getPatient(id),
    enabled: id > 0,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePatientInput) => apiClient.createPatient(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      toast.success("Paciente creado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePatientInput }) =>
      apiClient.updatePatient(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente actualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deletePatient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      toast.success("Paciente eliminado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
