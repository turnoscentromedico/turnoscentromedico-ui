"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ClipboardList, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatients } from "@/hooks/use-patients";

export default function MedicalRecordsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data: patientsData, isLoading } = usePatients({ pageSize: 100 });
  const patients = patientsData?.data;

  const filtered = useMemo(() => {
    if (!patients) return [];
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.dni.includes(q),
    );
  }, [patients, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" /> Historia Clínica
        </h1>
        <p className="text-muted-foreground mt-1">
          Buscá un paciente para ver o agregar entradas a su historia clínica
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !filtered.length ? (
        <p className="py-12 text-center text-muted-foreground">
          {search.trim()
            ? "No se encontraron pacientes con esa búsqueda"
            : "No hay pacientes registrados"}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => router.push(`/dashboard/patients/${p.id}?tab=history`)}
            >
              <CardContent className="flex items-center gap-3 py-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {p.lastName}, {p.firstName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    DNI: {p.dni}
                    {p._count?.appointments
                      ? ` — ${p._count.appointments} turno${p._count.appointments !== 1 ? "s" : ""}`
                      : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
