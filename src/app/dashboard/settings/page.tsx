"use client";

import { useEffect, useState } from "react";
import { Settings, Clock, Save, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { useMe } from "@/hooks/use-role";

const HOURS = Array.from({ length: 25 }, (_, i) => {
  const h = String(i).padStart(2, "0");
  return { value: `${h}:00`, label: `${h}:00` };
});

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { data: me } = useMe();
  const isAdmin = me?.role === "ADMIN";

  const [minTime, setMinTime] = useState("06:00");
  const [maxTime, setMaxTime] = useState("21:00");
  const [show24h, setShow24h] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setMinTime(settings["calendar.slotMinTime"] ?? "06:00");
      setMaxTime(settings["calendar.slotMaxTime"] ?? "21:00");
      setShow24h(settings["calendar.show24h"] === "true");
      setEmailEnabled(settings["notifications.emailEnabled"] !== "false");
      setWhatsappEnabled(settings["notifications.whatsappEnabled"] !== "false");
      setDirty(false);
    }
  }, [settings]);

  function handleSave() {
    updateSettings.mutate({
      "calendar.slotMinTime": minTime,
      "calendar.slotMaxTime": maxTime,
      "calendar.show24h": String(show24h),
      "notifications.emailEnabled": String(emailEnabled),
      "notifications.whatsappEnabled": String(whatsappEnabled),
    }, {
      onSuccess: () => setDirty(false),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-7 w-7" />
          Configuración
        </h1>
        <p className="text-muted-foreground">
          Ajustes generales del sistema
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full max-w-xl" />
        </div>
      ) : (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Visibilidad del Calendario
            </CardTitle>
            <CardDescription>
              Configurá el rango horario visible en los calendarios de turnos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="show24h" className="text-sm font-medium">
                  Mostrar 24 horas
                </Label>
                <p className="text-xs text-muted-foreground">
                  Si está activo, se muestran las 24 horas ignorando el rango
                </p>
              </div>
              <Switch
                id="show24h"
                checked={show24h}
                disabled={!isAdmin}
                onCheckedChange={(checked: boolean) => {
                  setShow24h(checked);
                  setDirty(true);
                }}
              />
            </div>

            <div className={`space-y-4 transition-opacity ${show24h || !isAdmin ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minTime">Hora inicio</Label>
                  <Select
                    value={minTime}
                    onValueChange={(v) => { if (v) { setMinTime(v); setDirty(true); } }}
                  >
                    <SelectTrigger id="minTime">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.filter((h) => h.value < maxTime).map((h) => (
                        <SelectItem key={h.value} value={h.value}>
                          {h.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTime">Hora fin</Label>
                  <Select
                    value={maxTime}
                    onValueChange={(v) => { if (v) { setMaxTime(v); setDirty(true); } }}
                  >
                    <SelectTrigger id="maxTime">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.filter((h) => h.value > minTime).map((h) => (
                        <SelectItem key={h.value} value={h.value}>
                          {h.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Los calendarios mostrarán desde {minTime} hasta {maxTime}. Se puede scrollear dentro de ese rango.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {!isAdmin && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Solo lectura — solo el administrador puede modificar
                </Badge>
              )}
              {isAdmin && (
                <Button
                  onClick={handleSave}
                  disabled={!dirty || updateSettings.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateSettings.isPending ? "Guardando..." : "Guardar"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Notificaciones a pacientes
            </CardTitle>
            <CardDescription>
              Habilitá o deshabilitá los canales de notificación para los pacientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="emailEnabled" className="text-sm font-medium">
                    Notificaciones por Email
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enviar confirmaciones, recordatorios y cancelaciones por email
                  </p>
                </div>
              </div>
              <Switch
                id="emailEnabled"
                checked={emailEnabled}
                disabled={!isAdmin}
                onCheckedChange={(checked: boolean) => {
                  setEmailEnabled(checked);
                  setDirty(true);
                }}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="whatsappEnabled" className="text-sm font-medium">
                    Notificaciones por WhatsApp
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enviar confirmaciones, recordatorios y cancelaciones por WhatsApp
                  </p>
                </div>
              </div>
              <Switch
                id="whatsappEnabled"
                checked={whatsappEnabled}
                disabled={!isAdmin}
                onCheckedChange={(checked: boolean) => {
                  setWhatsappEnabled(checked);
                  setDirty(true);
                }}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {!isAdmin && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  Solo lectura — solo el administrador puede modificar
                </Badge>
              )}
              {isAdmin && (
                <Button
                  onClick={handleSave}
                  disabled={!dirty || updateSettings.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateSettings.isPending ? "Guardando..." : "Guardar"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
