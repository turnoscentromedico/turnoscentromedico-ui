"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  Eye,
  Loader2,
  MailCheck,
  Stethoscope,
  Tag,
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
import { SetupBanner } from "@/components/setup-banner";
import { DataTablePagination } from "@/components/data-table-pagination";
import { usePageSize } from "@/hooks/use-page-size";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PatientLink } from "@/components/patient-link";
import { ViewGuard } from "@/components/view-guard";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-2xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
  NO_SHOW: "No asistió",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  NO_SHOW: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function DashboardPage() {
  const { data: me, isLoading: meLoading } = useMe();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

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

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Resumen general del sistema de turnos"
            : "Panel de operaciones"}
        </p>
      </div>

      {!isAdmin && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
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
                    className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5"
                  >
                    <Building2 className="h-4 w-4 text-primary" />
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

      {isAdmin && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard title="Clínicas" value={stats?.clinics ?? 0} icon={Building2} loading={statsLoading} />
            <StatCard title="Doctores" value={stats?.doctors ?? 0} icon={Stethoscope} loading={statsLoading} />
            <StatCard title="Pacientes" value={stats?.patients ?? 0} icon={UsersRound} loading={statsLoading} />
            <StatCard title="Especialidades" value={stats?.specialties ?? 0} icon={Tag} loading={statsLoading} />
            <StatCard title="Usuarios" value={stats?.users ?? 0} icon={Users} loading={statsLoading} />
            <StatCard title="Total Turnos" value={stats?.appointments.total ?? 0} icon={CalendarCheck} loading={statsLoading} />
          </div>

          {stats?.appointments.byStatus &&
            Object.keys(stats.appointments.byStatus).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Turnos por estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(stats.appointments.byStatus).map(
                      ([status, count]) => (
                        <div
                          key={status}
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${statusColors[status] ?? "bg-muted"}`}
                        >
                          <span>{statusLabels[status] ?? status}</span>
                          <span className="font-bold">{count}</span>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
        </>
      )}

      {/* ── Today's appointments ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Turnos de hoy
            {todayTotal > 0 && (
              <Badge variant="secondary" className="ml-1">
                {todayTotal}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : todayAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay turnos programados para hoy
              {!isAdmin && assignedClinics.length > 0
                ? ` en ${assignedClinics.length === 1 ? "tu clínica" : "tus clínicas"}`
                : ""}
            </p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      <PatientLink patientId={apt.patient.id} firstName={apt.patient.firstName} lastName={apt.patient.lastName} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dr. {apt.doctor.lastName}, {apt.doctor.firstName} —{" "}
                      {apt.clinic.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {apt.startTime
                        ? apt.endTime
                          ? `${apt.startTime} — ${apt.endTime}`
                          : apt.startTime
                        : format(new Date(apt.date), "HH:mm", { locale: es })}
                    </span>
                    <Badge
                      variant="outline"
                      className={statusColors[apt.status]}
                    >
                      {statusLabels[apt.status] ?? apt.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-pointer"
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

      {/* ── Detail dialog ── */}
      <Dialog open={detailId !== null} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del Turno</DialogTitle>
          </DialogHeader>
          {detail ? (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground">Paciente</p>
                  <p className="font-medium">
                    <PatientLink patientId={detail.patient.id} firstName={detail.patient.firstName} lastName={detail.patient.lastName} />
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Doctor</p>
                  <p className="font-medium">{detail.doctor.firstName} {detail.doctor.lastName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Clínica</p>
                  <p className="font-medium">{detail.clinic.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Especialidad</p>
                  <p className="font-medium">{detail.specialty?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {format(new Date(detail.date), "dd/MM/yyyy", { locale: es })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hora</p>
                  <p className="font-medium">
                    {detail.startTime
                      ? detail.endTime
                        ? `${detail.startTime} — ${detail.endTime}`
                        : detail.startTime
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado</p>
                  <Badge variant="outline" className={statusColors[detail.status]}>
                    {statusLabels[detail.status] ?? detail.status}
                  </Badge>
                </div>
                {detail.patient.email && (
                  <div>
                    <p className="text-muted-foreground">Email paciente</p>
                    <p className="font-medium">{detail.patient.email}</p>
                  </div>
                )}
              </div>
              {detail.notes && (
                <div>
                  <p className="text-muted-foreground">Notas</p>
                  <p>{detail.notes}</p>
                </div>
              )}

              {detail.status !== "CANCELLED" && detail.status !== "COMPLETED" && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {detail.status === "PENDING" && (
                    <Button
                      size="sm"
                      className="gap-1.5 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
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
