import type {
  ApiResponse,
  Appointment,
  AvailableSlot,
  BulkScheduleInput,
  Clinic,
  CreateAppointmentInput,
  CreateClinicInput,
  CreateDoctorInput,
  CreatePatientInput,
  CreateScheduleInput,
  CreateSpecialtyInput,
  CreateUnavailabilityInput,
  CreateUserInput,
  DashboardStats,
  Doctor,
  DoctorUnavailability,
  MeResponse,
  PaginatedResponse,
  PaginationParams,
  Patient,
  Schedule,
  SetupStatus,
  Specialty,
  SystemUser,
  UpdateClinicInput,
  UpdateDoctorInput,
  UpdatePatientInput,
  UpdateScheduleInput,
  UpdateSpecialtyInput,
  UpdateUserInput,
  AppSettings,
  InternalNotification,
  MedicalRecord,
  CreateMedicalRecordInput,
  UpdateMedicalRecordInput,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type TokenGetter = () => Promise<string | null>;

class ApiClient {
  private tokenGetter: TokenGetter | null = null;

  setTokenGetter(getter: TokenGetter) {
    this.tokenGetter = getter;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    };

    if (this.tokenGetter) {
      const token = await this.tokenGetter();
      if (token) {
        (headers as Record<string, string>)["Authorization"] =
          `Bearer ${token}`;
      }
    }

    let res: Response;
    try {
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    } catch {
      throw new Error(
        "No se pudo conectar con el servidor. Verificá que el backend esté corriendo en " + BASE_URL
      );
    }

    if (res.status === 204) return undefined as T;

    const json: ApiResponse<T> = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message ?? json.error ?? "Error desconocido");
    }

    return json.data as T;
  }

  private async requestPaginated<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<PaginatedResponse<T>> {
    const headers: HeadersInit = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    };

    if (this.tokenGetter) {
      const token = await this.tokenGetter();
      if (token) {
        (headers as Record<string, string>)["Authorization"] =
          `Bearer ${token}`;
      }
    }

    let res: Response;
    try {
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    } catch {
      throw new Error(
        "No se pudo conectar con el servidor. Verificá que el backend esté corriendo en " + BASE_URL
      );
    }

    const json: ApiResponse<T[]> = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message ?? json.error ?? "Error desconocido");
    }

    return {
      data: json.data as T[],
      total: json.total ?? 0,
      page: json.page ?? 1,
      pageSize: json.pageSize ?? 25,
    };
  }

  private buildPaginatedQs(
    sp: URLSearchParams,
    pagination?: PaginationParams,
  ): string {
    if (pagination?.page) sp.set("page", String(pagination.page));
    if (pagination?.pageSize) sp.set("pageSize", String(pagination.pageSize));
    if (pagination?.sortBy) sp.set("sortBy", pagination.sortBy);
    if (pagination?.sortOrder) sp.set("sortOrder", pagination.sortOrder);
    const qs = sp.toString();
    return qs ? `?${qs}` : "";
  }

  // ── Auth / Setup ──
  async getSetupStatus(): Promise<SetupStatus> {
    const res = await fetch(`${BASE_URL}/api/auth/setup-status`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? "Error al verificar estado");
    return json.success ? json.data : json;
  }

  getMe() {
    return this.request<MeResponse>("/api/me");
  }

  // ── Dashboard ──
  getDashboardStats() {
    return this.request<DashboardStats>("/api/dashboard/stats");
  }

  // ── Clinics ──
  getClinics(pagination?: PaginationParams) {
    const sp = new URLSearchParams();
    return this.requestPaginated<Clinic>(`/api/clinics${this.buildPaginatedQs(sp, pagination)}`);
  }
  getClinic(id: number) {
    return this.request<Clinic>(`/api/clinics/${id}`);
  }
  createClinic(data: CreateClinicInput) {
    return this.request<Clinic>("/api/clinics", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  updateClinic(id: number, data: UpdateClinicInput) {
    return this.request<Clinic>(`/api/clinics/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  deleteClinic(id: number) {
    return this.request<void>(`/api/clinics/${id}`, { method: "DELETE" });
  }

  // ── Specialties ──
  getSpecialties(pagination?: PaginationParams) {
    const sp = new URLSearchParams();
    return this.requestPaginated<Specialty>(`/api/specialties${this.buildPaginatedQs(sp, pagination)}`);
  }
  getSpecialty(id: number) {
    return this.request<Specialty>(`/api/specialties/${id}`);
  }
  createSpecialty(data: CreateSpecialtyInput) {
    return this.request<Specialty>("/api/specialties", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  updateSpecialty(id: number, data: UpdateSpecialtyInput) {
    return this.request<Specialty>(`/api/specialties/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  deleteSpecialty(id: number) {
    return this.request<void>(`/api/specialties/${id}`, { method: "DELETE" });
  }

  // ── Doctors ──
  getDoctors(params?: { clinicId?: number; specialtyId?: number } & PaginationParams) {
    const sp = new URLSearchParams();
    if (params?.clinicId) sp.set("clinicId", String(params.clinicId));
    if (params?.specialtyId) sp.set("specialtyId", String(params.specialtyId));
    return this.requestPaginated<Doctor>(`/api/doctors${this.buildPaginatedQs(sp, params)}`);
  }
  getDoctor(id: number) {
    return this.request<Doctor>(`/api/doctors/${id}`);
  }
  createDoctor(data: CreateDoctorInput) {
    return this.request<Doctor>("/api/doctors", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  updateDoctor(id: number, data: UpdateDoctorInput) {
    return this.request<Doctor>(`/api/doctors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  deleteDoctor(id: number) {
    return this.request<void>(`/api/doctors/${id}`, { method: "DELETE" });
  }

  // ── Schedules ──
  getDoctorSchedules(doctorId: number) {
    return this.request<Schedule[]>(`/api/schedules/doctor/${doctorId}`);
  }
  createSchedule(data: CreateScheduleInput) {
    return this.request<Schedule>("/api/schedules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  updateSchedule(id: number, data: UpdateScheduleInput) {
    return this.request<Schedule>(`/api/schedules/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  deleteSchedule(id: number) {
    return this.request<void>(`/api/schedules/${id}`, { method: "DELETE" });
  }
  bulkReplaceSchedules(doctorId: number, data: BulkScheduleInput) {
    return this.request<Schedule[]>(`/api/schedules/doctor/${doctorId}/bulk`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ── Doctor Unavailabilities ──
  getDoctorUnavailabilities(doctorId: number) {
    return this.request<DoctorUnavailability[]>(`/api/unavailabilities/doctor/${doctorId}`);
  }
  createUnavailability(data: CreateUnavailabilityInput) {
    return this.request<DoctorUnavailability>("/api/unavailabilities", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  deleteUnavailability(id: number) {
    return this.request<void>(`/api/unavailabilities/${id}`, { method: "DELETE" });
  }

  // ── Patients ──
  getPatients(pagination?: PaginationParams) {
    const sp = new URLSearchParams();
    return this.requestPaginated<Patient>(`/api/patients${this.buildPaginatedQs(sp, pagination)}`);
  }
  getPatient(id: number) {
    return this.request<Patient>(`/api/patients/${id}`);
  }
  createPatient(data: CreatePatientInput) {
    return this.request<Patient>("/api/patients", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  updatePatient(id: number, data: UpdatePatientInput) {
    return this.request<Patient>(`/api/patients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  deletePatient(id: number) {
    return this.request<void>(`/api/patients/${id}`, { method: "DELETE" });
  }

  // ── Appointments ──
  getAvailableSlots(params: {
    clinicId: number;
    doctorId: number;
    date: string;
  }) {
    const sp = new URLSearchParams({
      clinicId: String(params.clinicId),
      doctorId: String(params.doctorId),
      date: params.date,
    });
    return this.request<AvailableSlot[]>(`/api/appointments/available?${sp}`);
  }

  getAvailableSlotsRange(params: {
    clinicId: number;
    doctorId?: number;
    specialtyId?: number;
    startDate: string;
    endDate: string;
  }) {
    const sp = new URLSearchParams({
      clinicId: String(params.clinicId),
      startDate: params.startDate,
      endDate: params.endDate,
    });
    if (params.doctorId) sp.set("doctorId", String(params.doctorId));
    if (params.specialtyId) sp.set("specialtyId", String(params.specialtyId));
    return this.request<AvailableSlot[]>(`/api/appointments/available-range?${sp}`);
  }

  getAvailableSlotsBySpecialty(params: {
    clinicId: number;
    specialtyId: number;
    date: string;
  }) {
    const sp = new URLSearchParams({
      clinicId: String(params.clinicId),
      specialtyId: String(params.specialtyId),
      date: params.date,
    });
    return this.request<AvailableSlot[]>(
      `/api/appointments/available-by-specialty?${sp}`
    );
  }

  createAppointment(data: CreateAppointmentInput) {
    return this.request<Appointment>("/api/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  getAppointments(params?: {
    clinicId?: number;
    doctorId?: number;
    patientId?: number;
    date?: string;
  } & PaginationParams) {
    const sp = new URLSearchParams();
    if (params?.clinicId) sp.set("clinicId", String(params.clinicId));
    if (params?.doctorId) sp.set("doctorId", String(params.doctorId));
    if (params?.patientId) sp.set("patientId", String(params.patientId));
    if (params?.date) sp.set("date", params.date);
    return this.requestPaginated<Appointment>(`/api/appointments${this.buildPaginatedQs(sp, params)}`);
  }

  getAppointment(id: number) {
    return this.request<Appointment>(`/api/appointments/${id}`);
  }

  confirmAppointment(id: number) {
    return this.request<Appointment>(`/api/appointments/${id}/confirm`, {
      method: "PATCH",
    });
  }

  cancelAppointment(id: number) {
    return this.request<Appointment>(`/api/appointments/${id}/cancel`, {
      method: "PATCH",
    });
  }

  resendConfirmation(id: number) {
    return this.request<Appointment>(`/api/appointments/${id}/resend-confirmation`, {
      method: "PATCH",
    });
  }

  // ── System Users ──
  getUsers(pagination?: PaginationParams) {
    const sp = new URLSearchParams();
    return this.requestPaginated<SystemUser>(`/api/users${this.buildPaginatedQs(sp, pagination)}`);
  }
  getUser(id: number) {
    return this.request<SystemUser>(`/api/users/${id}`);
  }
  createUser(data: CreateUserInput) {
    return this.request<SystemUser>("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  updateUser(id: number, data: UpdateUserInput) {
    return this.request<SystemUser>(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  deleteUser(id: number) {
    return this.request<void>(`/api/users/${id}`, { method: "DELETE" });
  }

  // ── Settings ──
  getSettings() {
    return this.request<AppSettings>("/api/settings");
  }

  updateSettings(data: Partial<AppSettings>) {
    return this.request<AppSettings>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ── Internal Notifications ──
  getNotifications(pagination?: PaginationParams) {
    const sp = new URLSearchParams();
    return this.requestPaginated<InternalNotification>(`/api/notifications${this.buildPaginatedQs(sp, pagination)}`);
  }
  getUnreadNotificationCount() {
    return this.request<{ count: number }>("/api/notifications/unread-count");
  }
  markNotificationRead(id: number) {
    return this.request<InternalNotification>(`/api/notifications/${id}/read`, {
      method: "PATCH",
    });
  }
  markAllNotificationsRead() {
    return this.request<void>("/api/notifications/read-all", {
      method: "PATCH",
    });
  }

  // ── User Preferences ──
  getUserPreferences(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/api/user-preferences");
  }

  updateUserPreferences(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/api/user-preferences", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ── Medical Records ──
  getMedicalRecords(patientId: number, params?: PaginationParams & { entryType?: string }) {
    const sp = new URLSearchParams();
    if (params?.entryType) sp.set("entryType", params.entryType);
    return this.requestPaginated<MedicalRecord>(
      `/api/patients/${patientId}/medical-records${this.buildPaginatedQs(sp, params)}`,
    );
  }

  getMedicalRecord(id: number) {
    return this.request<MedicalRecord>(`/api/medical-records/${id}`);
  }

  createMedicalRecord(patientId: number, data: CreateMedicalRecordInput) {
    return this.request<MedicalRecord>(`/api/patients/${patientId}/medical-records`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateMedicalRecord(id: number, data: UpdateMedicalRecordInput) {
    return this.request<MedicalRecord>(`/api/medical-records/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  deleteMedicalRecord(id: number) {
    return this.request<void>(`/api/medical-records/${id}`, { method: "DELETE" });
  }

  // ── Health ──
  async healthCheck(): Promise<{ status: string; environment?: string; services?: Record<string, boolean> }> {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error("API no disponible");
    return res.json();
  }
}

export const apiClient = new ApiClient();
