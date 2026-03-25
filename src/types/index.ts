// ── Roles ──
export type UserRole = "ADMIN" | "OPERATOR" | "STANDARD";

// ── Auth ──
export interface MeResponse {
  userId: string;
  systemUserId: number;
  role: UserRole;
  clinicIds: number[];
}

export interface SetupStatus {
  hasAdmin: boolean;
  needsSetup: boolean;
  userCount: number;
}

// ── Dashboard Stats ──
export interface DashboardStats {
  clinics: number;
  doctors: number;
  patients: number;
  specialties: number;
  users: number;
  appointments: {
    total: number;
    byStatus: Record<string, number>;
  };
}

// ── Clinic ──
export interface Clinic {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    doctors: number;
    appointments: number;
  };
}

export interface CreateClinicInput {
  name: string;
  address?: string;
  phone?: string;
}

export interface UpdateClinicInput {
  name?: string;
  address?: string;
  phone?: string;
}

// ── Specialty ──
export interface Specialty {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    doctors: number;
  };
}

export interface CreateSpecialtyInput {
  name: string;
  description?: string;
}

export interface UpdateSpecialtyInput {
  name?: string;
  description?: string;
}

// ── Doctor ──
export interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  dni: string;
  nationality: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  address: string | null;
  licenseNumber: string;
  specialtyId: number;
  clinicId: number;
  specialty: Specialty;
  clinic: Clinic;
  createdAt: string;
  updatedAt: string;
  _count?: {
    appointments: number;
    schedule: number;
  };
}

export interface CreateDoctorInput {
  firstName: string;
  lastName: string;
  dni: string;
  nationality?: string;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  licenseNumber: string;
  specialtyId: number;
  clinicId: number;
}

export interface UpdateDoctorInput {
  firstName?: string;
  lastName?: string;
  dni?: string;
  nationality?: string;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  licenseNumber?: string;
  specialtyId?: number;
  clinicId?: number;
}

export interface BulkScheduleItem {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration?: number;
  lunchBreakStart?: string | null;
  lunchBreakEnd?: string | null;
  active?: boolean;
}

export interface BulkScheduleInput {
  schedules: BulkScheduleItem[];
}

// ── Schedule ──
export interface Schedule {
  id: number;
  doctorId: number;
  dayOfWeek: number; // 0 = Sunday … 6 = Saturday
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  slotDuration: number;
  lunchBreakStart: string | null;
  lunchBreakEnd: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleInput {
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration?: number;
  lunchBreakStart?: string | null;
  lunchBreakEnd?: string | null;
  active?: boolean;
}

export interface UpdateScheduleInput {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  slotDuration?: number;
  lunchBreakStart?: string | null;
  lunchBreakEnd?: string | null;
  active?: boolean;
}

// ── Doctor Unavailability ──
export interface DoctorUnavailability {
  id: number;
  doctorId: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  createdAt: string;
}

export interface CreateUnavailabilityInput {
  doctorId: number;
  date: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

// ── Patient ──
export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dni: string;
  nationality: string;
  dateOfBirth: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  cuilCuit: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    appointments: number;
  };
}

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  dni: string;
  nationality: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
  address?: string;
  cuilCuit?: string;
}

export interface UpdatePatientInput {
  firstName?: string;
  lastName?: string;
  dni?: string;
  nationality?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  cuilCuit?: string;
}

// ── Appointment ──
export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  specialtyId: number;
  clinicId: number;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  status: AppointmentStatus;
  notes: string | null;
  doctor: Doctor;
  patient: Patient;
  clinic: Clinic;
  specialty: Specialty;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableSlot {
  doctorId: number;
  doctorName: string;
  specialtyId: number;
  specialtyName: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface CreateAppointmentInput {
  clinicId: number;
  doctorId: number;
  patientId: number;
  date: string;      // "YYYY-MM-DD"
  startTime: string;  // "HH:mm"
  notes?: string;
}

// ── System User ──
export interface SystemUser {
  id: number;
  clerkUserId: string;
  name: string;
  email: string;
  role: UserRole;
  clinics: Clinic[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  clerkUserId: string;
  name: string;
  email: string;
  role: UserRole;
  clinicIds?: number[];
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  clinicIds?: number[];
}

// ── Settings ──
export interface AppSettings {
  "calendar.slotMinTime": string;
  "calendar.slotMaxTime": string;
  "calendar.show24h": string;
  [key: string]: string;
}

// ── Internal Notifications ──
export interface InternalNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  read: boolean;
  clinicId: number | null;
  clinic?: Clinic | null;
  createdAt: string;
}

// ── Pagination ──
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ── API ──
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  total?: number;
  page?: number;
  pageSize?: number;
  error?: string;
  message?: string;
  statusCode?: number;
}
