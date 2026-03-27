"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type {
  CreateMedicalRecordInput,
  UpdateMedicalRecordInput,
  PaginationParams,
} from "@/types";
import { toast } from "sonner";

export function useMedicalRecords(
  patientId: number,
  params?: PaginationParams & { entryType?: string },
) {
  return useQuery({
    queryKey: queryKeys.medicalRecords.byPatient(patientId, params),
    queryFn: () => apiClient.getMedicalRecords(patientId, params),
    enabled: patientId > 0,
  });
}

export function useMedicalRecord(id: number) {
  return useQuery({
    queryKey: queryKeys.medicalRecords.detail(id),
    queryFn: () => apiClient.getMedicalRecord(id),
    enabled: id > 0,
  });
}

export function useCreateMedicalRecord(patientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMedicalRecordInput) =>
      apiClient.createMedicalRecord(patientId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medical-records"] });
      qc.invalidateQueries({ queryKey: queryKeys.patients.detail(patientId) });
      toast.success("Entrada de historia clínica creada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateMedicalRecord(patientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMedicalRecordInput }) =>
      apiClient.updateMedicalRecord(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medical-records"] });
      qc.invalidateQueries({ queryKey: queryKeys.patients.detail(patientId) });
      toast.success("Entrada actualizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteMedicalRecord(patientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteMedicalRecord(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medical-records"] });
      qc.invalidateQueries({ queryKey: queryKeys.patients.detail(patientId) });
      toast.success("Entrada eliminada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
