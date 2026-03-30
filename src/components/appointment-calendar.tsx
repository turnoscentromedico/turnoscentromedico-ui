"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput, EventClickArg, DatesSetArg, EventHoveringArg } from "@fullcalendar/core";
import { createPortal } from "react-dom";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Calendar as CalendarIcon,
  LayoutGrid,
  Clock,
  User,
  Building2,
  Stethoscope,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppointments } from "@/hooks/use-appointments";
import { useCalendarSettings } from "@/hooks/use-settings";
import { apiClient } from "@/lib/api";
import type { Appointment, AvailableSlot } from "@/types";

interface AppointmentCalendarProps {
  clinicId: number;
  doctorId?: number;
  specialtyId?: number;
  doctorName?: string;
  clinicName?: string;
  onSlotSelect?: (slot: AvailableSlot) => void;
  onDeselect?: () => void;
  onNext?: () => void;
  selectedSlot?: AvailableSlot | null;
}

interface TooltipState {
  slot: AvailableSlot;
  anchorEl: HTMLElement;
  selected: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PENDING: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
  CONFIRMED: { bg: "#dcfce7", border: "#22c55e", text: "#166534" },
  CANCELLED: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" },
  COMPLETED: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
  NO_SHOW: { bg: "#f3f4f6", border: "#9ca3af", text: "#374151" },
};

const STATUS_COLORS_DARK: Record<string, { bg: string; border: string; text: string }> = {
  PENDING: { bg: "#78350f", border: "#f59e0b", text: "#fde68a" },
  CONFIRMED: { bg: "#14532d", border: "#22c55e", text: "#bbf7d0" },
  CANCELLED: { bg: "#7f1d1d", border: "#ef4444", text: "#fecaca" },
  COMPLETED: { bg: "#1e3a5f", border: "#3b82f6", text: "#bfdbfe" },
  NO_SHOW: { bg: "#374151", border: "#9ca3af", text: "#d1d5db" },
};

const SELECTED_COLOR = { bg: "#7c3aed", border: "#7c3aed", text: "#ffffff" };

const DOCTOR_PALETTE = [
  { bg: "#dbeafe", border: "#3b82f6", text: "#1e3a8a", bgDark: "#1e3a5f", borderDark: "#60a5fa", textDark: "#bfdbfe" },
  { bg: "#fce7f3", border: "#ec4899", text: "#831843", bgDark: "#500724", borderDark: "#f472b6", textDark: "#fbcfe8" },
  { bg: "#ffedd5", border: "#f97316", text: "#7c2d12", bgDark: "#431407", borderDark: "#fb923c", textDark: "#fed7aa" },
  { bg: "#cffafe", border: "#06b6d4", text: "#164e63", bgDark: "#083344", borderDark: "#22d3ee", textDark: "#a5f3fc" },
  { bg: "#ede9fe", border: "#8b5cf6", text: "#3b0764", bgDark: "#2e1065", borderDark: "#a78bfa", textDark: "#ddd6fe" },
  { bg: "#ecfccb", border: "#84cc16", text: "#365314", bgDark: "#1a2e05", borderDark: "#a3e635", textDark: "#d9f99d" },
  { bg: "#fee2e2", border: "#ef4444", text: "#7f1d1d", bgDark: "#450a0a", borderDark: "#f87171", textDark: "#fecaca" },
  { bg: "#ccfbf1", border: "#14b8a6", text: "#134e4a", bgDark: "#042f2e", borderDark: "#2dd4bf", textDark: "#99f6e4" },
];

function getDoctorColor(doctorId: number, doctorIds: number[], isDark: boolean) {
  const idx = doctorIds.indexOf(doctorId) % DOCTOR_PALETTE.length;
  const p = DOCTOR_PALETTE[idx >= 0 ? idx : 0];
  return isDark
    ? { bg: p.bgDark, border: p.borderDark, text: p.textDark }
    : { bg: p.bg, border: p.border, text: p.text };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
  NO_SHOW: "No asistió",
};

export function AppointmentCalendar({
  clinicId,
  doctorId,
  specialtyId,
  doctorName,
  clinicName,
  onSlotSelect,
  onDeselect,
  onNext,
  selectedSlot,
}: AppointmentCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState<"timeGridDay" | "timeGridWeek" | "dayGridMonth">("timeGridWeek");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date } | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const calSettings = useCalendarSettings();

  const [hoverTooltip, setHoverTooltip] = useState<TooltipState | null>(null);
  const [selectedTooltip, setSelectedTooltip] = useState<TooltipState | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMultiDoctor = !doctorId && !!specialtyId;

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains("dark"));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const { data: appointmentsData, isLoading: appointmentsLoading } = useAppointments(
    doctorId ? { clinicId, doctorId, pageSize: 100 } : undefined,
  );
  const appointments = appointmentsData?.data;

  const fetchAvailableSlots = useCallback(async (start: Date, end: Date) => {
    if (!clinicId || (!doctorId && !specialtyId)) return;
    setLoadingSlots(true);
    try {
      const slots = await apiClient.getAvailableSlotsRange({
        clinicId,
        doctorId,
        specialtyId,
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      });
      setAvailableSlots(slots);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [clinicId, doctorId, specialtyId]);

  useEffect(() => {
    if (visibleRange) {
      fetchAvailableSlots(visibleRange.start, visibleRange.end);
    }
  }, [visibleRange, fetchAvailableSlots]);

  const uniqueDoctorIds = useMemo(() => {
    const ids = [...new Set(availableSlots.map((s) => s.doctorId))];
    ids.sort((a, b) => a - b);
    return ids;
  }, [availableSlots]);

  const doctorNameMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of availableSlots) {
      if (!map.has(s.doctorId)) map.set(s.doctorId, s.doctorName);
    }
    return map;
  }, [availableSlots]);

  const appointmentEvents: EventInput[] = useMemo(() => {
    if (!appointments) return [];
    return appointments
      .filter((a) => a.status !== "CANCELLED")
      .map((a) => {
        const colors = isDark
          ? STATUS_COLORS_DARK[a.status] ?? STATUS_COLORS_DARK.PENDING
          : STATUS_COLORS[a.status] ?? STATUS_COLORS.PENDING;
        const startDateTime = a.startTime
          ? `${a.date}T${a.startTime}`
          : a.date;
        const endDateTime = a.endTime
          ? `${a.date}T${a.endTime}`
          : a.startTime
            ? `${a.date}T${addMinutesStr(a.startTime, 30)}`
            : undefined;

        return {
          id: `apt-${a.id}`,
          title: `${a.patient.firstName} ${a.patient.lastName}`,
          start: startDateTime,
          end: endDateTime,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
          extendedProps: {
            type: "appointment",
            appointment: a,
          },
        };
      });
  }, [appointments, isDark]);

  const availableEvents: EventInput[] = useMemo(() => {
    const now = new Date();
    return availableSlots
      .filter((slot) => new Date(`${slot.date}T${slot.startTime}`) > now)
      .map((slot, i) => {
        const isSelected =
          selectedSlot?.date === slot.date &&
          selectedSlot?.startTime === slot.startTime &&
          selectedSlot?.doctorId === slot.doctorId;

        const colors = isSelected
          ? SELECTED_COLOR
          : getDoctorColor(slot.doctorId, uniqueDoctorIds, isDark);

        return {
          id: `slot-${i}-${slot.date}-${slot.startTime}-${slot.doctorId}`,
          title: isSelected
            ? "Seleccionado"
            : isMultiDoctor
              ? slot.doctorName
              : "Disponible",
          start: `${slot.date}T${slot.startTime}`,
          end: `${slot.date}T${slot.endTime}`,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
          classNames: isSelected ? ["fc-selected-slot"] : ["fc-available-slot"],
          extendedProps: { type: "available", slot },
        };
      });
  }, [availableSlots, selectedSlot, isDark, uniqueDoctorIds, isMultiDoctor]);

  const todayPastBgEvent: EventInput | null = useMemo(() => {
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
    () => [...appointmentEvents, ...availableEvents, ...(todayPastBgEvent ? [todayPastBgEvent] : [])],
    [appointmentEvents, availableEvents, todayPastBgEvent],
  );

  function handleEventClick(info: EventClickArg) {
    const { type, slot } = info.event.extendedProps;
    if (type === "available" && slot) {
      const s = slot as AvailableSlot;
      onSlotSelect?.(s);
      setHoverTooltip(null);
      setSelectedTooltip({ slot: s, anchorEl: info.el as HTMLElement, selected: true });
    }
  }

  function handleEventMouseEnter(info: EventHoveringArg) {
    const { type, slot } = info.event.extendedProps;
    if (type !== "available" || !slot) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const s = slot as AvailableSlot;
    const isAlreadySelected =
      selectedSlot?.date === s.date &&
      selectedSlot?.startTime === s.startTime &&
      selectedSlot?.doctorId === s.doctorId;
    if (isAlreadySelected) return;
    setHoverTooltip({ slot: s, anchorEl: info.el as HTMLElement, selected: false });
  }

  function handleEventMouseLeave() {
    hoverTimeoutRef.current = setTimeout(() => setHoverTooltip(null), 150);
  }

  useEffect(() => {
    if (!selectedSlot) {
      setSelectedTooltip(null);
      return;
    }
    if (selectedTooltip && (
      selectedTooltip.slot.date !== selectedSlot.date ||
      selectedTooltip.slot.startTime !== selectedSlot.startTime ||
      selectedTooltip.slot.doctorId !== selectedSlot.doctorId
    )) {
      setSelectedTooltip(null);
    }
  }, [selectedSlot, selectedTooltip]);

  function handleDatesSet(info: DatesSetArg) {
    setVisibleRange({ start: info.start, end: info.end });
    setCurrentDate(info.start);
    setHoverTooltip(null);
    setSelectedTooltip(null);
  }

  function changeView(view: "timeGridDay" | "timeGridWeek" | "dayGridMonth") {
    setCurrentView(view);
    calendarRef.current?.getApi().changeView(view);
    setHoverTooltip(null);
    setSelectedTooltip(null);
  }

  function goToday() {
    calendarRef.current?.getApi().today();
  }
  function goPrev() {
    calendarRef.current?.getApi().prev();
  }
  function goNext() {
    calendarRef.current?.getApi().next();
  }

  const calendarTitle = calendarRef.current?.getApi().view.title ?? format(currentDate, "MMMM yyyy", { locale: es });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border p-0.5">
            <Button variant="ghost" size="icon-sm" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToday} className="text-xs font-medium">
              Hoy
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={goNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h3 className="text-lg font-semibold capitalize">{calendarTitle}</h3>
          {loadingSlots && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Cargando slots...
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(doctorName || clinicName) && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground mr-2">
              {clinicName && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {clinicName}
                </span>
              )}
              {doctorName && (
                <span className="flex items-center gap-1">
                  <Stethoscope className="h-3 w-3" />
                  {doctorName}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center rounded-lg border p-0.5">
            <Button
              variant={currentView === "timeGridDay" ? "default" : "ghost"}
              size="sm"
              onClick={() => changeView("timeGridDay")}
              className="text-xs gap-1.5"
            >
              <Clock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Día</span>
            </Button>
            <Button
              variant={currentView === "timeGridWeek" ? "default" : "ghost"}
              size="sm"
              onClick={() => changeView("timeGridWeek")}
              className="text-xs gap-1.5"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Semana</span>
            </Button>
            <Button
              variant={currentView === "dayGridMonth" ? "default" : "ghost"}
              size="sm"
              onClick={() => changeView("dayGridMonth")}
              className="text-xs gap-1.5"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mes</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Legend: status */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border-2 border-violet-600 bg-violet-600" />
          <span className="text-muted-foreground">Seleccionado</span>
        </div>
        {!isMultiDoctor && (
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm border-2 border-blue-500 bg-blue-50 dark:bg-blue-950" />
            <span className="text-muted-foreground">Disponible</span>
          </div>
        )}
        {doctorId && (
          <>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm border-2 border-amber-500 bg-amber-50 dark:bg-amber-950" />
              <span className="text-muted-foreground">Pendiente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm border-2 border-green-500 bg-green-50 dark:bg-green-950" />
              <span className="text-muted-foreground">Confirmado</span>
            </div>
          </>
        )}
      </div>

      {/* Legend: doctors (multi-doctor mode) */}
      {isMultiDoctor && uniqueDoctorIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-muted-foreground font-medium">Médicos:</span>
          {uniqueDoctorIds.map((dId) => {
            const color = getDoctorColor(dId, uniqueDoctorIds, isDark);
            const name = doctorNameMap.get(dId) ?? `Doctor ${dId}`;
            return (
              <div key={dId} className="flex items-center gap-1.5">
                <div
                  className="h-3 w-3 rounded-sm border-2"
                  style={{ borderColor: color.border, backgroundColor: color.bg }}
                />
                <span className="text-muted-foreground">Dr. {name}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar */}
      <div className="appointment-calendar rounded-xl border bg-card overflow-hidden">
        {appointmentsLoading && doctorId ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={currentView}
            locale="es"
            firstDay={1}
            headerToolbar={false}
            height="auto"
            contentHeight={600}
            events={allEvents}
            eventClick={handleEventClick}
            eventMouseEnter={handleEventMouseEnter}
            eventMouseLeave={handleEventMouseLeave}
            datesSet={handleDatesSet}
            slotMinTime={calSettings.slotMinTime}
            slotMaxTime={calSettings.slotMaxTime}
            scrollTime={calSettings.scrollTime}
            slotDuration="00:30:00"
            slotLabelInterval="01:00:00"
            slotLabelFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            dayHeaderFormat={{
              weekday: "short",
              day: "numeric",
              month: "short",
            }}
            allDaySlot={false}
            nowIndicator
            eventDisplay="block"
            eventTimeFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            eventContent={(arg) => {
              const { type, appointment, slot } = arg.event.extendedProps;
              if (type === "available") {
                const s = slot as AvailableSlot;
                return (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 cursor-pointer transition-opacity hover:opacity-80">
                    <CalendarIcon className="h-3 w-3 shrink-0" />
                    <span className="text-[11px] font-medium truncate">
                      {arg.timeText}
                      {isMultiDoctor ? ` — Dr. ${s.doctorName}` : ` — ${arg.event.title}`}
                    </span>
                  </div>
                );
              }
              if (type === "appointment") {
                const apt = appointment as Appointment;
                return (
                  <div className="px-1.5 py-0.5 overflow-hidden">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="text-[11px] font-semibold truncate">
                        {apt.patient.firstName} {apt.patient.lastName}
                      </span>
                    </div>
                    <span className="text-[10px] opacity-80 truncate block">
                      {arg.timeText}
                      {apt.specialty ? ` · ${apt.specialty.name}` : ""}
                    </span>
                  </div>
                );
              }
              return <span className="text-[11px] px-1">{arg.event.title}</span>;
            }}
          />
        )}
      </div>

      {/* Selected slot detail */}
      {selectedSlot && (
        <Card className="border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/30">
          <CardContent className="flex items-center gap-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Turno seleccionado</p>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(selectedSlot.date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                {" · "}
                {selectedSlot.startTime} — {selectedSlot.endTime}
                {" · Dr. "}
                {selectedSlot.doctorName}
                {selectedSlot.specialtyName ? ` · ${selectedSlot.specialtyName}` : ""}
              </p>
            </div>
            <Badge variant="default" className="bg-violet-600 hover:bg-violet-700">
              Seleccionado
            </Badge>
          </CardContent>
        </Card>
      )}

      <SlotTooltip
        state={selectedTooltip ?? hoverTooltip}
        onNext={onNext}
        onDismiss={() => {
          setSelectedTooltip(null);
          onDeselect?.();
        }}
        onMouseEnter={() => {
          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        }}
        onMouseLeave={() => setHoverTooltip(null)}
      />
    </div>
  );
}

function useAnchorRect(anchorEl: HTMLElement | null) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!anchorEl) { setRect(null); return; }

    function update() {
      setRect(anchorEl!.getBoundingClientRect());
    }
    update();

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [anchorEl]);

  return rect;
}

function SlotTooltip({
  state,
  onNext,
  onDismiss,
  onMouseEnter,
  onMouseLeave,
}: {
  state: TooltipState | null;
  onNext?: () => void;
  onDismiss?: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rect = useAnchorRect(state?.anchorEl ?? null);

  useEffect(() => {
    if (!state?.selected) return;

    function handleClickOutside(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onDismiss?.();
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [state?.selected, onDismiss]);

  if (!state || !rect) return null;

  const { slot, selected } = state;
  const tooltipWidth = 280;
  const gap = 8;

  let left = rect.left + rect.width / 2 - tooltipWidth / 2;
  if (left < 8) left = 8;
  if (left + tooltipWidth > window.innerWidth - 8) left = window.innerWidth - tooltipWidth - 8;

  const fitsAbove = rect.top - gap - 10 > 0;
  const top = fitsAbove ? rect.top - gap : rect.bottom + gap;
  const arrowSide = fitsAbove ? "bottom" : "top";

  return createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-[9999] animate-in fade-in-0 zoom-in-95 duration-150"
      style={{ top, left, width: tooltipWidth, transform: fitsAbove ? "translateY(-100%)" : undefined }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="rounded-lg border bg-popover text-popover-foreground shadow-lg p-3 relative">
        {/* Arrow */}
        <div
          className="absolute w-2.5 h-2.5 rotate-45 border bg-popover"
          style={{
            left: "50%",
            marginLeft: -5,
            ...(arrowSide === "bottom"
              ? { bottom: -5, borderTop: 0, borderLeft: 0 }
              : { top: -5, borderBottom: 0, borderRight: 0 }),
          }}
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">
              {selected ? "Turno seleccionado" : "Turno disponible"}
            </span>
            {selected && (
              <Badge variant="default" className="bg-violet-600 text-[10px] px-1.5 py-0 h-5">
                Seleccionado
              </Badge>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-0.5">
            <p className="flex items-center gap-1.5">
              <Stethoscope className="h-3 w-3 shrink-0" />
              Dr. {slot.doctorName} — {slot.specialtyName}
            </p>
            <p className="flex items-center gap-1.5">
              <CalendarIcon className="h-3 w-3 shrink-0" />
              {format(parseISO(slot.date), "EEE d MMM yyyy", { locale: es })}
            </p>
            <p className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 shrink-0" />
              {slot.startTime} — {slot.endTime}
            </p>
          </div>

          {selected && onNext && (
            <Button size="sm" className="w-full mt-2" onClick={onNext}>
              Siguiente
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function addMinutesStr(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
