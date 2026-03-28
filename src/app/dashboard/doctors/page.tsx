"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Stethoscope } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/data-table-pagination";
import {
  useDoctors,
  useCreateDoctor,
  useDeleteDoctor,
} from "@/hooks/use-doctors";
import { useClinics } from "@/hooks/use-clinics";
import { useSpecialties } from "@/hooks/use-specialties";
import { doctorSchema, type DoctorFormData } from "@/lib/schemas";
import { usePageSize } from "@/hooks/use-page-size";
import { SortableHeader, type SortState } from "@/components/sortable-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Doctor } from "@/types";
import { ViewGuard } from "@/components/view-guard";

const EMPTY_FORM: DoctorFormData = {
  firstName: "",
  lastName: "",
  dni: "",
  nationality: "",
  dateOfBirth: "",
  phone: "",
  address: "",
  licenseNumber: "",
  specialtyId: 0,
  clinicId: 0,
};

export default function DoctorsPage() {
  const router = useRouter();
  const [filterClinic, setFilterClinic] = useState<number | undefined>();
  const [filterSpecialty, setFilterSpecialty] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize("doctors");
  const [sort, setSort] = useState<SortState>({ sortBy: null, sortOrder: null });

  const { data: doctorsData, isLoading } = useDoctors({
    clinicId: filterClinic,
    specialtyId: filterSpecialty,
    page,
    pageSize,
    sortBy: sort.sortBy ?? undefined,
    sortOrder: sort.sortOrder ?? undefined,
  });
  const doctors = doctorsData?.data ?? [];
  const totalDoctors = doctorsData?.total ?? 0;
  const { data: clinicsData } = useClinics({ pageSize: 100 });
  const { data: specialtiesData } = useSpecialties({ pageSize: 100 });
  const clinics = clinicsData?.data ?? [];
  const specialties = specialtiesData?.data ?? [];
  const createDoctor = useCreateDoctor();
  const deleteDoctor = useDeleteDoctor();

  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);

  const form = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
    defaultValues: EMPTY_FORM,
  });

  function openCreate() {
    form.reset(EMPTY_FORM);
    setOpen(true);
  }

  async function onSubmit(data: DoctorFormData) {
    const created = await createDoctor.mutateAsync(data);
    setOpen(false);
    form.reset();
    router.push(`/dashboard/doctors/${created.id}`);
  }

  return (
    <ViewGuard viewId="doctors">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctores</h1>
          <p className="text-muted-foreground">Gestión de profesionales médicos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Doctor
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo Doctor</DialogTitle>
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
                  <Label htmlFor="licenseNumber">N° Matrícula *</Label>
                  <Input id="licenseNumber" {...form.register("licenseNumber")} />
                  {form.formState.errors.licenseNumber && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.licenseNumber.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nacionalidad</Label>
                  <Input id="nationality" {...form.register("nationality")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                  <Input id="dateOfBirth" type="date" {...form.register("dateOfBirth")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" {...form.register("phone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" {...form.register("address")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Clínica *</Label>
                  <Select
                    value={form.watch("clinicId") ? String(form.watch("clinicId")) : ""}
                    onValueChange={(val) =>
                      form.setValue("clinicId", Number(val ?? 0), { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      {form.watch("clinicId")
                        ? clinics?.find((c) => c.id === form.watch("clinicId"))?.name ?? "Seleccionar clínica"
                        : <SelectValue placeholder="Seleccionar clínica" />}
                    </SelectTrigger>
                    <SelectContent>
                      {clinics?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.clinicId && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.clinicId.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Especialidad *</Label>
                  <Select
                    value={form.watch("specialtyId") ? String(form.watch("specialtyId")) : ""}
                    onValueChange={(val) =>
                      form.setValue("specialtyId", Number(val ?? 0), { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      {form.watch("specialtyId")
                        ? specialties?.find((s) => s.id === form.watch("specialtyId"))?.name ?? "Seleccionar especialidad"
                        : <SelectValue placeholder="Seleccionar especialidad" />}
                    </SelectTrigger>
                    <SelectContent>
                      {specialties?.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.specialtyId && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.specialtyId.message}
                    </p>
                  )}
                </div>
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
                  disabled={createDoctor.isPending}
                >
                  Crear
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select
          value={filterClinic ? String(filterClinic) : ""}
          onValueChange={(val) => {
            setPage(1);
            setFilterClinic(val ? Number(val) : undefined);
          }}
        >
          <SelectTrigger className="w-[200px]">
            {filterClinic
              ? clinics?.find((c) => c.id === filterClinic)?.name ?? "Todas las clínicas"
              : <SelectValue placeholder="Todas las clínicas" />}
          </SelectTrigger>
          <SelectContent>
            {clinics?.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterSpecialty ? String(filterSpecialty) : ""}
          onValueChange={(val) => {
            setPage(1);
            setFilterSpecialty(val ? Number(val) : undefined);
          }}
        >
          <SelectTrigger className="w-[200px]">
            {filterSpecialty
              ? specialties?.find((s) => s.id === filterSpecialty)?.name ?? "Todas las especialidades"
              : <SelectValue placeholder="Todas las especialidades" />}
          </SelectTrigger>
          <SelectContent>
            {specialties?.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterClinic || filterSpecialty) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPage(1);
              setFilterClinic(undefined);
              setFilterSpecialty(undefined);
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Listado de doctores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !doctors.length ? (
            <p className="text-center py-8 text-muted-foreground">
              No hay doctores registrados
            </p>
          ) : (
            <>
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><SortableHeader label="Nombre" field="lastName" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                  <TableHead><SortableHeader label="DNI" field="dni" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                  <TableHead><SortableHeader label="Matrícula" field="licenseNumber" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                  <TableHead><SortableHeader label="Especialidad" field="specialty.name" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                  <TableHead><SortableHeader label="Clínica" field="clinic.name" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      {d.lastName}, {d.firstName}
                    </TableCell>
                    <TableCell>{d.dni}</TableCell>
                    <TableCell>{d.licenseNumber}</TableCell>
                    <TableCell>{d.specialty?.name ?? "—"}</TableCell>
                    <TableCell>{d.clinic?.name ?? "—"}</TableCell>
                    <TableCell>{d.phone ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/dashboard/doctors/${d.id}`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                          title="Ver / Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(d)}
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
              <DataTablePagination
                page={page}
                pageSize={pageSize}
                total={totalDoctors}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Eliminar doctor"
        description={
          deleteTarget
            ? `¿Estás seguro de que querés eliminar a ${deleteTarget.firstName} ${deleteTarget.lastName}? Esta acción es irreversible y eliminará su agenda, turnos activos (se notificará la cancelación a los pacientes) y todos los datos asociados.`
            : ""
        }
        confirmLabel="Sí, eliminar"
        variant="destructive"
        loading={deleteDoctor.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteDoctor.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
          });
        }}
      />
    </div>
    </ViewGuard>
  );
}
