import type { PaginationParams } from "@/types";

type QP = PaginationParams;

export const queryKeys = {
  me: ["me"] as const,
  setupStatus: ["setup-status"] as const,
  dashboardStats: ["dashboard-stats"] as const,
  health: ["health"] as const,
  clinics: {
    all: (params?: QP) => ["clinics", params ?? {}] as const,
    detail: (id: number) => ["clinics", id] as const,
  },
  specialties: {
    all: (params?: QP) => ["specialties", params ?? {}] as const,
    detail: (id: number) => ["specialties", id] as const,
  },
  doctors: {
    all: ["doctors"] as const,
    filtered: (params: { clinicId?: number; specialtyId?: number } & QP) =>
      ["doctors", params] as const,
    detail: (id: number) => ["doctors", id] as const,
  },
  schedules: {
    byDoctor: (doctorId: number) => ["schedules", "doctor", doctorId] as const,
  },
  unavailabilities: {
    byDoctor: (doctorId: number) =>
      ["unavailabilities", "doctor", doctorId] as const,
  },
  patients: {
    all: (params?: QP) => ["patients", params ?? {}] as const,
    detail: (id: number) => ["patients", id] as const,
  },
  appointments: {
    all: ["appointments"] as const,
    filtered: (params: {
      clinicId?: number;
      doctorId?: number;
      patientId?: number;
      date?: string;
    } & QP) => ["appointments", params] as const,
    detail: (id: number) => ["appointments", id] as const,
    available: (params: {
      clinicId: number;
      doctorId: number;
      date: string;
    }) => ["appointments", "available", params] as const,
    availableBySpecialty: (params: {
      clinicId: number;
      specialtyId: number;
      date: string;
    }) => ["appointments", "available-by-specialty", params] as const,
    availableRange: (params: {
      clinicId: number;
      doctorId?: number;
      specialtyId?: number;
      startDate: string;
      endDate: string;
    }) => ["appointments", "available-range", params] as const,
  },
  users: {
    all: (params?: QP) => ["users", params ?? {}] as const,
    detail: (id: number) => ["users", id] as const,
  },
  settings: ["settings"] as const,
  userPreferences: ["user-preferences"] as const,
  notifications: {
    all: (params?: QP) => ["notifications", params ?? {}] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
} as const;
