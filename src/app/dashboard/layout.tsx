"use client";

import { useMemo } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { QueryProvider } from "@/providers/query-provider";
import { AuthTokenProvider } from "@/providers/auth-token-provider";
import { useUser, UserButton } from "@clerk/nextjs";
import { useMe } from "@/hooks/use-role";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeSync } from "@/components/theme-sync";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ReactNode } from "react";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function DashboardHeader() {
  const { user } = useUser();
  const greeting = useMemo(() => getGreeting(), []);
  const today = useMemo(
    () => format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es }),
    [],
  );
  const firstName = user?.firstName ?? "";

  return (
    <div className="flex items-center gap-3 border-b bg-card/50 backdrop-blur-sm px-6 py-3">
      <SidebarTrigger />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {greeting}
          {firstName ? `, ${firstName}` : ""}
        </p>
        <p className="text-xs text-muted-foreground capitalize">{today}</p>
      </div>
      <ThemeToggle />
      <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
    </div>
  );
}

function DashboardContent({ children }: { children: ReactNode }) {
  const { data: me, isLoading: meLoading } = useMe();

  if (meLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (me?.role === "STANDARD") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Sin permisos</h2>
        <p className="text-muted-foreground max-w-md">
          Tu cuenta fue registrada correctamente, pero aún no tenés permisos
          asignados. Contactá al administrador para que te asigne un rol.
        </p>
        <div className="mt-6">
          <UserButton />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isLoaded } = useUser();

  return (
    <QueryProvider>
      <AuthTokenProvider>
        <ThemeSync />
        <TooltipProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <main className="flex-1 overflow-auto">
                <DashboardHeader />
                <div className="p-6">
                  {isLoaded ? (
                    <DashboardContent>{children}</DashboardContent>
                  ) : (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-64" />
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-28" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </main>
            </div>
          </SidebarProvider>
        </TooltipProvider>
      </AuthTokenProvider>
    </QueryProvider>
  );
}
