"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  MailCheck,
  Search,
  Stethoscope,
  Tag,
  TrendingUp,
  Users,
  UsersRound,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import {
  useAppointments,
  useAppointment,
  useConfirmAppointment,
  useCancelAppointment,
  useResendConfirmation,
} from "@/hooks/use-appointments";
import { useClinics } from "@/hooks/use-clinics";
import { useMe } from "@/hooks/use-role";
import { useViewPermissions } from "@/hooks/use-view-permissions";
import { SetupBanner } from "@/components/setup-banner";
import { DataTablePagination } from "@/components/data-table-pagination";
import { usePageSize } from "@/hooks/use-page-size";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PatientLink } from "@/components/patient-link";
import { ViewGuard } from "@/components/view-guard";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  loading?: boolean;
  color: string;
  bg: string;
}

function StatCard({ title, value, icon: Icon, loading, color, bg }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${bg.replace("/10", "/40")}`} />
    </Card>
  );
}

const statConfigs = [
  { key: "clinics" as const, title: "Clínicas", icon: Building2, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  { key: "doctors" as const, title: "Doctores", icon: Stethoscope, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-500/10" },
  { key: "patients" as const, title: "Pacientes", icon: UsersRound, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10" },
  { key: "specialties" as const, title: "Especialidades", icon: Tag, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  { key: "users" as const, title: "Usuarios", icon: Users, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
];

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
  NO_SHOW: "No asistió",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  NO_SHOW: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const statusIcons: Record<string, React.ElementType> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle2,
  CANCELLED: XCircle,
  COMPLETED: CalendarCheck,
  NO_SHOW: XCircle,
};

interface QuickActionProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

function QuickAction({ title, description, href, icon: Icon, color, bg }: QuickActionProps) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer border-border/60">
        <CardContent className="pt-5 pb-4 flex items-center gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{title}</p>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: me, isLoading: meLoading } = useMe();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { canAccess } = useViewPermissions();

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [todayPage, setTodayPage] = useState(1);
  const [todayPageSize, setTodayPageSize] = usePageSize("dashboard");

  const {
    data: todayData,
    isLoading: todayLoading,
  } = useAppointments({ date: todayStr, page: todayPage, pageSize: todayPageSize });

  const { data: allClinicsData } = useClinics({ pageSize: 100 });
  const allClinics = allClinicsData?.data;

  const [detailId, setDetailId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: detail } = useAppointment(detailId ?? 0);
  const confirmAppointment = useConfirmAppointment();
  const cancelAppointment = useCancelAppointment();
  const resendConfirmation = useResendConfirmation();

  const isAdmin = me?.role === "ADMIN";

  const assignedClinics = useMemo(() => {
    if (!allClinics || !me?.clinicIds?.length) return [];
    return allClinics.filter((c) => me.clinicIds.includes(c.id));
  }, [allClinics, me]);

  const todayAppointments = useMemo(() => {
    const all = todayData?.data ?? [];
    if (isAdmin) return all;
    if (me?.clinicIds?.length) {
      return all.filter((a) => me.clinicIds.includes(a.clinicId));
    }
    return all;
  }, [todayData, isAdmin, me]);

  const todayTotal = todayData?.total ?? 0;

  const [pendingAction, setPendingAction] = useState<{ type: "confirm" | "cancel"; id: number } | null>(null);

  function requestConfirm(id: number) {
    setPendingAction({ type: "confirm", id });
  }

  function requestCancel(id: number) {
    setPendingAction({ type: "cancel", id });
  }

  function executePendingAction() {
    if (!pendingAction) return;
    const { type, id } = pendingAction;
    setPendingAction(null);
    if (type === "confirm") {
      setActionLoading(`confirm-${id}`);
      confirmAppointment.mutate(id, {
        onSettled: () => {
          setActionLoading(null);
          setDetailId(null);
        },
      });
    } else {
      setActionLoading(`cancel-${id}`);
      cancelAppointment.mutate(id, {
        onSettled: () => {
          setActionLoading(null);
          setDetailId(null);
        },
      });
    }
  }

  function handleResend(id: number) {
    setActionLoading(`resend-${id}`);
    resendConfirmation.mutate(id, {
      onSettled: () => setActionLoading(null),
    });
  }

  if (meLoading) {
    return (
      <ViewGuard viewId="dashboard">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
      </ViewGuard>
    );
  }

  return (
    <ViewGuard viewId="dashboard">
    <div className="space-y-6">
      <SetupBanner />

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isAdmin ? "Panel de administración" : "Panel de operaciones"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen general de la actividad del sistema
        </p>
      </div>

      {/* Assigned clinics for non-admin */}
      {!isAdmin && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Clínicas asignadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedClinics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tenés clínicas asignadas. Contactá al administrador para que te asigne acceso.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignedClinics.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 shadow-sm"
                  >
                    <Building2 className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-semibold">{c.name}</p>
                      {c.address && (
                        <p className="text-xs text-muted-foreground">{c.address}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* KPI Stats */}
      {isAdmin && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {statConfigs.map((cfg) => (
            <StatCard
              key={cfg.key}
              title={cfg.title}
              value={stats?.[cfg.key] ?? 0}
              icon={cfg.icon}
              loading={statsLoading}
              color={cfg.color}
              bg={cfg.bg}
            />
          ))}
        </div>
      )}

      {/* Appointments by status + Total */}
      {isAdmin && stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {/* Total turnos card */}
          <Card className="lg:col-span-2 relative overflow-hidden">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <TrendingUp className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total turnos
                  </p>
                  {statsLoading ? (
                    <Skeleton className="h-9 w-20 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold">{stats.appointments.total}</p>
                  )}
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500/40" />
          </Card>

          {/* Status breakdown */}
          {stats.appointments.byStatus &&
            Object.keys(stats.appointments.byStatus).length > 0 && (
              <Card className="lg:col-span-4">
                <CardContent className="pt-5 pb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Turnos por estado
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(stats.appointments.byStatus).map(
                      ([status, count]) => {
                        const StatusIcon = statusIcons[status] ?? CalendarCheck;
                        return (
                          <div
                            key={status}
                            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium ${statusColors[status] ?? "bg-muted"}`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            <span>{statusLabels[status] ?? status}</span>
                            <span className="font-bold ml-1">{count}</span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {canAccess("appointments.new") && (
          <QuickAction
            title="Nuevo turno"
            description="Agendar un turno para un paciente"
            href="/dashboard/appointments/new"
            icon={CalendarPlus}
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-500/10"
          />
        )}
        {canAccess("appointments") && (
          <QuickAction
            title="Ver turnos"
            description="Listado completo de turnos del sistema"
            href="/dashboard/appointments"
            icon={CalendarCheck}
            color="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
          />
        )}
        {canAccess("patients") && (
          <QuickAction
            title="Buscar paciente"
            description="Buscar y acceder al perfil de un paciente"
            href="/dashboard/patients"
            icon={Search}
            color="text-indigo-600 dark:text-indigo-400"
            bg="bg-indigo-500/10"
          />
        )}
      </div>

      {/* Today's appointments */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <CalendarCheck className="h-4 w-4 text-primary" />
              </div>
              Turnos de hoy
              {todayTotal > 0 && (
                <Badge variant="secondary" className="ml-1 font-bold">
                  {todayTotal}
                </Badge>
              )}
            </CardTitle>
            {canAccess("appointments") && (
              <Link href="/dashboard/appointments">
                <Button variant="ghost" size="sm" className="gap-1 text-xs cursor-pointer">
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {todayLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted mb-3">
                <CalendarCheck className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No hay turnos programados para hoy
              </p>
              {!isAdmin && assignedClinics.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  en {assignedClinics.length === 1 ? "tu clínica" : "tus clínicas"}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {apt.patient.firstName[0]}
                      {apt.patient.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        <PatientLink
                          patientId={apt.patient.id}
                          firstName={apt.patient.firstName}
                          lastName={apt.patient.lastName}
                        />
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Dr. {apt.doctor.lastName}, {apt.doctor.firstName} — {apt.clinic.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {apt.startTime
                        ? apt.endTime
                          ? `${apt.startTime} — ${apt.endTime}`
                          : apt.startTime
                        : format(new Date(apt.date), "HH:mm", { locale: es })}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${statusColors[apt.status]}`}
                    >
                      {statusLabels[apt.status] ?? apt.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-pointer h-8 w-8 rounded-lg"
                      onClick={() => setDetailId(apt.id)}
                      title="Ver detalle"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {todayTotal > todayPageSize && (
                <DataTablePagination
                  page={todayPage}
                  pageSize={todayPageSize}
                  total={todayTotal}
                  onPageChange={setTodayPage}
                  onPageSizeChange={(size) => {
                    setTodayPageSize(size);
                    setTodayPage(1);
                  }}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={detailId !== null} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del Turno</DialogTitle>
          </DialogHeader>
          {detail ? (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Paciente</p>
                  <p className="font-medium">
                    <PatientLink patientId={detail.patient.id} firstName={detail.patient.firstName} lastName={detail.patient.lastName} />
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Doctor</p>
                  <p className="font-medium">{detail.doctor.firstName} {detail.doctor.lastName}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Clínica</p>
                  <p className="font-medium">{detail.clinic.name}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Especialidad</p>
                  <p className="font-medium">{detail.specialty?.name ?? "—"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {format(new Date(detail.date), "dd/MM/yyyy", { locale: es })}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Hora</p>
                  <p className="font-medium">
                    {detail.startTime
                      ? detail.endTime
                        ? `${detail.startTime} — ${detail.endTime}`
                        : detail.startTime
                      : "—"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <Badge variant="outline" className={statusColors[detail.status]}>
                    {statusLabels[detail.status] ?? detail.status}
                  </Badge>
                </div>
                {detail.patient.email && (
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Email paciente</p>
                    <p className="font-medium">{detail.patient.email}</p>
                  </div>
                )}
              </div>
              {detail.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notas</p>
                  <p>{detail.notes}</p>
                </div>
              )}

              {detail.status !== "CANCELLED" && detail.status !== "COMPLETED" && (
                <div className="flex flex-wrap gap-2 pt-3 border-t">
                  {detail.status === "PENDING" && (
                    <Button
                      size="sm"
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      onClick={() => { setDetailId(null); requestConfirm(detail.id); }}
                      disabled={actionLoading === `confirm-${detail.id}`}
                    >
                      {actionLoading === `confirm-${detail.id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Confirmar
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1.5 cursor-pointer"
                    onClick={() => { setDetailId(null); requestCancel(detail.id); }}
                    disabled={actionLoading === `cancel-${detail.id}`}
                  >
                    {actionLoading === `cancel-${detail.id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Cancelar
                  </Button>
                  {detail.status === "PENDING" && detail.patient.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 cursor-pointer"
                      onClick={() => handleResend(detail.id)}
                      disabled={actionLoading === `resend-${detail.id}`}
                    >
                      {actionLoading === `resend-${detail.id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MailCheck className="h-4 w-4" />
                      )}
                      Reenviar confirmación
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Skeleton className="h-40 w-full" />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => { if (!open) setPendingAction(null); }}
        title={pendingAction?.type === "confirm" ? "Confirmar turno" : "Cancelar turno"}
        description={
          pendingAction?.type === "confirm"
            ? "¿Estás seguro de que querés confirmar este turno?"
            : "¿Estás seguro de que querés cancelar este turno? Se notificará al paciente."
        }
        confirmLabel={pendingAction?.type === "confirm" ? "Sí, confirmar" : "Sí, cancelar"}
        variant={pendingAction?.type === "confirm" ? "default" : "destructive"}
        onConfirm={executePendingAction}
      />
    </div>
    </ViewGuard>
  );
}
