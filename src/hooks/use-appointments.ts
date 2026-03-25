"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { CreateAppointmentInput, PaginationParams } from "@/types";
import { toast } from "sonner";

export function useAppointments(params?: {
  clinicId?: number;
  doctorId?: number;
  patientId?: number;
  date?: string;
} & PaginationParams) {
  return useQuery({
    queryKey: queryKeys.appointments.filtered(params ?? {}),
    queryFn: () => apiClient.getAppointments(params),
  });
}

export function useAppointment(id: number) {
  return useQuery({
    queryKey: queryKeys.appointments.detail(id),
    queryFn: () => apiClient.getAppointment(id),
    enabled: id > 0,
  });
}

export function useAvailableSlots(params: {
  clinicId: number;
  doctorId: number;
  date: string;
}) {
  return useQuery({
    queryKey: queryKeys.appointments.available(params),
    queryFn: () => apiClient.getAvailableSlots(params),
    enabled: params.clinicId > 0 && params.doctorId > 0 && params.date.length > 0,
  });
}

export function useAvailableSlotsBySpecialty(params: {
  clinicId: number;
  specialtyId: number;
  date: string;
}) {
  return useQuery({
    queryKey: queryKeys.appointments.availableBySpecialty(params),
    queryFn: () => apiClient.getAvailableSlotsBySpecialty(params),
    enabled: params.clinicId > 0 && params.specialtyId > 0 && params.date.length > 0,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppointmentInput) => apiClient.createAppointment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      toast.success("Turno reservado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useConfirmAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.confirmAppointment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      toast.success("Turno confirmado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.cancelAppointment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      toast.success("Turno cancelado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useResendConfirmation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.resendConfirmation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Pedido de confirmación reenviado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
