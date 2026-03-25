"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Tag, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
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
  useSpecialties,
  useCreateSpecialty,
  useUpdateSpecialty,
  useDeleteSpecialty,
} from "@/hooks/use-specialties";
import { useDoctors } from "@/hooks/use-doctors";
import { specialtySchema, type SpecialtyFormData } from "@/lib/schemas";
import { usePageSize } from "@/hooks/use-page-size";
import { SortableHeader, type SortState } from "@/components/sortable-header";
import type { Specialty } from "@/types";

export default function SpecialtiesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize("specialties");
  const [sort, setSort] = useState<SortState>({ sortBy: null, sortOrder: null });

  const { data: specialtiesData, isLoading } = useSpecialties({
    page, pageSize,
    sortBy: sort.sortBy ?? undefined,
    sortOrder: sort.sortOrder ?? undefined,
  });
  const specialties = specialtiesData?.data ?? [];
  const totalSpecialties = specialtiesData?.total ?? 0;

  const createSpecialty = useCreateSpecialty();
  const updateSpecialty = useUpdateSpecialty();
  const deleteSpecialty = useDeleteSpecialty();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Specialty | null>(null);
  const [doctorsSpecialty, setDoctorsSpecialty] = useState<Specialty | null>(null);
  const [docPage, setDocPage] = useState(1);
  const [docPageSize, setDocPageSize] = usePageSize("specialty-doctors");
  const [docSort, setDocSort] = useState<SortState>({ sortBy: null, sortOrder: null });

  const { data: doctorsData, isLoading: doctorsLoading } = useDoctors({
    specialtyId: doctorsSpecialty?.id,
    page: docPage,
    pageSize: docPageSize,
    sortBy: docSort.sortBy ?? undefined,
    sortOrder: docSort.sortOrder ?? undefined,
    enabled: !!doctorsSpecialty,
  });
  const doctorsList = doctorsData?.data ?? [];
  const doctorsTotal = doctorsData?.total ?? 0;

  const form = useForm<SpecialtyFormData>({
    resolver: zodResolver(specialtySchema),
    defaultValues: { name: "", description: "" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: "", description: "" });
    setOpen(true);
  }

  function openEdit(s: Specialty) {
    setEditing(s);
    form.reset({ name: s.name, description: s.description ?? "" });
    setOpen(true);
  }

  async function onSubmit(data: SpecialtyFormData) {
    if (editing) {
      await updateSpecialty.mutateAsync({ id: editing.id, data });
    } else {
      await createSpecialty.mutateAsync(data);
    }
    setOpen(false);
    form.reset();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Especialidades</h1>
          <p className="text-muted-foreground">Gestión de especialidades médicas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button onClick={openCreate} />}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Especialidad
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar Especialidad" : "Nueva Especialidad"}
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
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" {...form.register("description")} />
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
                  disabled={createSpecialty.isPending || updateSpecialty.isPending}
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
            <Tag className="h-4 w-4" />
            Listado de especialidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !specialties.length ? (
            <p className="text-center py-8 text-muted-foreground">
              No hay especialidades registradas
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><SortableHeader label="Nombre" field="name" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Doctores</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specialties.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.description ?? "—"}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer font-medium hover:underline"
                          onClick={() => {
                            setDocPage(1);
                            setDocSort({ sortBy: null, sortOrder: null });
                            setDoctorsSpecialty(s);
                          }}
                        >
                          <Stethoscope className="mr-1.5 h-3.5 w-3.5" />
                          {s._count?.doctors ?? 0}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(s)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => deleteSpecialty.mutate(s.id)}
                            disabled={deleteSpecialty.isPending}
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
                total={totalSpecialties}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Doctors by specialty modal ── */}
      <Dialog
        open={doctorsSpecialty !== null}
        onOpenChange={(o) => !o && setDoctorsSpecialty(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Doctores — {doctorsSpecialty?.name}
              {doctorsTotal > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {doctorsTotal}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {doctorsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !doctorsList.length ? (
            <p className="text-center py-6 text-muted-foreground">
              No hay doctores en esta especialidad
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortableHeader label="Nombre" field="lastName" sort={docSort} onSort={(s) => { setDocSort(s); setDocPage(1); }} />
                    </TableHead>
                    <TableHead>
                      <SortableHeader label="DNI" field="dni" sort={docSort} onSort={(s) => { setDocSort(s); setDocPage(1); }} />
                    </TableHead>
                    <TableHead>
                      <SortableHeader label="Matrícula" field="licenseNumber" sort={docSort} onSort={(s) => { setDocSort(s); setDocPage(1); }} />
                    </TableHead>
                    <TableHead>
                      <SortableHeader label="Clínica" field="clinic.name" sort={docSort} onSort={(s) => { setDocSort(s); setDocPage(1); }} />
                    </TableHead>
                    <TableHead>Teléfono</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctorsList.map((d) => (
                    <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDoctorsSpecialty(null)}>
                      <TableCell className="font-medium p-0">
                        <Link
                          href={`/dashboard/doctors/${d.id}`}
                          className="block px-4 py-2 text-primary hover:underline"
                        >
                          {d.lastName}, {d.firstName}
                        </Link>
                      </TableCell>
                      <TableCell>{d.dni}</TableCell>
                      <TableCell>{d.licenseNumber}</TableCell>
                      <TableCell>{d.clinic?.name ?? "—"}</TableCell>
                      <TableCell>{d.phone ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {doctorsTotal > docPageSize && (
                <DataTablePagination
                  page={docPage}
                  pageSize={docPageSize}
                  total={doctorsTotal}
                  onPageChange={setDocPage}
                  onPageSizeChange={(size) => {
                    setDocPageSize(size);
                    setDocPage(1);
                  }}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
