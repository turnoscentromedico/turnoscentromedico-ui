"use client";

import { useState } from "react";
import { Bell, BellOff, CheckCheck, CalendarX2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/data-table-pagination";
import { usePageSize } from "@/hooks/use-page-size";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/use-notifications";
import { ViewGuard } from "@/components/view-guard";
import type { InternalNotification } from "@/types";

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  appointment_cancelled_by_patient: {
    icon: CalendarX2,
    color: "text-red-600",
    label: "Cancelación",
  },
};

function getConfig(type: string) {
  return (
    TYPE_CONFIG[type] ?? {
      icon: Bell,
      color: "text-blue-600",
      label: "Notificación",
    }
  );
}

function NotificationItem({
  notif,
  onMarkRead,
}: {
  notif: InternalNotification;
  onMarkRead: (id: number) => void;
}) {
  const cfg = getConfig(notif.type);
  const Icon = cfg.icon;

  return (
    <div
      className={`flex gap-4 rounded-lg border p-4 transition-colors ${
        notif.read
          ? "bg-background opacity-60"
          : "bg-muted/30 border-primary/20"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          notif.read ? "bg-muted" : "bg-primary/10"
        }`}
      >
        <Icon className={`h-5 w-5 ${notif.read ? "text-muted-foreground" : cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold ${notif.read ? "text-muted-foreground" : ""}`}>
              {notif.title}
            </p>
            {!notif.read && (
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(notif.createdAt), {
                addSuffix: true,
                locale: es,
              })}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{notif.message}</p>
        <div className="flex items-center gap-2 pt-1">
          {notif.clinic && (
            <Badge variant="outline" className="text-xs">
              {notif.clinic.name}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {cfg.label}
          </Badge>
          {!notif.read && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs ml-auto"
              onClick={() => onMarkRead(notif.id)}
            >
              Marcar como leída
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize("notifications");
  const { data: notificationsData, isLoading } = useNotifications({
    page,
    pageSize,
  });
  const notifications = notificationsData?.data ?? [];
  const totalNotifications = notificationsData?.total ?? 0;
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ViewGuard viewId="notifications">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-muted-foreground">
            Alertas de cancelaciones y cambios de turnos
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como leídas ({unreadCount})
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Historial de notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !notifications.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BellOff className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No hay notificaciones</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notif={n}
                    onMarkRead={(id) => markRead.mutate(id)}
                  />
                ))}
              </div>
              <DataTablePagination
                page={page}
                pageSize={pageSize}
                total={totalNotifications}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
    </ViewGuard>
  );
}
