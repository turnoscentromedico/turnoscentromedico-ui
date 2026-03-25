"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { QueryProvider } from "@/providers/query-provider";
import { AuthTokenProvider } from "@/providers/auth-token-provider";
import { useUser, UserButton } from "@clerk/nextjs";
import { useMe } from "@/hooks/use-role";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeSync } from "@/components/theme-sync";
import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

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
                <div className="flex items-center gap-2 border-b px-6 py-3">
                  <SidebarTrigger />
                </div>
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
