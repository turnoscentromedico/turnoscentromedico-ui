"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert } from "lucide-react";
import { useViewPermissions, type ViewId } from "@/hooks/use-view-permissions";

interface ViewGuardProps {
  viewId: ViewId;
  children: ReactNode;
}

export function ViewGuard({ viewId, children }: ViewGuardProps) {
  const { canAccess, isLoading } = useViewPermissions();
  const router = useRouter();
  const allowed = canAccess(viewId);

  useEffect(() => {
    if (!isLoading && !allowed) {
      // no-op: render fallback instead of redirect to avoid flicker loops
    }
  }, [isLoading, allowed, router]);

  if (isLoading) {
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

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Sin permisos</h2>
        <p className="text-muted-foreground max-w-md">
          No tenés acceso a esta sección. Contactá al administrador si creés que
          esto es un error.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
