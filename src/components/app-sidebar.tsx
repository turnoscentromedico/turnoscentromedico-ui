"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Bell,
  Building2,
  CalendarCheck,
  CalendarPlus,
  LayoutDashboard,
  Stethoscope,
  Tag,
  User,
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
import { ThemeToggle } from "@/components/theme-toggle";
import { useMe } from "@/hooks/use-role";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";

type NavAccess = "all" | "operator" | "admin";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  access: NavAccess;
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "General",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, access: "operator" },
    ],
  },
  {
    label: "Turnos",
    items: [
      { title: "Turnos", href: "/dashboard/appointments", icon: CalendarCheck, access: "operator" },
      { title: "Nuevo Turno", href: "/dashboard/appointments/new", icon: CalendarPlus, access: "operator" },
      { title: "Notificaciones", href: "/dashboard/notifications", icon: Bell, access: "operator" },
    ],
  },
  {
    label: "Administración",
    items: [
      { title: "Clínicas", href: "/dashboard/clinics", icon: Building2, access: "admin" },
      { title: "Especialidades", href: "/dashboard/specialties", icon: Tag, access: "operator" },
      { title: "Doctores", href: "/dashboard/doctors", icon: Stethoscope, access: "operator" },
      { title: "Pacientes", href: "/dashboard/patients", icon: UsersRound, access: "operator" },
      { title: "Usuarios", href: "/dashboard/users", icon: Users, access: "admin" },
      { title: "Configuración", href: "/dashboard/settings", icon: Settings, access: "operator" },
    ],
  },
];

function canAccess(access: NavAccess, role: string | null): boolean {
  if (access === "all") return true;
  if (access === "operator") return role === "ADMIN" || role === "OPERATOR";
  if (access === "admin") return role === "ADMIN";
  return false;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const { data: me, isLoading } = useMe();
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count ?? 0;

  const role = me?.role ?? null;
  const roleLabel =
    role === "ADMIN" ? "Admin" : role === "OPERATOR" ? "Operador" : "Sin permisos";

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold tracking-tight">
            Turnos Clínica
          </span>
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
            const visibleItems = group.items.filter(
              (item) => canAccess(item.access, role)
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
                            {item.title === "Notificaciones" && unreadCount > 0 && (
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

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3">
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
            {role && (
              <Badge
                variant={role === "ADMIN" ? "default" : role === "OPERATOR" ? "secondary" : "outline"}
                className="w-fit text-[10px]"
              >
                {roleLabel}
              </Badge>
            )}
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
