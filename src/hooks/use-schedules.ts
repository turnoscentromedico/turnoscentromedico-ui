"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { CreateScheduleInput, UpdateScheduleInput, BulkScheduleInput } from "@/types";
import { toast } from "sonner";

export function useDoctorSchedules(doctorId: number) {
  return useQuery({
    queryKey: queryKeys.schedules.byDoctor(doctorId),
    queryFn: () => apiClient.getDoctorSchedules(doctorId),
    enabled: doctorId > 0,
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateScheduleInput) => apiClient.createSchedule(data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.schedules.byDoctor(vars.doctorId) });
      toast.success("Horario creado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateSchedule(doctorId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateScheduleInput }) =>
      apiClient.updateSchedule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.schedules.byDoctor(doctorId) });
      toast.success("Horario actualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteSchedule(doctorId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteSchedule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.schedules.byDoctor(doctorId) });
      toast.success("Horario eliminado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useBulkReplaceSchedules(doctorId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkScheduleInput) =>
      apiClient.bulkReplaceSchedules(doctorId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.schedules.byDoctor(doctorId) });
      toast.success("Disponibilidad semanal guardada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
