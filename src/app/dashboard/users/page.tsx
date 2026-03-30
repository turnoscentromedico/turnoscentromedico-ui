"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Pencil,
  Trash2,
  Users,
  ShieldCheck,
  Shield,
  ShieldAlert,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/data-table-pagination";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useUsers,
  useUpdateUser,
  useDeleteUser,
} from "@/hooks/use-users";
import { useClinics } from "@/hooks/use-clinics";
import { useDoctors } from "@/hooks/use-doctors";
import { useMe } from "@/hooks/use-role";
import { userSchema, type UserFormData } from "@/lib/schemas";
import { usePageSize } from "@/hooks/use-page-size";
import { SortableHeader, type SortState } from "@/components/sortable-header";
import { Stethoscope } from "lucide-react";
import type { SystemUser } from "@/types";
import { ViewGuard } from "@/components/view-guard";

export default function UsersPage() {
  const { data: me, isLoading: meLoading } = useMe();

  return (
    <ViewGuard viewId="users">
      {meLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : me?.role !== "ADMIN" ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <ShieldAlert className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Acceso restringido</h2>
          <p className="text-muted-foreground">
            Solo los administradores pueden gestionar usuarios.
          </p>
        </div>
      ) : (
        <UsersPageContent />
      )}
    </ViewGuard>
  );
}

function UsersPageContent() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize("users");
  const [sort, setSort] = useState<SortState>({ sortBy: null, sortOrder: null });
  const { data: usersData, isLoading } = useUsers({
    page, pageSize,
    sortBy: sort.sortBy ?? undefined,
    sortOrder: sort.sortOrder ?? undefined,
  });
  const users = usersData?.data ?? [];
  const totalUsers = usersData?.total ?? 0;
  const { data: clinicsData } = useClinics({ pageSize: 100 });
  const clinics = clinicsData?.data ?? [];
  const { data: doctorsData } = useDoctors({ pageSize: 100 });
  const doctors = doctorsData?.data ?? [];
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      clerkUserId: "",
      name: "",
      email: "",
      role: "OPERATOR",
      clinicIds: [],
    },
  });

  function openEdit(u: SystemUser) {
    setEditing(u);
    form.reset({
      clerkUserId: u.clerkUserId,
      name: u.name,
      email: u.email,
      role: u.role,
      clinicIds: u.clinics?.map((c) => c.id) ?? [],
    });
    setSelectedDoctorId(u.doctorId ?? null);
    setOpen(true);
  }

  async function onSubmit(data: UserFormData) {
    if (!editing) return;
    const doctorId = data.role === "DOCTOR" ? selectedDoctorId : null;
    await updateUser.mutateAsync({
      id: editing.id,
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        clinicIds: data.clinicIds ?? [],
        doctorId,
      },
    });
    setOpen(false);
    form.reset();
    setSelectedDoctorId(null);
  }

  const watchedClinicIds = form.watch("clinicIds") ?? [];

  function toggleClinic(clinicId: number) {
    const current = form.getValues("clinicIds") ?? [];
    const next = current.includes(clinicId)
      ? current.filter((id) => id !== clinicId)
      : [...current, clinicId];
    form.setValue("clinicIds", next);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestión de roles y permisos del sistema. Los usuarios se registran a través del signup.
          </p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
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
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Rol *</Label>
              <Select
                value={form.watch("role")}
                onValueChange={(val) => {
                  form.setValue(
                    "role",
                    (val ?? "OPERATOR") as "ADMIN" | "OPERATOR" | "DOCTOR" | "STANDARD",
                  );
                  if (val !== "DOCTOR") setSelectedDoctorId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="OPERATOR">Operador</SelectItem>
                  <SelectItem value="DOCTOR">Médico</SelectItem>
                  <SelectItem value="STANDARD">Sin permisos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.watch("role") === "DOCTOR" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Doctor vinculado *
                </Label>
                <p className="text-xs text-muted-foreground">
                  Seleccioná el doctor que corresponde a este usuario
                </p>
                <Select
                  value={selectedDoctorId ? String(selectedDoctorId) : ""}
                  onValueChange={(val) => setSelectedDoctorId(val ? Number(val) : null)}
                >
                  <SelectTrigger>
                    {selectedDoctorId
                      ? (() => {
                          const d = doctors.find((doc) => doc.id === selectedDoctorId);
                          return d ? `${d.lastName}, ${d.firstName}` : "Seleccionar doctor";
                        })()
                      : <SelectValue placeholder="Seleccionar doctor" />}
                  </SelectTrigger>
                  <SelectContent>
                    {doctors
                      .filter((d) => {
                        const linkedUsers = users.filter(
                          (u) => u.doctorId === d.id && u.id !== editing?.id,
                        );
                        return linkedUsers.length === 0;
                      })
                      .map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.lastName}, {d.firstName} — {d.specialties?.map((s) => s.name).join(", ")}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Clínicas asignadas
              </Label>
              <p className="text-xs text-muted-foreground">
                Seleccioná las clínicas a las que el usuario tendrá acceso
              </p>
              <div className="rounded-md border p-3 space-y-2 max-h-48 overflow-y-auto">
                {clinics?.length ? (
                  clinics.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-3 py-1 px-1 rounded hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={watchedClinicIds.includes(c.id)}
                        onCheckedChange={() => toggleClinic(c.id)}
                      />
                      <span className="text-sm">{c.name}</span>
                      {c.address && (
                        <span className="text-xs text-muted-foreground ml-auto truncate max-w-[180px]">
                          {c.address}
                        </span>
                      )}
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No hay clínicas disponibles
                  </p>
                )}
              </div>
              {watchedClinicIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {watchedClinicIds.length}{" "}
                  {watchedClinicIds.length === 1
                    ? "clínica seleccionada"
                    : "clínicas seleccionadas"}
                </p>
              )}
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
                disabled={updateUser.isPending}
              >
                Guardar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios del sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !users.length ? (
            <p className="text-center py-8 text-muted-foreground">
              No hay usuarios registrados
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><SortableHeader label="Nombre" field="name" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                    <TableHead><SortableHeader label="Email" field="email" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                    <TableHead><SortableHeader label="Rol" field="role" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                    <TableHead>Clínicas</TableHead>
                    <TableHead className="text-center"><SortableHeader label="Estado" field="active" sort={sort} onSort={(s) => { setSort(s); setPage(1); }} /></TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={
                              u.role === "ADMIN"
                                ? "default"
                                : u.role === "OPERATOR" || u.role === "DOCTOR"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="gap-1 w-fit"
                          >
                            {u.role === "ADMIN" ? (
                              <ShieldCheck className="h-3 w-3" />
                            ) : (
                              <Shield className="h-3 w-3" />
                            )}
                            {u.role === "ADMIN"
                              ? "Admin"
                              : u.role === "OPERATOR"
                                ? "Operador"
                                : u.role === "DOCTOR"
                                  ? "Médico"
                                  : "Sin permisos"}
                          </Badge>
                          {u.role === "DOCTOR" && u.doctor && (
                            <span className="text-xs text-muted-foreground">
                              Dr. {u.doctor.firstName} {u.doctor.lastName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.clinics?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {u.clinics.map((c) => (
                              <Badge
                                key={c.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {c.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={u.active ? "default" : "outline"}>
                          {u.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="cursor-pointer"
                            onClick={() => openEdit(u)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="cursor-pointer"
                            onClick={() => deleteUser.mutate(u.id)}
                            disabled={deleteUser.isPending || !u.active}
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
                total={totalUsers}
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
