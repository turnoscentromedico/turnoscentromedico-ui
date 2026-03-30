# AdminDoctor - Backend: Guia Tecnica Completa

## 1. Vision General

AdminDoctor es un sistema de administracion de clinicas y centros medicos. El backend es una API REST construida con **Fastify v5** y **TypeScript**, con base de datos **PostgreSQL** (via **Prisma ORM**), cola de trabajos con **BullMQ + Redis (Upstash)**, autenticacion con **Clerk**, notificaciones por email con **Resend** y por WhatsApp con la **Meta Cloud API**.

---

## 2. Stack Tecnologico

| Componente | Tecnologia | Version |
|---|---|---|
| Runtime | Node.js | ES2022 |
| Framework HTTP | Fastify | 5.2.x |
| Lenguaje | TypeScript | 5.7.x |
| ORM | Prisma Client | 6.5.x |
| Base de datos | PostgreSQL | Neon (serverless) |
| Validacion | Zod | 3.24.x |
| Cola de trabajos | BullMQ | 5.0.x |
| Redis | Upstash Redis | TLS (rediss://) |
| Autenticacion | Clerk Backend SDK | 3.2.x |
| Email | Resend | 4.0.x |
| WhatsApp | Meta Graph API | v22.0 |
| Logging | Pino | 9.6.x |
| Testing | Vitest | 3.0.x |
| Board de colas | @bull-board | 6.0.x |

---

## 3. Estructura del Proyecto

```
svc-appointments/
  prisma/
    schema.prisma          # Definicion del esquema de BD
    migrations/            # Migraciones SQL
    seed.ts                # Script de seed
  src/
    server.ts              # Entry point: inicia Fastify + Worker
    app.ts                 # Configuracion de la app, plugins, rutas
    lib/
      prisma.ts            # Instancia compartida del PrismaClient
    middlewares/
      auth.middleware.ts   # Verificacion de token Clerk + carga de usuario
      role.middleware.ts   # Guards por rol (Staff, Operator, Admin)
    modules/
      appointment/         # Turnos: CRUD, disponibilidad, acciones
      clinic/              # Clinicas: CRUD
      doctor/              # Doctores: CRUD con cascade
      medical-record/      # Historia clinica: CRUD
      notification/        # Notificaciones internas
      patient/             # Pacientes: CRUD
      schedule/            # Horarios de doctores
      settings/            # Configuracion global del sistema
      specialty/           # Especialidades: CRUD
      unavailability/      # Excepciones de disponibilidad
      user/                # Usuarios del sistema
      user-preference/     # Preferencias de usuario (JSON)
    plugins/
      prisma.ts            # Plugin Fastify para inyectar prisma
      bull-board.ts        # Dashboard visual de colas
    queue/
      index.ts             # Conexion Redis (parse rediss://)
      appointment.queue.ts # Definicion de cola y funciones de enqueue
      appointment.worker.ts# Worker que procesa notificaciones
    services/
      notification.service.ts  # Envio de email y WhatsApp
    utils/
      config.ts            # Carga y validacion de variables de entorno
      errors.ts            # Clases de error y handler global
      logger.ts            # Configuracion de Pino
      pagination.ts        # Utilidades de paginacion y sorting
  tsconfig.json
  package.json
```

---

## 4. Variables de Entorno

Definidas y validadas con Zod en `src/utils/config.ts`:

| Variable | Requerida | Default | Descripcion |
|---|---|---|---|
| `DATABASE_URL` | Si | - | URL de conexion a PostgreSQL (Neon) |
| `HOST` | No | `0.0.0.0` | Host del servidor |
| `PORT` | No | `3000` | Puerto del servidor |
| `NODE_ENV` | No | `development` | Entorno: development, production, test |
| `LOG_LEVEL` | No | `info` | Nivel de logging de Pino |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Origen CORS permitido |
| `FRONTEND_URL` | No | `http://localhost:3000` | URL base del frontend (para links en emails) |
| `REDIS_URL` | No | `redis://localhost:6379` | URL de Redis/Upstash (soporta `rediss://` con TLS) |
| `CLERK_SECRET_KEY` | No* | - | Clave secreta de Clerk para verificar tokens |
| `CLERK_PUBLISHABLE_KEY` | No* | - | Clave publica de Clerk |
| `RESEND_API_KEY` | No | - | API key de Resend para emails |
| `RESEND_FROM_EMAIL` | No | `turnos@tuclinica.com` | Email remitente |
| `WHATSAPP_ACCESS_TOKEN` | No | - | Token de acceso de Meta WhatsApp |
| `WHATSAPP_PHONE_NUMBER_ID` | No | - | ID del numero de telefono WhatsApp Business |
| `WHATSAPP_RECIPIENT_PHONE` | No | - | Numero destino (solo sandbox) |

*Si no estan configuradas, Clerk opera en modo desarrollo sin verificacion real.

---

## 5. Esquema de Base de Datos

### 5.1 Modelos principales

- **User**: Usuario del sistema, vinculado a Clerk via `clerkUserId`. Roles: `ADMIN`, `OPERATOR`, `DOCTOR`, `STANDARD`. Puede tener clinicas asignadas y un `doctorId` si es medico.
- **Clinic**: Centro medico/clinica. Tiene doctores y turnos asociados.
- **Specialty**: Especialidad medica. Relacion M:N con Doctor (tabla implicita `_DoctorToSpecialty`).
- **Doctor**: Profesional medico. Pertenece a una clinica, tiene multiples especialidades, horarios y turnos.
- **Patient**: Paciente con datos personales, turnos e historia clinica.
- **DoctorSchedule**: Horario semanal del doctor (por dia de semana, con duracion de slot y pausa para almuerzo).
- **DoctorUnavailability**: Excepciones de disponibilidad (vacaciones, ausencias).
- **Appointment**: Turno con paciente, doctor, especialidad, clinica, fecha/hora, estado. Constraint unico: `[doctorId, date, startTime]` (impide doble reserva).
- **AppointmentActionToken**: Tokens de uso unico para confirmar/cancelar turnos desde email (expiran en 72hs).
- **InternalNotification**: Notificaciones internas para operadores (ej: turno cancelado por paciente).
- **Setting**: Configuracion global clave-valor (notificaciones, vistas por rol, etc.).
- **UserPreference**: Preferencias de usuario como JSON (pageSize, tema, etc.).
- **MedicalRecord**: Entradas de historia clinica (manuales y automaticas), con datos clinicos y signos vitales.

### 5.2 Relaciones clave

- Doctor <-> Specialty: muchos a muchos (tabla implicita)
- Doctor -> Clinic: muchos a uno
- Appointment -> Doctor, Patient, Specialty, Clinic
- MedicalRecord -> Patient (1:N), Appointment (N:1 opcional)
- User -> Doctor: uno a uno opcional (para rol DOCTOR)
- User <-> Clinic: muchos a muchos (tabla implicita `_UserClinics`)

### 5.3 Cascadas

- Eliminar Patient: cascade en Appointment y MedicalRecord
- Eliminar Doctor: cascade en DoctorSchedule, Appointment (con notificacion)
- Eliminar Appointment: cascade en ActionToken

---

## 6. Autenticacion y Autorizacion

### 6.1 Flujo de autenticacion

1. El frontend envia el token JWT de Clerk en el header `Authorization: Bearer <token>`
2. El middleware `verifyAuth` (`auth.middleware.ts`) verifica el token con `@clerk/backend`
3. Si el token es valido, extrae `userId` (Clerk ID) y busca el usuario en la BD
4. Inyecta en `request`: `userId`, `systemUserId`, `userRole`, `userClinicIds`, `doctorId`
5. Si el usuario no existe en la BD, lo crea automaticamente con rol `STANDARD`

### 6.2 Niveles de acceso (scopes)

```
Publico (sin auth)
  └── GET /health
  └── GET /api/auth/setup-status
  └── GET /api/clinics, /api/specialties, /api/doctors (lectura publica)
  └── GET /api/appointments/available* (disponibilidad publica)
  └── POST/GET /api/appointments/action/* (acciones via token)
  └── GET /api/settings (lectura publica)

Autenticado (verifyAuth)
  └── GET /api/me
  └── /api/user-preferences

  Staff (ADMIN + OPERATOR + DOCTOR)
    └── GET /api/appointments (filtrado por doctorId si es DOCTOR)
    └── GET /api/patients, /api/patients/:id
    └── /api/patients/:patientId/medical-records
    └── GET /api/dashboard/stats

  Operator (ADMIN + OPERATOR)
    └── POST/PUT/DELETE /api/patients
    └── POST/PATCH/DELETE /api/appointments
    └── CRUD /api/specialties, /api/doctors
    └── CRUD /api/schedules, /api/unavailabilities
    └── /api/notifications

  Admin (ADMIN)
    └── CRUD /api/clinics
    └── CRUD /api/users
    └── PUT /api/settings
```

### 6.3 Rol DOCTOR

Los doctores solo ven sus propios turnos. `appointmentReadRoutes` filtra automaticamente por `request.doctorId`. El dashboard stats tambien se filtra.

---

## 7. Sistema de Notificaciones

### 7.1 Arquitectura

```
Accion (crear/confirmar/cancelar turno)
    ↓
appointment.service.ts → enqueueXxxNotification()
    ↓
BullMQ Queue ("appointment-notifications")
    ↓
appointment.worker.ts → processJob()
    ↓  consulta settings (email/whatsapp habilitado?)
NotificationService.notify()
    ↓         ↓
sendEmail()  sendWhatsApp()
(Resend)     (Meta API v22)
```

### 7.2 Tipos de notificacion

| Tipo | Cuando se envia | Email | WhatsApp |
|---|---|---|---|
| `confirmation` | Al crear un turno | Si | Si (con boton CTA Confirmar) |
| `confirmed` | Al confirmar un turno | Si | Si (texto) |
| `cancelled` | Al cancelar un turno | Si | Si (texto) |
| `reminder-24h` | 24 horas antes del turno | Si | Si |
| `reminder-2h` | 2 horas antes del turno | Si | Si |

### 7.3 Cola BullMQ

- **Cola**: `appointment-notifications`
- **Reintentos**: 3 intentos con backoff exponencial (2s base)
- **Jobs inmediatos**: confirmation, confirmed, cancelled
- **Jobs con delay**: reminder-24h, reminder-2h (calculado segun fecha del turno)
- **Cancelacion de jobs**: al cancelar un turno, se eliminan los reminders pendientes

### 7.4 Tokens de accion

Cuando se crea o confirma un turno, se generan tokens de uso unico (UUID) con expiracion de 72 horas. Estos se incluyen como links en emails y botones CTA en WhatsApp para que el paciente pueda confirmar o cancelar directamente.

### 7.5 Notificaciones internas

Al cancelar un turno (por paciente via token), se genera una `InternalNotification` visible en el panel para ADMIN y OPERATOR.

### 7.6 Toggles

En Settings existen dos claves:
- `notifications.emailEnabled`: habilita/deshabilita emails
- `notifications.whatsappEnabled`: habilita/deshabilita WhatsApp

El worker consulta estos valores antes de enviar cada notificacion.

---

## 8. Historia Clinica

### 8.1 Entradas automaticas

Se crean automaticamente al cambiar el estado de un turno:
- `auto_created`: al crear el turno
- `auto_confirmed`: al confirmar
- `auto_cancelled`: al cancelar
- `auto_completed`: al completar
- `auto_no_show`: al marcar no-show

Cada entrada queda vinculada al `appointmentId` correspondiente.

### 8.2 Entradas manuales

Los usuarios con permiso de `medical-records` pueden crear entradas manuales con:
- Fecha, motivo, diagnostico, tratamiento, indicaciones, estudios, observaciones
- Signos vitales opcionales: peso, altura, presion arterial, temperatura, frecuencia cardiaca

Solo las entradas manuales pueden editarse o eliminarse.

---

## 9. Paginacion y Ordenamiento

Todos los endpoints de lista soportan:

**Query params:**
- `page` (default: 1)
- `pageSize` (default: 25)
- `sortBy` (nombre del campo)
- `sortOrder` (`asc` | `desc`)

**Respuesta:**
```json
{
  "success": true,
  "data": [...],
  "total": 150,
  "page": 1,
  "pageSize": 25
}
```

La utilidad `pagination.ts` provee `paginationArgs()` (skip/take) y `buildOrderBy()` (con validacion de campos permitidos y soporte para campos anidados como `specialty.name`).

---

## 10. Disponibilidad y Reserva de Turnos

### 10.1 Calculo de disponibilidad

1. Se obtienen los horarios del doctor (`DoctorSchedule`) para el dia de la semana
2. Se generan slots segun `startTime`, `endTime` y `slotDuration`
3. Se excluyen slots durante `lunchBreakStart`-`lunchBreakEnd`
4. Se excluyen slots cubiertos por `DoctorUnavailability`
5. Se excluyen slots ya reservados (`Appointment` existente con ese `doctorId, date, startTime`)
6. Se excluyen slots en el pasado

### 10.2 Reserva

- Constraint unico `[doctorId, date, startTime]` impide doble reserva a nivel de BD
- Al reservar, se valida que el doctor tenga la especialidad seleccionada
- Un doctor con turno en un slot queda bloqueado para cualquier especialidad (el slot es del doctor, no de la especialidad)

### 10.3 Endpoints de disponibilidad

- `GET /api/appointments/available?clinicId&doctorId&date` - slots de un doctor en un dia
- `GET /api/appointments/available-range?clinicId&doctorId&specialtyId&startDate&endDate` - rango de dias
- `GET /api/appointments/available-by-specialty?clinicId&specialtyId&date` - por especialidad (todos los doctores)

---

## 11. Configuracion del Sistema (Settings)

Almacenada como clave-valor en la tabla `settings`:

| Clave | Tipo | Descripcion |
|---|---|---|
| `notifications.emailEnabled` | `"true"/"false"` | Habilitar notificaciones por email |
| `notifications.whatsappEnabled` | `"true"/"false"` | Habilitar notificaciones por WhatsApp |
| `views.OPERATOR` | JSON | Permisos de vistas para rol Operador |
| `views.DOCTOR` | JSON | Permisos de vistas para rol Doctor |
| `calendar.show24h` | `"true"/"false"` | Mostrar 24hs en calendario |
| `calendar.startHour` | `"08:00"` | Hora inicio del calendario |
| `calendar.endHour` | `"20:00"` | Hora fin del calendario |

---

## 12. Instalacion del Entorno de Desarrollo

### 12.1 Prerequisitos

- Node.js 18+
- PostgreSQL (o cuenta en Neon)
- Redis (o cuenta en Upstash)
- Cuenta en Clerk (para autenticacion)

### 12.2 Pasos

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd svc-appointments

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.test .env
# Editar .env con tus credenciales

# 4. Generar Prisma Client
npx prisma generate

# 5. Aplicar migraciones
npx prisma migrate deploy

# 6. (Opcional) Ejecutar seed
npm run db:seed

# 7. Iniciar en modo desarrollo
npm run dev
```

### 12.3 Scripts disponibles

| Script | Descripcion |
|---|---|
| `npm run dev` | Inicia con hot-reload (tsx watch) |
| `npm run build` | Genera Prisma Client + compila TypeScript |
| `npm start` | Inicia desde dist/ (produccion) |
| `npm run db:generate` | Genera Prisma Client |
| `npm run db:push` | Sincroniza schema sin migracion |
| `npm run db:migrate` | Ejecuta migraciones en desarrollo |
| `npm run db:studio` | Abre Prisma Studio (UI de BD) |
| `npm run db:seed` | Ejecuta seed de datos |
| `npm test` | Ejecuta tests con Vitest |

---

## 13. Deploy en Produccion (Railway)

### 13.1 Configuracion

- **Build command**: `npm run build`
- **Deploy command**: `npx prisma migrate deploy && node dist/server.js`
- **Variables de entorno**: configurar todas las variables listadas en la seccion 4

### 13.2 Migraciones

Las migraciones se almacenan en `prisma/migrations/` y se ejecutan automaticamente en cada deploy con `prisma migrate deploy`. Para nuevas migraciones en desarrollo:

```bash
npx prisma migrate dev --name nombre_descriptivo
```

Luego hacer commit del directorio `prisma/migrations/` y push. Al deployar, Railway ejecuta `prisma migrate deploy` automaticamente.

### 13.3 Health check

`GET /health` retorna el estado de todos los servicios:

```json
{
  "status": "ok",
  "timestamp": "2026-03-30T...",
  "environment": "production",
  "services": {
    "database": "connected",
    "redis": "configured",
    "clerk": "configured",
    "resend": "configured",
    "whatsapp": "configured"
  }
}
```

---

## 14. Proveedores Externos

| Proveedor | Uso | URL Dashboard |
|---|---|---|
| Neon | PostgreSQL serverless | https://console.neon.tech |
| Upstash | Redis serverless con TLS | https://console.upstash.com |
| Clerk | Autenticacion y gestion de usuarios | https://dashboard.clerk.com |
| Resend | Envio de emails transaccionales | https://resend.com/dashboard |
| Meta (WhatsApp) | Envio de mensajes WhatsApp | https://developers.facebook.com |
| Railway | Hosting del backend | https://railway.app/dashboard |

---

## 15. Manejo de Errores

El `errorHandler` en `utils/errors.ts` captura todos los errores y responde con formato consistente:

```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Appointment not found (id: 42)",
  "statusCode": 404
}
```

Clases de error custom: `AppError`, `NotFoundError`, `ConflictError`. Los errores de Prisma (unique constraint, not found) se mapean automaticamente a respuestas HTTP apropiadas.

---

## 16. Bull Board

Accesible en `/admin/queues` (sin autenticacion en desarrollo). Permite ver el estado de los jobs en la cola `appointment-notifications`, reintentar jobs fallidos, etc.
