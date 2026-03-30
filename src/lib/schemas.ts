import { z } from "zod";

export const clinicSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export const specialtySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
});

export const doctorSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  dni: z.string().min(1, "El DNI es requerido"),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  licenseNumber: z.string().min(1, "El número de matrícula es requerido"),
  specialtyIds: z.array(z.number()).min(1, "Seleccioná al menos una especialidad"),
  clinicId: z.number().min(1, "Seleccioná una clínica"),
});

export const scheduleSchema = z.object({
  doctorId: z.number(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm"),
  slotDuration: z.number().min(5),
  active: z.boolean(),
});

export const patientSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  dni: z.string().min(1, "El DNI es requerido"),
  nationality: z.string().min(1, "La nacionalidad es requerida"),
  dateOfBirth: z.string().min(1, "La fecha de nacimiento es requerida"),
  email: z.string().email("Email inválido").or(z.literal("")).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  cuilCuit: z.string().optional(),
});

export const appointmentSchema = z.object({
  clinicId: z.number().min(1, "Seleccioná una clínica"),
  doctorId: z.number().min(1, "Seleccioná un doctor"),
  specialtyId: z.number().min(1, "Seleccioná una especialidad"),
  patientId: z.number().min(1, "Seleccioná un paciente"),
  date: z.string().min(1, "Seleccioná una fecha"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Seleccioná un horario"),
  notes: z.string().optional(),
});

export const userSchema = z.object({
  clerkUserId: z.string().min(1, "El Clerk User ID es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  role: z.enum(["ADMIN", "OPERATOR", "DOCTOR", "STANDARD"]),
  clinicIds: z.array(z.number()).optional(),
});

export type ClinicFormData = z.infer<typeof clinicSchema>;
export type SpecialtyFormData = z.infer<typeof specialtySchema>;
export type DoctorFormData = z.infer<typeof doctorSchema>;
export type ScheduleFormData = z.infer<typeof scheduleSchema>;
export type PatientFormData = z.infer<typeof patientSchema>;
export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type UserFormData = z.infer<typeof userSchema>;
