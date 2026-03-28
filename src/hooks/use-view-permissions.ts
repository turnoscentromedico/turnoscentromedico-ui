"use client";

import { useMemo } from "react";
import { useMe } from "@/hooks/use-role";
import { useSettings } from "@/hooks/use-settings";

export type ViewId =
  | "dashboard"
  | "appointments"
  | "appointments.new"
  | "notifications"
  | "medical-records"
  | "clinics"
  | "specialties"
  | "doctors"
  | "patients"
  | "users"
  | "settings";

const ALL_VIEWS: ViewId[] = [
  "dashboard",
  "appointments",
  "appointments.new",
  "notifications",
  "medical-records",
  "clinics",
  "specialties",
  "doctors",
  "patients",
  "users",
  "settings",
];

const VIEW_LABELS: Record<ViewId, string> = {
  dashboard: "Dashboard",
  appointments: "Turnos",
  "appointments.new": "Nuevo Turno",
  notifications: "Notificaciones",
  "medical-records": "Historia Clínica",
  clinics: "Clínicas",
  specialties: "Especialidades",
  doctors: "Doctores",
  patients: "Pacientes",
  users: "Usuarios",
  settings: "Configuración",
};

export { ALL_VIEWS, VIEW_LABELS };

export function useViewPermissions() {
  const { data: me, isLoading: meLoading } = useMe();
  const { data: settings, isLoading: settingsLoading } = useSettings();

  const permissions = useMemo(() => {
    const role = me?.role;
    if (!role) return {};

    if (role === "ADMIN") {
      return Object.fromEntries(ALL_VIEWS.map((v) => [v, true]));
    }

    if (role === "STANDARD") {
      return Object.fromEntries(ALL_VIEWS.map((v) => [v, false]));
    }

    const key = `views.${role}` as string;
    const raw = settings?.[key as keyof typeof settings];
    if (raw) {
      try {
        return JSON.parse(raw) as Record<string, boolean>;
      } catch {
        /* fall through to empty */
      }
    }

    return {};
  }, [me?.role, settings]);

  function canAccess(viewId: ViewId): boolean {
    if (me?.role === "ADMIN") return true;
    if (me?.role === "STANDARD") return false;
    return permissions[viewId] ?? false;
  }

  return {
    canAccess,
    permissions,
    isLoading: meLoading || settingsLoading,
    role: me?.role ?? null,
  };
}
