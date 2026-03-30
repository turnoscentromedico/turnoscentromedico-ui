"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  Building2,
  CalendarCheck,
  CalendarPlus,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Stethoscope,
  Tag,
  Users,
  UsersRound,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";
import { useViewPermissions, type ViewId } from "@/hooks/use-view-permissions";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  viewId: ViewId;
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "General",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, viewId: "dashboard" },
    ],
  },
  {
    label: "Turnos",
    items: [
      { title: "Turnos", href: "/dashboard/appointments", icon: CalendarCheck, viewId: "appointments" },
      { title: "Nuevo Turno", href: "/dashboard/appointments/new", icon: CalendarPlus, viewId: "appointments.new" },
      { title: "Notificaciones", href: "/dashboard/notifications", icon: Bell, viewId: "notifications" },
      { title: "Historia Clínica", href: "/dashboard/medical-records", icon: ClipboardList, viewId: "medical-records" },
    ],
  },
  {
    label: "Administración",
    items: [
      { title: "Clínicas", href: "/dashboard/clinics", icon: Building2, viewId: "clinics" },
      { title: "Especialidades", href: "/dashboard/specialties", icon: Tag, viewId: "specialties" },
      { title: "Doctores", href: "/dashboard/doctors", icon: Stethoscope, viewId: "doctors" },
      { title: "Pacientes", href: "/dashboard/patients", icon: UsersRound, viewId: "patients" },
      { title: "Usuarios", href: "/dashboard/users", icon: Users, viewId: "users" },
      { title: "Configuración", href: "/dashboard/settings", icon: Settings, viewId: "settings" },
      { title: "Documentación", href: "/dashboard/documentation", icon: FileText, viewId: "documentation" },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  OPERATOR: "Operador",
  DOCTOR: "Médico",
  STANDARD: "Sin permisos",
};

export function AppSidebar() {
  const pathname = usePathname();
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count ?? 0;
  const { canAccess, isLoading, role } = useViewPermissions();

  const roleLabel = role ? ROLE_LABELS[role] ?? role : "";

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight leading-none">
              Admin<span className="text-primary">Doctor</span>
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              Gestión Médica
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {isLoading ? (
          <div className="space-y-4 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          navGroups.map((group, gi) => {
            const visibleItems = group.items.filter((item) =>
              canAccess(item.viewId),
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label}>
                {gi > 0 && <SidebarSeparator />}
                <SidebarGroup>
                  <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {visibleItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            render={<Link href={item.href} />}
                            isActive={isActive(pathname, item.href)}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            {item.viewId === "notifications" && unreadCount > 0 && (
                              <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1.5 text-[10px] justify-center">
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </Badge>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </div>
            );
          })
        )}
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-3">
        {role && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Badge
              variant={
                role === "ADMIN"
                  ? "default"
                  : role === "OPERATOR"
                    ? "secondary"
                    : role === "DOCTOR"
                      ? "secondary"
                      : "outline"
              }
              className="text-[10px]"
            >
              {roleLabel}
            </Badge>
            <span className="text-[10px] text-muted-foreground">Conectado</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
