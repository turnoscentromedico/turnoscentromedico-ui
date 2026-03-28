"use client";

import { use, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ViewGuard } from "@/components/view-guard";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Trash2,
  Clock,
  Check,
  X,
  Loader2,
  Save,
  CalendarOff,
  Plus,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDoctor, useUpdateDoctor } from "@/hooks/use-doctors";
import { useClinics } from "@/hooks/use-clinics";
import { useSpecialties } from "@/hooks/use-specialties";
import {
  useDoctorSchedules,
  useBulkReplaceSchedules,
} from "@/hooks/use-schedules";
import {
  useDoctorUnavailabilities,
  useCreateUnavailability,
  useDeleteUnavailability,
} from "@/hooks/use-unavailabilities";
import { doctorSchema, type DoctorFormData } from "@/lib/schemas";
import type { Schedule } from "@/types";
import { toast } from "sonner";

const DAY_LABELS = [
  { short: "Dom", full: "Domingo", value: 0 },
  { short: "Lun", full: "Lunes", value: 1 },
  { short: "Mar", full: "Martes", value: 2 },
  { short: "Mié", full: "Miércoles", value: 3 },
  { short: "Jue", full: "Jueves", value: 4 },
  { short: "Vie", full: "Viernes", value: 5 },
  { short: "Sáb", full: "Sábado", value: 6 },
];

interface DayScheduleState {
  enabled: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
  lunchBreak: boolean;
  lunchBreakStart: string;
  lunchBreakEnd: string;
}

function buildInitialDays(schedules: Schedule[] | undefined): DayScheduleState[] {
  const days: DayScheduleState[] = Array.from({ length: 7 }, () => ({
    enabled: false,
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30,
    lunchBreak: false,
    lunchBreakStart: "13:00",
    lunchBreakEnd: "14:00",
  }));

  if (schedules) {
    for (const s of schedules) {
      if (s.dayOfWeek >= 0 && s.dayOfWeek <= 6) {
        const hasLunch = !!s.lunchBreakStart && !!s.lunchBreakEnd;
        days[s.dayOfWeek] = {
          enabled: s.active,
          startTime: s.startTime,
          endTime: s.endTime,
          slotDuration: s.slotDuration,
          lunchBreak: hasLunch,
          lunchBreakStart: s.lunchBreakStart ?? "13:00",
          lunchBreakEnd: s.lunchBreakEnd ?? "14:00",
        };
      }
    }
  }

  return days;
}

export default function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const doctorId = Number(id);
  const { data: doctor, isLoading: doctorLoading } = useDoctor(doctorId);
  const { data: schedules, isLoading: schedulesLoading } = useDoctorSchedules(doctorId);
  const { data: unavailabilities } = useDoctorUnavailabilities(doctorId);
  const { data: clinicsData } = useClinics({ pageSize: 100 });
  const clinics = clinicsData?.data;
  const { data: specialtiesData } = useSpecialties({ pageSize: 100 });
  const specialties = specialtiesData?.data;
  const updateDoctor = useUpdateDoctor();
  const bulkSchedules = useBulkReplaceSchedules(doctorId);
  const createUnavailability = useCreateUnavailability(doctorId);
  const deleteUnavailability = useDeleteUnavailability(doctorId);

  const [days, setDays] = useState<DayScheduleState[]>([]);
  const [schedulesDirty, setSchedulesDirty] = useState(false);
  const [globalLunch, setGlobalLunch] = useState(false);
  const [globalLunchStart, setGlobalLunchStart] = useState("13:00");
  const [globalLunchEnd, setGlobalLunchEnd] = useState("14:00");
  const [unavailDialogOpen, setUnavailDialogOpen] = useState(false);
  const [unavailDate, setUnavailDate] = useState("");
  const [unavailStartTime, setUnavailStartTime] = useState("");
  const [unavailEndTime, setUnavailEndTime] = useState("");
  const [unavailReason, setUnavailReason] = useState("");

  const form = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
  });

  useEffect(() => {
    if (doctor) {
      form.reset({
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        dni: doctor.dni,
        nationality: doctor.nationality ?? "",
        dateOfBirth: doctor.dateOfBirth ? doctor.dateOfBirth.substring(0, 10) : "",
        phone: doctor.phone ?? "",
        address: doctor.address ?? "",
        licenseNumber: doctor.licenseNumber,
        specialtyId: doctor.specialtyId,
        clinicId: doctor.clinicId,
      });
    }
  }, [doctor, form]);

  useEffect(() => {
    if (schedules) {
      const built = buildInitialDays(schedules);
      setDays(built);
      setSchedulesDirty(false);

      const anyLunch = built.some((d) => d.enabled && d.lunchBreak);
      setGlobalLunch(anyLunch);
      if (anyLunch) {
        const first = built.find((d) => d.enabled && d.lunchBreak);
        if (first) {
          setGlobalLunchStart(first.lunchBreakStart);
          setGlobalLunchEnd(first.lunchBreakEnd);
        }
      }
    }
  }, [schedules]);

  function updateDay(index: number, patch: Partial<DayScheduleState>) {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );
    setSchedulesDirty(true);
  }

  function handleGlobalLunchToggle(checked: boolean) {
    setGlobalLunch(checked);
    setDays((prev) =>
      prev.map((d) =>
        d.enabled
          ? {
              ...d,
              lunchBreak: checked,
              lunchBreakStart: checked ? globalLunchStart : d.lunchBreakStart,
              lunchBreakEnd: checked ? globalLunchEnd : d.lunchBreakEnd,
            }
          : d,
      ),
    );
    setSchedulesDirty(true);
  }

  function handleGlobalLunchTimeChange(start: string, end: string) {
    setGlobalLunchStart(start);
    setGlobalLunchEnd(end);
    setDays((prev) =>
      prev.map((d) =>
        d.enabled && d.lunchBreak
          ? { ...d, lunchBreakStart: start, lunchBreakEnd: end }
          : d,
      ),
    );
    setSchedulesDirty(true);
  }

  async function handleSaveInfo(data: DoctorFormData) {
    await updateDoctor.mutateAsync({ id: doctorId, data });
  }

  async function handleSaveSchedules() {
    const active = days
      .map((d, i) =>
        d.enabled
          ? {
              dayOfWeek: i,
              startTime: d.startTime,
              endTime: d.endTime,
              slotDuration: d.slotDuration,
              lunchBreakStart: d.lunchBreak ? d.lunchBreakStart : null,
              lunchBreakEnd: d.lunchBreak ? d.lunchBreakEnd : null,
              active: true,
            }
          : null,
      )
      .filter(Boolean) as {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      slotDuration: number;
      lunchBreakStart: string | null;
      lunchBreakEnd: string | null;
      active: boolean;
    }[];

    await bulkSchedules.mutateAsync({ schedules: active });
    setSchedulesDirty(false);
  }

  async function handleAddUnavailability() {
    if (!unavailDate) return;
    await createUnavailability.mutateAsync({
      doctorId,
      date: unavailDate,
      startTime: unavailStartTime || undefined,
      endTime: unavailEndTime || undefined,
      reason: unavailReason || undefined,
    });
    setUnavailDialogOpen(false);
    setUnavailDate("");
    setUnavailStartTime("");
    setUnavailEndTime("");
    setUnavailReason("");
  }

  if (doctorLoading || schedulesLoading) {
    return (
      <ViewGuard viewId="doctors">
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
      </ViewGuard>
    );
  }

  if (!doctor) {
    return <ViewGuard viewId="doctors"><p className="text-muted-foreground">Doctor no encontrado</p></ViewGuard>;
  }

  return (
    <ViewGuard viewId="doctors">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/doctors"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {doctor.firstName} {doctor.lastName}
          </h1>
          <p className="text-muted-foreground">
            {doctor.specialty?.name} — {doctor.clinic?.name}
          </p>
        </div>
      </div>

      {/* Section 1: Datos Personales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Datos del Profesional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSaveInfo)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input {...form.register("firstName")} />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input {...form.register("lastName")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>DNI</Label>
                <Input {...form.register("dni")} />
              </div>
              <div className="space-y-2">
                <Label>N° Matrícula</Label>
                <Input {...form.register("licenseNumber")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nacionalidad</Label>
                <Input {...form.register("nationality")} />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Nacimiento</Label>
                <Input type="date" {...form.register("dateOfBirth")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input {...form.register("phone")} />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input {...form.register("address")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Clínica</Label>
                <Select
                  value={form.watch("clinicId") ? String(form.watch("clinicId")) : ""}
                  onValueChange={(val) => form.setValue("clinicId", Number(val), { shouldValidate: true })}
                >
                  <SelectTrigger>
                    {form.watch("clinicId")
                      ? clinics?.find((c) => c.id === form.watch("clinicId"))?.name ?? "Seleccionar clínica"
                      : <SelectValue placeholder="Seleccionar clínica" />}
                  </SelectTrigger>
                  <SelectContent>
                    {clinics?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Especialidad</Label>
                <Select
                  value={form.watch("specialtyId") ? String(form.watch("specialtyId")) : ""}
                  onValueChange={(val) => form.setValue("specialtyId", Number(val), { shouldValidate: true })}
                >
                  <SelectTrigger>
                    {form.watch("specialtyId")
                      ? specialties?.find((s) => s.id === form.watch("specialtyId"))?.name ?? "Seleccionar especialidad"
                      : <SelectValue placeholder="Seleccionar especialidad" />}
                  </SelectTrigger>
                  <SelectContent>
                    {specialties?.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={updateDoctor.isPending}>
                {updateDoctor.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar Datos
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Section 2: Disponibilidad Semanal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Disponibilidad Semanal
            </CardTitle>
            {schedulesDirty && (
              <Badge variant="outline" className="text-orange-600 border-orange-400">
                Sin guardar
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Horario de almuerzo global */}
          <div
            className={cn(
              "flex flex-wrap items-center gap-4 rounded-lg border p-3 transition-colors",
              globalLunch
                ? "border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
                : "border-border bg-muted/30",
            )}
          >
            <Switch
              checked={globalLunch}
              onCheckedChange={handleGlobalLunchToggle}
            />
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-sm">Horario de almuerzo</span>
            </div>
            {globalLunch && (
              <div className="flex items-center gap-2 ml-auto">
                <Input
                  type="time"
                  value={globalLunchStart}
                  onChange={(e) =>
                    handleGlobalLunchTimeChange(e.target.value, globalLunchEnd)
                  }
                  className="w-[110px] text-sm"
                />
                <span className="text-muted-foreground text-sm">a</span>
                <Input
                  type="time"
                  value={globalLunchEnd}
                  onChange={(e) =>
                    handleGlobalLunchTimeChange(globalLunchStart, e.target.value)
                  }
                  className="w-[110px] text-sm"
                />
              </div>
            )}
          </div>

          <div className="border-b" />

          {days.map((day, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-3 transition-colors",
                day.enabled
                  ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                  : "border-border bg-muted/30 opacity-60",
              )}
            >
              <Switch
                checked={day.enabled}
                onCheckedChange={(checked: boolean) =>
                  updateDay(idx, { enabled: checked })
                }
              />
              <span className="w-24 font-medium text-sm">
                {DAY_LABELS[idx].full}
              </span>

              {day.enabled ? (
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={day.startTime}
                      onChange={(e) =>
                        updateDay(idx, { startTime: e.target.value })
                      }
                      className="w-[110px] text-sm"
                    />
                    <span className="text-muted-foreground text-sm">a</span>
                    <Input
                      type="time"
                      value={day.endTime}
                      onChange={(e) =>
                        updateDay(idx, { endTime: e.target.value })
                      }
                      className="w-[110px] text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">
                      Turno
                    </Label>
                    <Select
                      value={String(day.slotDuration)}
                      onValueChange={(val) =>
                        updateDay(idx, { slotDuration: Number(val) })
                      }
                    >
                      <SelectTrigger className="w-[90px] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="20">20 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No disponible
                </span>
              )}
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveSchedules}
              disabled={bulkSchedules.isPending || !schedulesDirty}
            >
              {bulkSchedules.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar Disponibilidad
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: No-Disponibilidades */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarOff className="h-4 w-4" />
              Excepciones / No Disponible
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUnavailDialogOpen(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!unavailabilities?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay excepciones cargadas. El doctor estará disponible según su
              horario semanal.
            </p>
          ) : (
            <div className="space-y-2">
              {unavailabilities.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900 dark:bg-red-950/20"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {format(new Date(u.date), "EEEE d 'de' MMMM, yyyy", {
                        locale: es,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {u.startTime && u.endTime
                        ? `${u.startTime} — ${u.endTime}`
                        : "Todo el día"}
                      {u.reason ? ` · ${u.reason}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteUnavailability.mutate(u.id)}
                    disabled={deleteUnavailability.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Agregar no-disponibilidad */}
      <Dialog open={unavailDialogOpen} onOpenChange={setUnavailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar No-Disponibilidad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={unavailDate}
                onChange={(e) => setUnavailDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora inicio (opcional)</Label>
                <Input
                  type="time"
                  value={unavailStartTime}
                  onChange={(e) => setUnavailStartTime(e.target.value)}
                  placeholder="Dejar vacío = todo el día"
                />
              </div>
              <div className="space-y-2">
                <Label>Hora fin (opcional)</Label>
                <Input
                  type="time"
                  value={unavailEndTime}
                  onChange={(e) => setUnavailEndTime(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Si dejás vacíos los horarios, el doctor no estará disponible todo
              el día.
            </p>
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                value={unavailReason}
                onChange={(e) => setUnavailReason(e.target.value)}
                placeholder="Ej: Vacaciones, congreso médico..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setUnavailDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddUnavailability}
                disabled={!unavailDate || createUnavailability.isPending}
              >
                {createUnavailability.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </ViewGuard>
  );
}
