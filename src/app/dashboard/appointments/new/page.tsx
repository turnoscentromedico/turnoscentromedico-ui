"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Loader2,
  Search,
  Stethoscope,
  Tag,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AvailabilitySearch } from "@/components/availability-search";
import { AppointmentCalendar } from "@/components/appointment-calendar";
import { ViewGuard } from "@/components/view-guard";
import { useClinics } from "@/hooks/use-clinics";
import { useSpecialties } from "@/hooks/use-specialties";
import { useDoctors } from "@/hooks/use-doctors";
import { usePatients, useCreatePatient } from "@/hooks/use-patients";
import { useCreateAppointment } from "@/hooks/use-appointments";
import { useMe } from "@/hooks/use-role";
import { patientSchema, type PatientFormData } from "@/lib/schemas";
import { PhoneInput, parsePhoneToE164 } from "@/components/phone-input";
import type { Clinic, Doctor, AvailableSlot, Patient, Specialty } from "@/types";

type BookingMode = "specialty" | "doctor";

export default function NewAppointmentPage() {
  const router = useRouter();

  // Mode & navigation
  const [mode, setMode] = useState<BookingMode>("specialty");
  const [step, setStep] = useState(0);

  // Selections
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [notes, setNotes] = useState("");
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatientAreaCode, setNewPatientAreaCode] = useState("");
  const [newPatientNumber, setNewPatientNumber] = useState("");

  // Data
  const { data: me } = useMe();
  const { data: allClinicsData, isLoading: clinicsLoading } = useClinics({ pageSize: 100 });
  const allClinics = allClinicsData?.data;

  const clinics = useMemo(() => {
    if (!allClinics) return undefined;
    if (me?.role === "ADMIN") return allClinics;
    if (me?.clinicIds?.length) {
      return allClinics.filter((c) => me.clinicIds.includes(c.id));
    }
    return allClinics;
  }, [allClinics, me]);

  useEffect(() => {
    if (clinics?.length === 1 && !selectedClinic) {
      setSelectedClinic(clinics[0]);
    }
  }, [clinics, selectedClinic]);
  const { data: specialtiesData } = useSpecialties({ pageSize: 100 });
  const specialties = specialtiesData?.data;
  const { data: doctorsData, isLoading: doctorsLoading } = useDoctors(
    selectedClinic ? { clinicId: selectedClinic.id, pageSize: 100 } : { pageSize: 100 }
  );
  const doctors = doctorsData?.data;
  const { data: patientsData, isLoading: patientsLoading } = usePatients({ pageSize: 100 });
  const patients = patientsData?.data;
  const createAppointment = useCreateAppointment();
  const createPatient = useCreatePatient();

  const patientForm = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: { firstName: "", lastName: "", dni: "", nationality: "", dateOfBirth: "", email: "", phone: "", address: "", cuilCuit: "" },
  });

  // Steps depend on mode
  const STEPS_SPECIALTY = [
    { label: "Clínica", icon: Building2 },
    { label: "Especialidad", icon: Tag },
    { label: "Buscar Turno", icon: CalendarDays },
    { label: "Paciente", icon: UsersRound },
    { label: "Confirmar", icon: Check },
  ];

  const STEPS_DOCTOR = [
    { label: "Clínica", icon: Building2 },
    { label: "Médico", icon: Stethoscope },
    { label: "Calendario", icon: CalendarDays },
    { label: "Paciente", icon: UsersRound },
    { label: "Confirmar", icon: Check },
  ];

  const steps = mode === "specialty" ? STEPS_SPECIALTY : STEPS_DOCTOR;

  function resetSelections() {
    setSelectedSpecialty(null);
    setSelectedDoctor(null);
    setSelectedSlot(null);
    setSelectedPatient(null);
    setStep(0);
  }

  function handleSlotSelect(slot: AvailableSlot) {
    setSelectedSlot(slot);
    if (mode === "specialty" && !selectedDoctor) {
      const doc = doctors?.find((d) => d.id === slot.doctorId);
      if (doc) setSelectedDoctor(doc);
    }
  }

  function canAdvance(): boolean {
    switch (step) {
      case 0: return selectedClinic !== null;
      case 1: return mode === "specialty" ? selectedSpecialty !== null : selectedDoctor !== null;
      case 2: return selectedSlot !== null;
      case 3: return selectedPatient !== null;
      default: return true;
    }
  }

  const filteredSpecialties = useMemo(() => {
    if (!specialties) return [];
    if (!specialtySearch.trim()) return specialties;
    const q = specialtySearch.toLowerCase();
    return specialties.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)),
    );
  }, [specialties, specialtySearch]);

  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];
    if (!doctorSearch.trim()) return doctors;
    const q = doctorSearch.toLowerCase();
    return doctors.filter(
      (d) =>
        d.firstName.toLowerCase().includes(q) ||
        d.lastName.toLowerCase().includes(q) ||
        d.dni.includes(q) ||
        d.licenseNumber.toLowerCase().includes(q) ||
        d.specialty?.name.toLowerCase().includes(q),
    );
  }, [doctors, doctorSearch]);

  const filteredPatients = patients?.filter((p) => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.dni.includes(q) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q))
    );
  });

  async function handleCreatePatient(data: PatientFormData) {
    const composedPhone = parsePhoneToE164(newPatientAreaCode, newPatientNumber);
    const payload = {
      ...data,
      email: data.email || undefined,
      phone: composedPhone || undefined,
      address: data.address || undefined,
      cuilCuit: data.cuilCuit || undefined,
    };
    const newPatient = await createPatient.mutateAsync(payload);
    setSelectedPatient(newPatient);
    setShowNewPatient(false);
    setNewPatientAreaCode("");
    setNewPatientNumber("");
    patientForm.reset();
  }

  async function handleConfirm() {
    if (!selectedClinic || !selectedSlot || !selectedPatient) return;

    const docId = selectedDoctor?.id ?? selectedSlot.doctorId;

    await createAppointment.mutateAsync({
      clinicId: selectedClinic.id,
      doctorId: docId,
      patientId: selectedPatient.id,
      date: selectedSlot.date,
      startTime: selectedSlot.startTime,
      notes: notes || undefined,
    });

    router.push("/dashboard/appointments");
  }

  return (
    <ViewGuard viewId="appointments.new">
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Turno</h1>
        <p className="text-muted-foreground">
          Buscá disponibilidad por especialidad o por médico
        </p>
      </div>

      {/* Mode toggle */}
      {step === 0 && (
        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as BookingMode);
            resetSelections();
          }}
        >
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="specialty" className="flex-1 gap-2">
              <Tag className="h-4 w-4" />
              Por Especialidad
            </TabsTrigger>
            <TabsTrigger value="doctor" className="flex-1 gap-2">
              <Stethoscope className="h-4 w-4" />
              Por Médico
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Step indicators */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => { if (i < step) setStep(i); }}
            disabled={i > step}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              i === step
                ? "bg-primary text-primary-foreground"
                : i < step
                  ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            <s.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </button>
        ))}
      </div>

      {/* Step 0: Clinic */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Elegir Clínica
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clinicsLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {clinics?.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedClinic(c);
                      setSelectedDoctor(null);
                      setSelectedSlot(null);
                    }}
                    className={`group rounded-xl border-2 p-5 text-left transition-all hover:border-primary hover:shadow-sm ${
                      selectedClinic?.id === c.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-transparent bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {c.address ?? "Sin dirección"}
                        </p>
                      </div>
                      {selectedClinic?.id === c.id && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1 — Specialty mode: choose specialty */}
      {step === 1 && mode === "specialty" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Elegir Especialidad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar especialidad..."
                value={specialtySearch}
                onChange={(e) => setSpecialtySearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {!filteredSpecialties.length ? (
              <p className="py-8 text-center text-muted-foreground">
                {specialtySearch.trim()
                  ? "No se encontraron especialidades con esa búsqueda"
                  : "No hay especialidades registradas"}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSpecialties.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSpecialty(s);
                      setSelectedSlot(null);
                      setSelectedDoctor(null);
                    }}
                    className={`group rounded-xl border-2 p-5 text-left transition-all hover:border-primary hover:shadow-sm ${
                      selectedSpecialty?.id === s.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-transparent bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        {s.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                        )}
                        {s._count && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {s._count.doctors} médico{s._count.doctors !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                      {selectedSpecialty?.id === s.id && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 1 — Doctor mode: choose doctor */}
      {step === 1 && mode === "doctor" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Elegir Médico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, DNI, matrícula o especialidad..."
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {doctorsLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : !filteredDoctors.length ? (
              <p className="py-8 text-center text-muted-foreground">
                {doctorSearch.trim()
                  ? "No se encontraron médicos con esa búsqueda"
                  : "No hay doctores en esta clínica"}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDoctors.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDoctor(d);
                      setSelectedSlot(null);
                    }}
                    className={`group rounded-xl border-2 p-5 text-left transition-all hover:border-primary hover:shadow-sm ${
                      selectedDoctor?.id === d.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-transparent bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{d.lastName}, {d.firstName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {d.specialty?.name}
                        </p>
                      </div>
                      {selectedDoctor?.id === d.id && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Specialty mode: calendar + search */}
      {step === 2 && mode === "specialty" && selectedClinic && selectedSpecialty && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm gap-1.5 py-1">
              <Building2 className="h-3.5 w-3.5" />
              {selectedClinic.name}
            </Badge>
            <Badge variant="outline" className="text-sm gap-1.5 py-1">
              <Tag className="h-3.5 w-3.5" />
              {selectedSpecialty.name}
            </Badge>
          </div>

          <Tabs defaultValue="calendar">
            <TabsList>
              <TabsTrigger value="calendar" className="gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Vista Calendario
              </TabsTrigger>
              <TabsTrigger value="search" className="gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Buscar por Fecha
              </TabsTrigger>
            </TabsList>
            <TabsContent value="calendar" className="mt-4">
              <AppointmentCalendar
                clinicId={selectedClinic.id}
                specialtyId={selectedSpecialty.id}
                clinicName={selectedClinic.name}
                onSlotSelect={handleSlotSelect}
                onDeselect={() => setSelectedSlot(null)}
                onNext={() => { if (canAdvance()) setStep((s) => s + 1); }}
                selectedSlot={selectedSlot}
              />
            </TabsContent>
            <TabsContent value="search" className="mt-4">
              <AvailabilitySearch
                clinicId={selectedClinic.id}
                specialtyId={selectedSpecialty.id}
                onSlotSelect={handleSlotSelect}
                selectedSlot={selectedSlot}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Step 2 — Doctor mode: calendar view */}
      {step === 2 && mode === "doctor" && selectedClinic && selectedDoctor && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm gap-1.5 py-1">
              <Building2 className="h-3.5 w-3.5" />
              {selectedClinic.name}
            </Badge>
            <Badge variant="outline" className="text-sm gap-1.5 py-1">
              <Stethoscope className="h-3.5 w-3.5" />
              Dr. {selectedDoctor.lastName}, {selectedDoctor.firstName}
            </Badge>
          </div>

          {/* Tabs: Calendar or Date search */}
          <Tabs defaultValue="calendar">
            <TabsList>
              <TabsTrigger value="calendar" className="gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Vista Calendario
              </TabsTrigger>
              <TabsTrigger value="search" className="gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Buscar por Fecha
              </TabsTrigger>
            </TabsList>
            <TabsContent value="calendar" className="mt-4">
              <AppointmentCalendar
                clinicId={selectedClinic.id}
                doctorId={selectedDoctor.id}
                doctorName={`${selectedDoctor.firstName} ${selectedDoctor.lastName}`}
                clinicName={selectedClinic.name}
                onSlotSelect={handleSlotSelect}
                onDeselect={() => setSelectedSlot(null)}
                onNext={() => { if (canAdvance()) setStep((s) => s + 1); }}
                selectedSlot={selectedSlot}
              />
            </TabsContent>
            <TabsContent value="search" className="mt-4">
              <AvailabilitySearch
                clinicId={selectedClinic.id}
                doctorId={selectedDoctor.id}
                onSlotSelect={handleSlotSelect}
                selectedSlot={selectedSlot}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Step 3: Patient */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5" />
              Seleccionar Paciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => setShowNewPatient(!showNewPatient)}
              >
                {showNewPatient ? "Buscar existente" : "Crear nuevo"}
              </Button>
            </div>

            {showNewPatient ? (
              <form
                onSubmit={patientForm.handleSubmit(handleCreatePatient)}
                className="space-y-3 rounded-xl border-2 border-dashed p-5"
              >
                <p className="text-sm font-semibold">Crear nuevo paciente</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Nombre *</Label>
                    <Input {...patientForm.register("firstName")} />
                    {patientForm.formState.errors.firstName && (
                      <p className="text-xs text-destructive">{patientForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Apellido *</Label>
                    <Input {...patientForm.register("lastName")} />
                    {patientForm.formState.errors.lastName && (
                      <p className="text-xs text-destructive">{patientForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>DNI *</Label>
                    <Input {...patientForm.register("dni")} />
                    {patientForm.formState.errors.dni && (
                      <p className="text-xs text-destructive">{patientForm.formState.errors.dni.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Nacionalidad *</Label>
                    <Input {...patientForm.register("nationality")} />
                    {patientForm.formState.errors.nationality && (
                      <p className="text-xs text-destructive">{patientForm.formState.errors.nationality.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Fecha de nacimiento *</Label>
                    <Input type="date" {...patientForm.register("dateOfBirth")} />
                    {patientForm.formState.errors.dateOfBirth && (
                      <p className="text-xs text-destructive">{patientForm.formState.errors.dateOfBirth.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>CUIL/CUIT</Label>
                    <Input {...patientForm.register("cuilCuit")} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" {...patientForm.register("email")} />
                  {patientForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{patientForm.formState.errors.email.message}</p>
                  )}
                </div>
                <PhoneInput
                  areaCode={newPatientAreaCode}
                  number={newPatientNumber}
                  onAreaCodeChange={setNewPatientAreaCode}
                  onNumberChange={setNewPatientNumber}
                  compact
                />
                <div className="space-y-1">
                  <Label>Dirección</Label>
                  <Input {...patientForm.register("address")} />
                </div>
                <Button type="submit" disabled={createPatient.isPending} size="sm" className="gap-2 cursor-pointer">
                  {createPatient.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {createPatient.isPending ? "Creando..." : "Crear Paciente"}
                </Button>
              </form>
            ) : patientsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {filteredPatients?.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatient(p)}
                    className={`w-full rounded-xl border-2 p-4 text-left transition-all hover:border-primary ${
                      selectedPatient?.id === p.id
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          DNI: {p.dni}
                          {p.email ? ` · ${p.email}` : ""}
                          {p.phone ? ` · ${p.phone}` : ""}
                        </p>
                      </div>
                      {selectedPatient?.id === p.id && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
                {!filteredPatients?.length && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No se encontraron pacientes
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Confirmar Turno
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Clínica</span>
                </div>
                <p className="font-semibold">{selectedClinic?.name}</p>
              </div>
              <div className="rounded-xl border p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Stethoscope className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Doctor</span>
                </div>
                <p className="font-semibold">
                  Dr. {selectedDoctor ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}` : selectedSlot?.doctorName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedDoctor?.specialty?.name ?? selectedSlot?.specialtyName}
                </p>
              </div>
              <div className="rounded-xl border p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Fecha y Hora</span>
                </div>
                <p className="font-semibold">
                  {selectedSlot
                    ? format(
                        new Date(selectedSlot.date + "T00:00:00"),
                        "EEEE d 'de' MMMM, yyyy",
                        { locale: es }
                      )
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedSlot?.startTime} — {selectedSlot?.endTime}
                </p>
              </div>
              <div className="rounded-xl border p-4 space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UsersRound className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Paciente</span>
                </div>
                <p className="font-semibold">
                  {selectedPatient?.firstName} {selectedPatient?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{selectedPatient?.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 pb-8">
        <Button
          variant="outline"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Anterior
        </Button>
        {step < 4 ? (
          <Button disabled={!canAdvance()} onClick={() => setStep((s) => s + 1)}>
            Siguiente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleConfirm}
            disabled={createAppointment.isPending}
            className="gap-2 cursor-pointer"
          >
            {createAppointment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {createAppointment.isPending ? "Creando turno..." : "Confirmar Turno"}
          </Button>
        )}
      </div>
    </div>
    </ViewGuard>
  );
}
