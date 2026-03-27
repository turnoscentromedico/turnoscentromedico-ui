"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { format, parseISO, differenceInYears } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTablePagination } from "@/components/data-table-pagination";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { usePatient, useUpdatePatient } from "@/hooks/use-patients";
import {
  useMedicalRecords,
  useCreateMedicalRecord,
  useDeleteMedicalRecord,
} from "@/hooks/use-medical-records";
import { usePageSize } from "@/hooks/use-page-size";
import type { MedicalRecordEntryType, CreateMedicalRecordInput } from "@/types";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  CONFIRMED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  NO_SHOW: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
  NO_SHOW: "No asistió",
};

const entryTypeLabels: Record<string, string> = {
  manual: "Entrada manual",
  auto_created: "Turno creado",
  auto_confirmed: "Turno confirmado",
  auto_cancelled: "Turno cancelado",
  auto_completed: "Turno completado",
  auto_no_show: "No asistió",
};

const entryTypeColors: Record<string, string> = {
  manual: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  auto_created: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  auto_confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  auto_cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  auto_completed: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  auto_no_show: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const emptyForm: CreateMedicalRecordInput = {
  date: new Date().toISOString().split("T")[0],
};

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = Number(params.id);
  const defaultTab = searchParams.get("tab") === "history" ? "history" : "info";

  const { data: patient, isLoading } = usePatient(patientId);

  const [hrPage, setHrPage] = useState(1);
  const [hrPageSize, setHrPageSize] = usePageSize("medical-records");
  const [hrFilter, setHrFilter] = useState<string>("");

  const { data: hrData, isLoading: hrLoading } = useMedicalRecords(patientId, {
    page: hrPage,
    pageSize: hrPageSize,
    entryType: hrFilter || undefined,
    sortBy: "date",
    sortOrder: "desc",
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateMedicalRecordInput>({ ...emptyForm });
  const [showVitals, setShowVitals] = useState(false);
  const createRecord = useCreateMedicalRecord(patientId);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const deleteRecord = useDeleteMedicalRecord(patientId);

  const age = useMemo(() => {
    if (!patient?.dateOfBirth) return null;
    return differenceInYears(new Date(), parseISO(patient.dateOfBirth));
  }, [patient?.dateOfBirth]);

  function handleCreateSubmit() {
    createRecord.mutate(form, {
      onSuccess: () => {
        setShowForm(false);
        setForm({ ...emptyForm });
        setShowVitals(false);
      },
    });
  }

  function handleDeleteConfirm() {
    if (deleteId === null) return;
    deleteRecord.mutate(deleteId, {
      onSettled: () => setDeleteId(null),
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Paciente no encontrado
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-muted-foreground">
            DNI: {patient.dni}
            {age !== null && ` — ${age} años`}
          </p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="info" className="gap-1.5 cursor-pointer">
            <User className="h-4 w-4" /> Datos personales
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 cursor-pointer">
            <ClipboardList className="h-4 w-4" /> Historia clínica
            {patient._count?.medicalRecords ? (
              <Badge variant="secondary" className="ml-1 text-xs">
                {patient._count.medicalRecords}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="appointments" className="gap-1.5 cursor-pointer">
            <Calendar className="h-4 w-4" /> Turnos
            {patient._count?.appointments ? (
              <Badge variant="secondary" className="ml-1 text-xs">
                {patient._count.appointments}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* ── Datos personales ── */}
        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <InfoField label="Nombre" value={`${patient.firstName} ${patient.lastName}`} icon={<User className="h-4 w-4" />} />
                <InfoField label="DNI" value={patient.dni} />
                <InfoField label="Nacionalidad" value={patient.nationality} />
                <InfoField
                  label="Fecha de nacimiento"
                  value={format(parseISO(patient.dateOfBirth), "d 'de' MMMM, yyyy", { locale: es })}
                />
                {patient.email && <InfoField label="Email" value={patient.email} icon={<Mail className="h-4 w-4" />} />}
                {patient.phone && <InfoField label="Teléfono" value={patient.phone} icon={<Phone className="h-4 w-4" />} />}
                {patient.address && <InfoField label="Dirección" value={patient.address} icon={<MapPin className="h-4 w-4" />} />}
                {patient.cuilCuit && <InfoField label="CUIL/CUIT" value={patient.cuilCuit} />}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Historia clínica ── */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Historia clínica</CardTitle>
              <Button
                size="sm"
                className="gap-1.5 cursor-pointer"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4" /> Nueva entrada
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter */}
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant={hrFilter === "" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => { setHrFilter(""); setHrPage(1); }}
                >
                  Todas
                </Badge>
                <Badge
                  variant={hrFilter === "manual" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => { setHrFilter("manual"); setHrPage(1); }}
                >
                  Manuales
                </Badge>
                {(["auto_created", "auto_confirmed", "auto_cancelled"] as const).map(
                  (t) => (
                    <Badge
                      key={t}
                      variant={hrFilter === t ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => { setHrFilter(t); setHrPage(1); }}
                    >
                      {entryTypeLabels[t]}
                    </Badge>
                  ),
                )}
              </div>

              {hrLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : !hrData?.data?.length ? (
                <p className="py-8 text-center text-muted-foreground">
                  No hay entradas en la historia clínica
                </p>
              ) : (
                <div className="space-y-3">
                  {hrData.data.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg border p-4 space-y-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={entryTypeColors[entry.entryType] ?? ""}
                          >
                            {entryTypeLabels[entry.entryType] ?? entry.entryType}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(parseISO(entry.date), "d MMM yyyy", { locale: es })}
                          </span>
                        </div>
                        {entry.entryType === "manual" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive cursor-pointer"
                            onClick={() => setDeleteId(entry.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {entry.reason && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Motivo:</span>
                          <p className="text-sm">{entry.reason}</p>
                        </div>
                      )}
                      {entry.diagnosis && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Diagnóstico:</span>
                          <p className="text-sm">{entry.diagnosis}</p>
                        </div>
                      )}
                      {entry.treatment && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Tratamiento:</span>
                          <p className="text-sm">{entry.treatment}</p>
                        </div>
                      )}
                      {entry.prescriptions && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Indicaciones:</span>
                          <p className="text-sm">{entry.prescriptions}</p>
                        </div>
                      )}
                      {entry.studies && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Estudios:</span>
                          <p className="text-sm">{entry.studies}</p>
                        </div>
                      )}
                      {entry.observations && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Observaciones:</span>
                          <p className="text-sm">{entry.observations}</p>
                        </div>
                      )}

                      {(entry.weight || entry.height || entry.bloodPressure || entry.temperature || entry.heartRate) && (
                        <div className="flex gap-3 flex-wrap text-xs text-muted-foreground pt-1 border-t">
                          {entry.weight && <span>Peso: {entry.weight} kg</span>}
                          {entry.height && <span>Altura: {entry.height} cm</span>}
                          {entry.bloodPressure && <span>PA: {entry.bloodPressure}</span>}
                          {entry.temperature && <span>Temp: {entry.temperature}°C</span>}
                          {entry.heartRate && <span>FC: {entry.heartRate} bpm</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {hrData && hrData.total > 0 && (
                <DataTablePagination
                  page={hrPage}
                  pageSize={hrPageSize}
                  total={hrData.total}
                  onPageChange={setHrPage}
                  onPageSizeChange={(s) => { setHrPageSize(s); setHrPage(1); }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Turnos ── */}
        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Turnos</CardTitle>
            </CardHeader>
            <CardContent>
              {!patient.appointments?.length ? (
                <p className="py-8 text-center text-muted-foreground">
                  No hay turnos registrados
                </p>
              ) : (
                <div className="space-y-3">
                  {patient.appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="rounded-lg border p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">
                          {format(parseISO(apt.date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                          {apt.startTime && ` — ${apt.startTime}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Dr. {apt.doctor.firstName} {apt.doctor.lastName} — {apt.specialty.name} — {apt.clinic.name}
                        </p>
                      </div>
                      <Badge variant="outline" className={statusColors[apt.status] ?? ""}>
                        {statusLabels[apt.status] ?? apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Modal nueva entrada HC ── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Nueva entrada — Historia clínica
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Motivo de consulta</Label>
              <Textarea
                placeholder="Motivo de la consulta..."
                value={form.reason ?? ""}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
            <div>
              <Label>Diagnóstico</Label>
              <Textarea
                placeholder="Diagnóstico..."
                value={form.diagnosis ?? ""}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              />
            </div>
            <div>
              <Label>Tratamiento</Label>
              <Textarea
                placeholder="Tratamiento indicado..."
                value={form.treatment ?? ""}
                onChange={(e) => setForm({ ...form, treatment: e.target.value })}
              />
            </div>
            <div>
              <Label>Indicaciones / Recetas</Label>
              <Textarea
                placeholder="Indicaciones y recetas..."
                value={form.prescriptions ?? ""}
                onChange={(e) => setForm({ ...form, prescriptions: e.target.value })}
              />
            </div>
            <div>
              <Label>Estudios solicitados</Label>
              <Textarea
                placeholder="Estudios solicitados..."
                value={form.studies ?? ""}
                onChange={(e) => setForm({ ...form, studies: e.target.value })}
              />
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea
                placeholder="Observaciones generales..."
                value={form.observations ?? ""}
                onChange={(e) => setForm({ ...form, observations: e.target.value })}
              />
            </div>

            {/* Signos vitales */}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setShowVitals(!showVitals)}
              >
                {showVitals ? "Ocultar signos vitales" : "Agregar signos vitales (opcional)"}
              </Button>

              {showVitals && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-3">
                  <div>
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="70.5"
                      value={form.weight ?? ""}
                      onChange={(e) => setForm({ ...form, weight: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div>
                    <Label>Altura (cm)</Label>
                    <Input
                      type="number"
                      placeholder="175"
                      value={form.height ?? ""}
                      onChange={(e) => setForm({ ...form, height: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div>
                    <Label>Presión arterial</Label>
                    <Input
                      placeholder="120/80"
                      value={form.bloodPressure ?? ""}
                      onChange={(e) => setForm({ ...form, bloodPressure: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Temperatura (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="36.5"
                      value={form.temperature ?? ""}
                      onChange={(e) => setForm({ ...form, temperature: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div>
                    <Label>Frecuencia cardíaca (bpm)</Label>
                    <Input
                      type="number"
                      placeholder="72"
                      value={form.heartRate ?? ""}
                      onChange={(e) => setForm({ ...form, heartRate: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
              <Button
                className="cursor-pointer"
                onClick={handleCreateSubmit}
                disabled={createRecord.isPending}
              >
                {createRecord.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Eliminar entrada"
        description="¿Estás seguro de que querés eliminar esta entrada de la historia clínica?"
        confirmLabel="Sí, eliminar"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

function InfoField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium flex items-center gap-1.5">
        {icon}
        {value}
      </p>
    </div>
  );
}
