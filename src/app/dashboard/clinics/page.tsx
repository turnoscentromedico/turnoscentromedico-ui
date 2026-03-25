"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
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
import { DataTablePagination } from "@/components/data-table-pagination";
import {
  useClinics,
  useCreateClinic,
  useUpdateClinic,
  useDeleteClinic,
} from "@/hooks/use-clinics";
import { clinicSchema, type ClinicFormData } from "@/lib/schemas";
import { usePageSize } from "@/hooks/use-page-size";
import { SortableHeader, type SortState } from "@/components/sortable-header";
import type { Clinic } from "@/types";

export default function ClinicsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize("clinics");
  const [sort, setSort] = useState<SortState>({ sortBy: null, sortOrder: null });

  const { data: clinicsData, isLoading } = useClinics({
    page, pageSize,
    sortBy: sort.sortBy ?? undefined,
    sortOrder: sort.sortOrder ?? undefined,
  });
  const clinics = clinicsData?.data ?? [];
  const totalClinics = clinicsData?.total ?? 0;

  const createClinic = useCreateClinic();
  const updateClinic = useUpdateClinic();
  const deleteClinic = useDeleteClinic();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Clinic | null>(null);

  const form = useForm<ClinicFormData>({
    resolver: zodResolver(clinicSchema),
    defaultValues: { name: "", address: "", phone: "" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: "", address: "", phone: "" });
    setOpen(true);
  }

  function openEdit(clinic: Clinic) {
    setEditing(clinic);
    form.reset({
      name: clinic.name,
      address: clinic.address ?? "",
      phone: clinic.phone ?? "",
    });
    setOpen(true);
  }

  async function onSubmit(data: ClinicFormData) {
    if (editing) {
      await updateClinic.mutateAsync({ id: editing.id, data });
    } else {
      await createClinic.mutateAsync(data);
    }
    setOpen(false);
    form.reset();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clínicas</h1>
          <p className="text-muted-foreground">Gestión de centros médicos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Clínica
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar Clínica" : "Nueva Clínica"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" {...form.register("address")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" {...form.register("phone")} />
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
                  disabled={
                    createClinic.isPending || updateClinic.isPending
                  }
                >
                  {editing ? "Guardar" : "Crear"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Listado de clínicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !clinics.length ? (
            <p className="text-center py-8 text-muted-foreground">
              No hay clínicas registradas
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><SortableHeader label="Nombre" field="name" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                    <TableHead><SortableHeader label="Dirección" field="address" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                    <TableHead><SortableHeader label="Teléfono" field="phone" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                    <TableHead className="text-center">Doctores</TableHead>
                    <TableHead className="text-center">Turnos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinics.map((clinic) => (
                    <TableRow key={clinic.id}>
                      <TableCell className="font-medium">{clinic.name}</TableCell>
                      <TableCell>{clinic.address ?? "—"}</TableCell>
                      <TableCell>{clinic.phone ?? "—"}</TableCell>
                      <TableCell className="text-center">
                        {clinic._count?.doctors ?? 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {clinic._count?.appointments ?? 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(clinic)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => deleteClinic.mutate(clinic.id)}
                            disabled={deleteClinic.isPending}
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
                total={totalClinics}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
