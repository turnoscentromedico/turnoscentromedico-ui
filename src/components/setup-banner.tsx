"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { Sparkles } from "lucide-react";

export function SetupBanner() {
  const { data } = useQuery({
    queryKey: queryKeys.setupStatus,
    queryFn: () => apiClient.getSetupStatus(),
    staleTime: 60_000,
  });

  if (!data?.needsSetup) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
      <Sparkles className="h-5 w-5 text-primary shrink-0" />
      <p>
        <strong>¡Bienvenido!</strong> Logueate para configurar el sistema como
        administrador. El primer usuario se convierte automáticamente en ADMIN.
      </p>
    </div>
  );
}
