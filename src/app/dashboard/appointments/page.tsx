"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput, EventClickArg, DatesSetArg } from "@fullcalendar/core";
import {
  CalendarCheck,
  CalendarDays,
  Plus,
  Eye,
  XCircle,
  CheckCircle2,
  Search,
  List,
  Clock,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  User,
  Stethoscope,
  Building2,
  Loader2,
  MailCheck,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/data-table-pagination";
import {
  useAppointments,
  useAppointment,
  useConfirmAppointment,
  useCancelAppointment,
  useResendConfirmation,
} from "@/hooks/use-appointments";
import { useClinics } from "@/hooks/use-clinics";
import { useDoctors } from "@/hooks/use-doctors";
import { useMe } from "@/hooks/use-role";
import { apiClient } from "@/lib/api";
import { useCalendarSettings } from "@/hooks/use-settings";
import { usePageSize } from "@/hooks/use-page-size";
import { SortableHeader, type SortState } from "@/components/sortable-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Appointment, AvailableSlot } from "@/types";

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

const EVENT_STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PENDING: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
  CONFIRMED: { bg: "#dcfce7", border: "#22c55e", text: "#166534" },
  CANCELLED: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" },
  COMPLETED: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
  NO_SHOW: { bg: "#f3f4f6", border: "#9ca3af", text: "#374151" },
};

const EVENT_STATUS_COLORS_DARK: Record<string, { bg: string; border: string; text: string }> = {
  PENDING: { bg: "#78350f", border: "#f59e0b", text: "#fde68a" },
  CONFIRMED: { bg: "#14532d", border: "#22c55e", text: "#bbf7d0" },
  CANCELLED: { bg: "#7f1d1d", border: "#ef4444", text: "#fecaca" },
  COMPLETED: { bg: "#1e3a5f", border: "#3b82f6", text: "#bfdbfe" },
  NO_SHOW: { bg: "#374151", border: "#9ca3af", text: "#d1d5db" },
};

const AVAILABLE_COLOR = { bg: "#f0fdf4", border: "#86efac", text: "#166534" };
const AVAILABLE_COLOR_DARK = { bg: "#052e16", border: "#22c55e", text: "#bbf7d0" };

function addMinutesStr(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function AppointmentsPage() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [filterClinic, setFilterClinic] = useState<number | undefined>();
  const [filterDoctor, setFilterDoctor] = useState<number | undefined>();
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [slotModalData, setSlotModalData] = useState<{
    appointments: Appointment[];
    time: string;
    date: string;
  } | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize("appointments");
  const [sort, setSort] = useState<SortState>({ sortBy: null, sortOrder: null });

  const { data: appointmentsData, isLoading } = useAppointments({
    clinicId: filterClinic,
    doctorId: filterDoctor,
    page,
    pageSize,
    sortBy: sort.sortBy ?? undefined,
    sortOrder: sort.sortOrder ?? undefined,
  });
  const appointments = appointmentsData?.data ?? [];
  const totalAppointments = appointmentsData?.total ?? 0;
  const { data: me } = useMe();
  const { data: allClinicsData } = useClinics({ pageSize: 100 });
  const allClinics = allClinicsData?.data;
  const clinics = useMemo(() => {
    if (!allClinics) return undefined;
    if (me?.role === "ADMIN") return allClinics;
    if (me?.clinicIds?.length) {
      return allClinics.filter((c) => me.clinicIds.includes(c.id));
    }
    return allClinics;
  }, [allClinics, me]);
  const { data: doctorsData } = useDoctors({ pageSize: 100 });
  const doctors = doctorsData?.data;
  const confirmAppointment = useConfirmAppointment();
  const cancelAppointment = useCancelAppointment();
  const resendConfirmation = useResendConfirmation();
  const [resendingId, setResendingId] = useState<number | null>(null);
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
      setConfirmingId(id);
      confirmAppointment.mutate(id, { onSettled: () => setConfirmingId(null) });
    } else {
      setCancellingId(id);
      cancelAppointment.mutate(id, { onSettled: () => setCancellingId(null) });
    }
  }

  function handleResend(id: number) {
    setResendingId(id);
    resendConfirmation.mutate(id, { onSettled: () => setResendingId(null) });
  }
  const { data: detail } = useAppointment(detailId ?? 0);

  const filtered = useMemo(() => {
    if (!search.trim()) return appointments;
    const q = search.toLowerCase();
    return appointments.filter(
      (a) =>
        a.patient.firstName.toLowerCase().includes(q) ||
        a.patient.lastName.toLowerCase().includes(q) ||
        `${a.doctor.firstName} ${a.doctor.lastName}`.toLowerCase().includes(q)
    );
  }, [appointments, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Turnos</h1>
          <p className="text-muted-foreground">Gestión de turnos y citas</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border p-0.5">
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="text-xs gap-1.5"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </Button>
            <Button
              variant={view === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("calendar")}
              className="text-xs gap-1.5"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Calendario</span>
            </Button>
          </div>
          <Link
            href="/dashboard/appointments/new"
            className={cn(buttonVariants())}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Turno
          </Link>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {view === "list" && (
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente o doctor..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
        )}
        <Select
          value={filterClinic ? String(filterClinic) : ""}
          onValueChange={(val) => {
            setFilterClinic(val ? Number(val) : undefined);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            {filterClinic
              ? clinics?.find((c) => c.id === filterClinic)?.name ?? "Todas las clínicas"
              : <SelectValue placeholder="Todas las clínicas" />}
          </SelectTrigger>
          <SelectContent>
            {clinics?.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterDoctor ? String(filterDoctor) : ""}
          onValueChange={(val) => {
            setFilterDoctor(val ? Number(val) : undefined);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            {filterDoctor
              ? (() => { const d = doctors?.find((d) => d.id === filterDoctor); return d ? `${d.lastName}, ${d.firstName}` : "Todos los doctores"; })()
              : <SelectValue placeholder="Todos los doctores" />}
          </SelectTrigger>
          <SelectContent>
            {doctors?.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.lastName}, {d.firstName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterClinic || filterDoctor || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterClinic(undefined);
              setFilterDoctor(undefined);
              setSearch("");
              setPage(1);
            }}
          >
            Limpiar
          </Button>
        )}
      </div>

      {view === "list" ? (
        <ListViewCard
          appointments={filtered}
          isLoading={isLoading}
          onDetail={setDetailId}
          onConfirm={requestConfirm}
          confirmingId={confirmingId}
          onCancel={requestCancel}
          cancellingId={cancellingId}
          total={totalAppointments}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          sort={sort}
          onSort={setSort}
        />
      ) : (
        <CalendarView
          appointments={appointments}
          isLoading={isLoading}
          filterClinic={filterClinic}
          filterDoctor={filterDoctor}
          onDetail={setDetailId}
          onSlotModal={setSlotModalData}
        />
      )}

      {/* Detail dialog */}
      <Dialog
        open={detailId !== null}
        onOpenChange={(o) => !o && setDetailId(null)}
      >
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
                    {detail.patient.firstName} {detail.patient.lastName}
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
                      onClick={() => {
                        setDetailId(null);
                        requestConfirm(detail.id);
                      }}
                      disabled={confirmingId === detail.id}
                    >
                      {confirmingId === detail.id ? (
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
                    onClick={() => {
                      setDetailId(null);
                      requestCancel(detail.id);
                    }}
                    disabled={cancellingId === detail.id}
                  >
                    {cancellingId === detail.id ? (
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
                      disabled={resendingId === detail.id}
                    >
                      {resendingId === detail.id ? (
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

      {/* Slot detail modal (multiple patients in same time) */}
      <Dialog
        open={slotModalData !== null}
        onOpenChange={(o) => !o && setSlotModalData(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Turnos — {slotModalData?.date && format(parseISO(slotModalData.date), "EEEE d 'de' MMMM", { locale: es })}{" "}
              a las {slotModalData?.time}
            </DialogTitle>
          </DialogHeader>
          {slotModalData && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {slotModalData.appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No hay turnos en este horario
                </p>
              ) : (
                slotModalData.appointments.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-lg border p-3 space-y-1.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {a.patient.firstName} {a.patient.lastName}
                        </span>
                      </div>
                      <Badge variant="outline" className={cn("text-xs", statusColors[a.status])}>
                        {statusLabels[a.status] ?? a.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Stethoscope className="h-3 w-3" />
                        Dr. {a.doctor.firstName} {a.doctor.lastName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {a.clinic.name}
                      </span>
                      {a.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {a.startTime}{a.endTime ? ` — ${a.endTime}` : ""}
                        </span>
                      )}
                    </div>
                    {a.notes && (
                      <p className="text-xs text-muted-foreground italic pl-6">{a.notes}</p>
                    )}
                    <div className="flex gap-1 pl-6 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 cursor-pointer"
                        onClick={() => {
                          setSlotModalData(null);
                          setDetailId(a.id);
                        }}
                      >
                        <Eye className="h-3 w-3" /> Ver detalle
                      </Button>
                      {a.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-green-600 hover:text-green-700 cursor-pointer"
                          onClick={() => { setSlotModalData(null); requestConfirm(a.id); }}
                          disabled={confirmingId === a.id}
                        >
                          {confirmingId === a.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          Confirmar
                        </Button>
                      )}
                      {a.status !== "CANCELLED" && a.status !== "COMPLETED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-destructive hover:text-destructive cursor-pointer"
                          onClick={() => { setSlotModalData(null); requestCancel(a.id); }}
                          disabled={cancellingId === a.id}
                        >
                          {cancellingId === a.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
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
  );
}

/* ───────────────────── List View ───────────────────── */

function ListViewCard({
  appointments,
  isLoading,
  onDetail,
  onConfirm,
  confirmingId,
  onCancel,
  cancellingId,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sort,
  onSort,
}: {
  appointments: Appointment[];
  isLoading: boolean;
  onDetail: (id: number) => void;
  onConfirm: (id: number) => void;
  confirmingId: number | null;
  onCancel: (id: number) => void;
  cancellingId: number | null;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (ps: number) => void;
  sort: SortState;
  onSort: (s: SortState) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarCheck className="h-4 w-4" />
          Listado de turnos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !appointments.length ? (
          <p className="text-center py-8 text-muted-foreground">
            No hay turnos
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortableHeader label="Fecha" field="date" sort={sort} onSort={(s) => { onSort(s); onPageChange(1); }} /></TableHead>
                <TableHead><SortableHeader label="Hora" field="startTime" sort={sort} onSort={(s) => { onSort(s); onPageChange(1); }} /></TableHead>
                <TableHead><SortableHeader label="Paciente" field="patient.lastName" sort={sort} onSort={(s) => { onSort(s); onPageChange(1); }} /></TableHead>
                <TableHead><SortableHeader label="Doctor" field="doctor.lastName" sort={sort} onSort={(s) => { onSort(s); onPageChange(1); }} /></TableHead>
                <TableHead><SortableHeader label="Clínica" field="clinic.name" sort={sort} onSort={(s) => { onSort(s); onPageChange(1); }} /></TableHead>
                <TableHead><SortableHeader label="Estado" field="status" sort={sort} onSort={(s) => { onSort(s); onPageChange(1); }} /></TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    {format(new Date(a.date), "dd/MM/yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>
                    {a.startTime
                      ? a.endTime
                        ? `${a.startTime} — ${a.endTime}`
                        : a.startTime
                      : "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {a.patient.firstName} {a.patient.lastName}
                  </TableCell>
                  <TableCell>{a.doctor.lastName}, {a.doctor.firstName}</TableCell>
                  <TableCell>{a.clinic.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusColors[a.status]}
                    >
                      {statusLabels[a.status] ?? a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="cursor-pointer"
                        onClick={() => onDetail(a.id)}
                        title="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {a.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="cursor-pointer"
                          onClick={() => onConfirm(a.id)}
                          disabled={confirmingId === a.id}
                          title="Confirmar turno"
                        >
                          {confirmingId === a.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      )}
                      {a.status !== "CANCELLED" && a.status !== "COMPLETED" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="cursor-pointer"
                          onClick={() => onCancel(a.id)}
                          disabled={cancellingId === a.id}
                          title="Cancelar turno"
                        >
                          {cancellingId === a.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </CardContent>
    </Card>
  );
}

/* ───────────────────── Calendar View ───────────────────── */

function CalendarView({
  appointments,
  isLoading,
  filterClinic,
  filterDoctor,
  onDetail,
  onSlotModal,
}: {
  appointments: Appointment[];
  isLoading: boolean;
  filterClinic?: number;
  filterDoctor?: number;
  onDetail: (id: number) => void;
  onSlotModal: (data: { appointments: Appointment[]; time: string; date: string }) => void;
}) {
  const calendarRef = useRef<FullCalendar>(null);
  const [calendarView, setCalendarView] = useState<"timeGridDay" | "timeGridWeek" | "dayGridMonth">("timeGridWeek");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date } | null>(null);
  const [isDark, setIsDark] = useState(false);
  const calSettings = useCalendarSettings();

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const fetchSlots = useCallback(async (start: Date, end: Date) => {
    if (!filterClinic || !filterDoctor) {
      setAvailableSlots([]);
      return;
    }
    setLoadingSlots(true);
    try {
      const slots = await apiClient.getAvailableSlotsRange({
        clinicId: filterClinic,
        doctorId: filterDoctor,
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      });
      setAvailableSlots(slots);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [filterClinic, filterDoctor]);

  useEffect(() => {
    if (visibleRange) {
      fetchSlots(visibleRange.start, visibleRange.end);
    }
  }, [visibleRange, fetchSlots]);

  const appointmentsBySlot = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      if (a.status === "CANCELLED") continue;
      const timeKey = a.startTime ?? format(new Date(a.date), "HH:mm");
      const dateKey = format(new Date(a.date), "yyyy-MM-dd");
      const key = `${dateKey}-${timeKey}`;
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return map;
  }, [appointments]);

  const appointmentEvents: EventInput[] = useMemo(() => {
    const events: EventInput[] = [];
    for (const [key, group] of appointmentsBySlot) {
      const first = group[0];
      const dateStr = format(new Date(first.date), "yyyy-MM-dd");
      const timeStr = first.startTime ?? format(new Date(first.date), "HH:mm");
      const endStr = first.endTime ?? addMinutesStr(timeStr, 30);

      const colors = isDark
        ? EVENT_STATUS_COLORS_DARK[first.status] ?? EVENT_STATUS_COLORS_DARK.PENDING
        : EVENT_STATUS_COLORS[first.status] ?? EVENT_STATUS_COLORS.PENDING;

      const count = group.length;
      const title = count === 1
        ? `${first.patient.firstName} ${first.patient.lastName}`
        : `${count} turnos`;

      events.push({
        id: `grp-${key}`,
        title,
        start: `${dateStr}T${timeStr}`,
        end: `${dateStr}T${endStr}`,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        extendedProps: {
          type: "appointment-group",
          appointments: group,
          date: dateStr,
          time: timeStr,
          count,
        },
      });
    }
    return events;
  }, [appointmentsBySlot, isDark]);

  const slotEvents: EventInput[] = useMemo(() => {
    const avail = isDark ? AVAILABLE_COLOR_DARK : AVAILABLE_COLOR;
    const now = new Date();
    return availableSlots
      .filter((slot) => new Date(`${slot.date}T${slot.startTime}`) > now)
      .map((slot, i) => ({
        id: `avail-${i}-${slot.date}-${slot.startTime}`,
        title: `Libre — Dr. ${slot.doctorName}`,
        start: `${slot.date}T${slot.startTime}`,
        end: `${slot.date}T${slot.endTime}`,
        backgroundColor: avail.bg,
        borderColor: avail.border,
        textColor: avail.text,
        classNames: ["fc-available-slot"],
        extendedProps: { type: "available", slot },
      }));
  }, [availableSlots, isDark]);

  const todayPastBgEvent: EventInput = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const nowTime = format(now, "HH:mm");
    return {
      id: "past-hours-bg",
      start: `${todayStr}T00:00`,
      end: `${todayStr}T${nowTime}`,
      display: "background",
      classNames: ["fc-past-hours"],
    };
  }, []);

  const allEvents = useMemo(
    () => [...appointmentEvents, ...slotEvents, todayPastBgEvent],
    [appointmentEvents, slotEvents, todayPastBgEvent],
  );

  function handleEventClick(info: EventClickArg) {
    const ext = info.event.extendedProps;
    if (ext.type === "appointment-group") {
      const group = ext.appointments as Appointment[];
      if (group.length === 1) {
        onDetail(group[0].id);
      } else {
        onSlotModal({
          appointments: group,
          time: ext.time as string,
          date: ext.date as string,
        });
      }
    }
  }

  function handleDatesSet(info: DatesSetArg) {
    setVisibleRange({ start: info.start, end: info.end });
    setCurrentDate(info.start);
  }

  function changeView(v: "timeGridDay" | "timeGridWeek" | "dayGridMonth") {
    setCalendarView(v);
    calendarRef.current?.getApi().changeView(v);
  }

  const calendarTitle =
    calendarRef.current?.getApi().view.title ??
    format(currentDate, "MMMM yyyy", { locale: es });

  return (
    <div className="space-y-4">
      {/* Calendar toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border p-0.5">
            <Button variant="ghost" size="icon-sm" onClick={() => calendarRef.current?.getApi().prev()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => calendarRef.current?.getApi().today()} className="text-xs font-medium">
              Hoy
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => calendarRef.current?.getApi().next()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h3 className="text-lg font-semibold capitalize">{calendarTitle}</h3>
          {loadingSlots && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Cargando...
            </div>
          )}
        </div>
        <div className="flex items-center rounded-lg border p-0.5">
          <Button
            variant={calendarView === "timeGridDay" ? "default" : "ghost"}
            size="sm"
            onClick={() => changeView("timeGridDay")}
            className="text-xs gap-1.5"
          >
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Día</span>
          </Button>
          <Button
            variant={calendarView === "timeGridWeek" ? "default" : "ghost"}
            size="sm"
            onClick={() => changeView("timeGridWeek")}
            className="text-xs gap-1.5"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Semana</span>
          </Button>
          <Button
            variant={calendarView === "dayGridMonth" ? "default" : "ghost"}
            size="sm"
            onClick={() => changeView("dayGridMonth")}
            className="text-xs gap-1.5"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mes</span>
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {filterClinic && filterDoctor && (
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm border-2 border-green-400 bg-green-50 dark:bg-green-950" />
            <span className="text-muted-foreground">Disponible</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border-2 border-amber-500 bg-amber-50 dark:bg-amber-950" />
          <span className="text-muted-foreground">Pendiente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border-2 border-green-500 bg-green-100 dark:bg-green-950" />
          <span className="text-muted-foreground">Confirmado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border-2 border-blue-500 bg-blue-50 dark:bg-blue-950" />
          <span className="text-muted-foreground">Completado</span>
        </div>
        {!(filterClinic && filterDoctor) && (
          <span className="text-muted-foreground italic ml-2">
            Seleccioná clínica y doctor para ver slots disponibles
          </span>
        )}
      </div>

      {/* Calendar */}
      <div className="appointment-calendar rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={calendarView}
            locale="es"
            firstDay={1}
            headerToolbar={false}
            height="auto"
            contentHeight={650}
            events={allEvents}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            slotMinTime={calSettings.slotMinTime}
            slotMaxTime={calSettings.slotMaxTime}
            scrollTime={calSettings.scrollTime}
            slotDuration="00:30:00"
            slotLabelInterval="01:00:00"
            slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            dayHeaderFormat={{ weekday: "short", day: "numeric", month: "short" }}
            allDaySlot={false}
            nowIndicator
            eventDisplay="block"
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            eventContent={(arg) => {
              const ext = arg.event.extendedProps;

              if (ext.type === "available") {
                return (
                  <div className="px-1.5 py-0.5 opacity-60">
                    <span className="text-[11px] truncate block">{arg.event.title}</span>
                  </div>
                );
              }

              if (ext.type === "appointment-group") {
                const count = ext.count as number;
                const group = ext.appointments as Appointment[];
                const first = group[0];

                if (count === 1) {
                  return (
                    <div className="px-1.5 py-0.5 overflow-hidden cursor-pointer">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 shrink-0" />
                        <span className="text-[11px] font-semibold truncate">
                          {first.patient.firstName} {first.patient.lastName}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-80 truncate block">
                        {arg.timeText} · Dr. {first.doctor.lastName}
                        {first.specialty ? ` · ${first.specialty.name}` : ""}
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="px-1.5 py-0.5 overflow-hidden cursor-pointer">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="text-[11px] font-bold truncate">
                        {count} turnos
                      </span>
                    </div>
                    <span className="text-[10px] opacity-80 truncate block">
                      {arg.timeText} · Click para ver detalle
                    </span>
                  </div>
                );
              }

              return <span className="text-[11px] px-1">{arg.event.title}</span>;
            }}
          />
        )}
      </div>
    </div>
  );
}
