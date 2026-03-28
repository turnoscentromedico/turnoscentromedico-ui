"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, UsersRound, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePatients,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
} from "@/hooks/use-patients";
import { patientSchema, type PatientFormData } from "@/lib/schemas";
import { PhoneInput, parsePhoneToE164, splitPhoneFromE164 } from "@/components/phone-input";
import { DataTablePagination } from "@/components/data-table-pagination";
import { usePageSize } from "@/hooks/use-page-size";
import { SortableHeader, type SortState } from "@/components/sortable-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ViewGuard } from "@/components/view-guard";
import type { Patient } from "@/types";

export default function PatientsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize("patients");
  const [sort, setSort] = useState<SortState>({ sortBy: null, sortOrder: null });
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

  const { data: patientsData, isLoading } = usePatients({
    page, pageSize,
    sortBy: sort.sortBy ?? undefined,
    sortOrder: sort.sortOrder ?? undefined,
  });
  const patients = patientsData?.data ?? [];
  const totalPatients = patientsData?.total ?? 0;
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [phoneAreaCode, setPhoneAreaCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dni: "",
      nationality: "",
      dateOfBirth: "",
      email: "",
      phone: "",
      address: "",
      cuilCuit: "",
    },
  });

  const filtered = useMemo(() => {
    if (!patients.length) return [];
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.dni.includes(q) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q))
    );
  }, [patients, search]);

  function openCreate() {
    setEditing(null);
    form.reset({
      firstName: "",
      lastName: "",
      dni: "",
      nationality: "",
      dateOfBirth: "",
      email: "",
      phone: "",
      address: "",
      cuilCuit: "",
    });
    setPhoneAreaCode("");
    setPhoneNumber("");
    setOpen(true);
  }

  function openEdit(p: Patient) {
    setEditing(p);
    const phoneParts = splitPhoneFromE164(p.phone);
    form.reset({
      firstName: p.firstName,
      lastName: p.lastName,
      dni: p.dni,
      nationality: p.nationality,
      dateOfBirth: p.dateOfBirth ? p.dateOfBirth.substring(0, 10) : "",
      email: p.email ?? "",
      phone: p.phone ?? "",
      address: p.address ?? "",
      cuilCuit: p.cuilCuit ?? "",
    });
    setPhoneAreaCode(phoneParts.areaCode);
    setPhoneNumber(phoneParts.number);
    setOpen(true);
  }

  async function onSubmit(data: PatientFormData) {
    const composedPhone = parsePhoneToE164(phoneAreaCode, phoneNumber);
    const payload = {
      ...data,
      email: data.email || undefined,
      phone: composedPhone || undefined,
      address: data.address || undefined,
      cuilCuit: data.cuilCuit || undefined,
    };
    if (editing) {
      await updatePatient.mutateAsync({ id: editing.id, data: payload });
    } else {
      await createPatient.mutateAsync(payload);
    }
    setOpen(false);
    form.reset();
  }

  return (
    <ViewGuard viewId="patients">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">Gestión de pacientes</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Paciente
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar Paciente" : "Nuevo Paciente"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input id="firstName" {...form.register("firstName")} />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input id="lastName" {...form.register("lastName")} />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI *</Label>
                  <Input id="dni" {...form.register("dni")} />
                  {form.formState.errors.dni && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.dni.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nacionalidad *</Label>
                  <Input id="nationality" {...form.register("nationality")} />
                  {form.formState.errors.nationality && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.nationality.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Fecha de nacimiento *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...form.register("dateOfBirth")}
                  />
                  {form.formState.errors.dateOfBirth && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.dateOfBirth.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuilCuit">CUIL/CUIT</Label>
                  <Input id="cuilCuit" {...form.register("cuilCuit")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <PhoneInput
                areaCode={phoneAreaCode}
                number={phoneNumber}
                onAreaCodeChange={setPhoneAreaCode}
                onNumberChange={setPhoneNumber}
              />
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" {...form.register("address")} />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createPatient.isPending || updatePatient.isPending}
                >
                  {editing ? "Guardar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, DNI, email o teléfono..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            Listado de pacientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !filtered.length ? (
            <p className="text-center py-8 text-muted-foreground">
              {search ? "Sin resultados" : "No hay pacientes registrados"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><SortableHeader label="Nombre" field="lastName" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                  <TableHead><SortableHeader label="DNI" field="dni" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                  <TableHead>Nacionalidad</TableHead>
                  <TableHead><SortableHeader label="Email" field="email" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                  <TableHead><SortableHeader label="Teléfono" field="phone" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.firstName} {p.lastName}
                    </TableCell>
                    <TableCell>{p.dni}</TableCell>
                    <TableCell>{p.nationality}</TableCell>
                    <TableCell>{p.email ?? "—"}</TableCell>
                    <TableCell>
                      {p.phone ? (
                        <span className="text-xs font-mono">{p.phone}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(p)}
                          className="cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={totalPatients}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Eliminar paciente"
        description={
          deleteTarget
            ? `¿Estás seguro de que querés eliminar a ${deleteTarget.firstName} ${deleteTarget.lastName}? Esta acción es irreversible y eliminará todos los turnos, historia clínica y datos asociados al paciente.`
            : ""
        }
        confirmLabel="Sí, eliminar"
        variant="destructive"
        loading={deletePatient.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deletePatient.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
          });
        }}
      />
    </div>
    </ViewGuard>
  );
}
