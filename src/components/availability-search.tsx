"use client";

import { useCallback, useEffect, useState } from "react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  CalendarSearch,
  ChevronRight,
  Clock,
  Loader2,
  Sparkles,
  Stethoscope,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api";
import type { AvailableSlot } from "@/types";

interface AvailabilitySearchProps {
  clinicId: number;
  specialtyId?: number;
  doctorId?: number;
  onSlotSelect: (slot: AvailableSlot) => void;
  selectedSlot?: AvailableSlot | null;
}

interface GroupedSlots {
  doctorId: number;
  doctorName: string;
  specialtyName: string;
  slots: AvailableSlot[];
}

export function AvailabilitySearch({
  clinicId,
  specialtyId,
  doctorId,
  onSlotSelect,
  selectedSlot,
}: AvailabilitySearchProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [nearestSlot, setNearestSlot] = useState<AvailableSlot | null>(null);
  const [searchingNearest, setSearchingNearest] = useState(false);

  const fetchSlots = useCallback(async (date: Date) => {
    setLoading(true);
    setSearched(true);
    setNearestSlot(null);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      let result: AvailableSlot[];

      if (doctorId) {
        result = await apiClient.getAvailableSlots({
          clinicId,
          doctorId,
          date: dateStr,
        });
      } else if (specialtyId) {
        result = await apiClient.getAvailableSlotsBySpecialty({
          clinicId,
          specialtyId,
          date: dateStr,
        });
      } else {
        result = [];
      }

      setSlots(result);

      if (result.length === 0) {
        findNearestSlot(date);
      }
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [clinicId, doctorId, specialtyId]);

  async function findNearestSlot(fromDate: Date) {
    setSearchingNearest(true);
    try {
      for (let i = 1; i <= 30; i++) {
        const checkDate = addDays(fromDate, i);
        const dateStr = format(checkDate, "yyyy-MM-dd");

        let result: AvailableSlot[];
        if (doctorId) {
          result = await apiClient.getAvailableSlots({
            clinicId,
            doctorId,
            date: dateStr,
          });
        } else if (specialtyId) {
          result = await apiClient.getAvailableSlotsBySpecialty({
            clinicId,
            specialtyId,
            date: dateStr,
          });
        } else {
          result = [];
        }

        if (result.length > 0) {
          setNearestSlot(result[0]);
          break;
        }
      }
    } catch {
      // ignore
    } finally {
      setSearchingNearest(false);
    }
  }

  function handleDateSelect(date: Date | undefined) {
    setSelectedDate(date);
    if (date) {
      fetchSlots(date);
    }
  }

  function jumpToNearest() {
    if (!nearestSlot) return;
    const date = new Date(nearestSlot.date + "T00:00:00");
    setSelectedDate(date);
    fetchSlots(date);
  }

  const grouped: GroupedSlots[] = [];
  const doctorMap = new Map<number, GroupedSlots>();
  for (const slot of slots) {
    let group = doctorMap.get(slot.doctorId);
    if (!group) {
      group = {
        doctorId: slot.doctorId,
        doctorName: slot.doctorName,
        specialtyName: slot.specialtyName,
        slots: [],
      };
      doctorMap.set(slot.doctorId, group);
      grouped.push(group);
    }
    group.slots.push(slot);
  }

  const slotsByTime = (slotList: AvailableSlot[]) => {
    const morning: AvailableSlot[] = [];
    const afternoon: AvailableSlot[] = [];
    const evening: AvailableSlot[] = [];

    for (const s of slotList) {
      const h = parseInt(s.startTime.split(":")[0]);
      if (h < 12) morning.push(s);
      else if (h < 18) afternoon.push(s);
      else evening.push(s);
    }

    return { morning, afternoon, evening };
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Date picker */}
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) =>
              isBefore(date, startOfDay(new Date())) ||
              isBefore(addDays(new Date(), 90), date)
            }
          />
        </div>

        {selectedDate && (
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Fecha seleccionada</p>
            <p className="mt-1 font-semibold capitalize">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {slots.length} turno{slots.length !== 1 ? "s" : ""} disponible
              {slots.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {!searched && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarSearch className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Seleccioná una fecha para ver disponibilidad
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Elegí un día en el calendario de la izquierda
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Buscando disponibilidad...</p>
          </div>
        )}

        {searched && !loading && slots.length === 0 && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 py-10">
              <AlertCircle className="h-10 w-10 text-amber-500 mb-3" />
              <p className="text-lg font-semibold">No hay turnos disponibles</p>
              <p className="text-sm text-muted-foreground mt-1">
                No se encontraron horarios libres para el{" "}
                {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : ""}
              </p>
            </div>

            {/* Nearest suggestion */}
            {searchingNearest && (
              <Card className="border-primary/30">
                <CardContent className="flex items-center gap-3 py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-sm">Buscando el turno más cercano disponible...</p>
                </CardContent>
              </Card>
            )}

            {nearestSlot && !searchingNearest && (
              <Card className="border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                          Turno más cercano encontrado
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Dr. {nearestSlot.doctorName} — {nearestSlot.specialtyName}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="h-3.5 w-3.5" />
                          {format(new Date(nearestSlot.date + "T00:00:00"), "EEEE d/MM", { locale: es })}
                          {" a las "}
                          {nearestSlot.startTime}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={jumpToNearest}>
                          Ver ese día
                          <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSlotSelect(nearestSlot)}
                        >
                          Seleccionar este turno
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {searched && !loading && grouped.length > 0 && (
          <div className="space-y-4">
            {grouped.map((group) => {
              const { morning, afternoon, evening } = slotsByTime(group.slots);
              return (
                <Card key={group.doctorId} className="overflow-hidden">
                  <div className="flex items-center gap-3 border-b bg-muted/30 px-5 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <Stethoscope className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Dr. {group.doctorName}</p>
                      <p className="text-xs text-muted-foreground">{group.specialtyName}</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      {group.slots.length} turnos
                    </Badge>
                  </div>
                  <CardContent className="p-5 space-y-4">
                    {morning.length > 0 && (
                      <TimeSection
                        label="Mañana"
                        slots={morning}
                        selectedSlot={selectedSlot}
                        onSelect={onSlotSelect}
                      />
                    )}
                    {afternoon.length > 0 && (
                      <TimeSection
                        label="Tarde"
                        slots={afternoon}
                        selectedSlot={selectedSlot}
                        onSelect={onSlotSelect}
                      />
                    )}
                    {evening.length > 0 && (
                      <TimeSection
                        label="Noche"
                        slots={evening}
                        selectedSlot={selectedSlot}
                        onSelect={onSlotSelect}
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TimeSection({
  label,
  slots,
  selectedSlot,
  onSelect,
}: {
  label: string;
  slots: AvailableSlot[];
  selectedSlot?: AvailableSlot | null;
  onSelect: (slot: AvailableSlot) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot, i) => {
          const isSelected =
            selectedSlot?.date === slot.date &&
            selectedSlot?.startTime === slot.startTime &&
            selectedSlot?.doctorId === slot.doctorId;
          return (
            <button
              key={i}
              onClick={() => onSelect(slot)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
              }`}
            >
              {slot.startTime}
            </button>
          );
        })}
      </div>
    </div>
  );
}
