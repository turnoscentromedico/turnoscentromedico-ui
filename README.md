# Turnos Clínica — Frontend

Frontend completo para el sistema de gestión de turnos médicos, construido con **Next.js 15** (App Router), **TypeScript**, **Tailwind CSS**, **Shadcn/ui**, **Clerk** y **TanStack Query v5**.

## Requisitos previos

- Node.js >= 18
- npm >= 9
- Backend `svc-appointments` corriendo (por defecto en `http://localhost:3001`)
- Cuenta de [Clerk](https://clerk.com) con claves configuradas

## Instalación

```bash
git clone <repo-url>
cd appointments-ui
npm install
cp .env.example .env.local
```

Editá `.env.local` con tus valores:

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Clerk redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## Correr localmente

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Build de producción

```bash
npm run build
npm start
```

## Estructura del proyecto

```
src/
├── app/                          # Rutas (App Router)
│   ├── (auth)/                   # Sign-in / Sign-up (Clerk)
│   ├── dashboard/                # Panel principal (protegido)
│   │   ├── secretary/            # Panel de secretaría
│   │   │   ├── calendar/         # Calendario mensual con filtros
│   │   │   ├── appointments/     # Listado + gestión de turnos
│   │   │   └── book/             # Agendamiento rápido (teléfono)
│   │   ├── my-appointments/      # Mis turnos (paciente)
│   │   ├── book/                 # Agendar turno (paciente, wizard)
│   │   ├── profile/              # Perfil (ambos roles)
│   │   ├── clinics/              # CRUD clínicas
│   │   ├── doctors/              # Listado médicos
│   │   ├── patients/             # CRUD pacientes
│   │   └── today/                # Turnos del día
│   └── login/                    # Redirect a /sign-in
├── components/
│   ├── app-sidebar.tsx           # Sidebar con navegación por roles
│   ├── patient-quick-search.tsx  # Búsqueda rápida por teléfono
│   ├── available-slots-picker.tsx# Selector de horarios disponibles
│   └── ui/                       # Componentes Shadcn/ui
├── hooks/                        # Custom hooks (TanStack Query)
├── lib/
│   ├── api.ts                    # Cliente HTTP tipado
│   ├── query-keys.ts             # Query keys centralizadas
│   └── roles.ts                  # Detección de roles
├── providers/                    # QueryClient + Auth token
├── types/                        # Interfaces TypeScript
└── middleware.ts                  # Clerk + protección por rol
```

## Roles

El sistema soporta dos roles: **secretary** y **patient**.

### Configurar roles en Clerk

1. Andá a [Clerk Dashboard](https://dashboard.clerk.com)
2. Seleccioná el usuario
3. En **Public Metadata**, agregá:

```json
{ "role": "secretary" }
```

Si el campo no existe o tiene otro valor, el usuario se trata como `"patient"`.

## Cómo probar: Flujo de Secretaria

### 1. Preparar datos

Asegurate de que el backend tenga al menos:
- 1 clínica creada (`POST /api/clinics`)
- 1 especialidad (`POST /api/specialties`)
- 1 médico con schedule configurado (`POST /api/doctors`)

### 2. Agendar turno por teléfono

1. Logueate con un usuario que tenga `role: "secretary"` en Clerk
2. En el sidebar, andá a **Agendar Turno** (`/dashboard/secretary/book`)
3. Seleccioná **Clínica** → **Especialidad** → **Médico**
4. Elegí una **fecha** en el calendario → aparecen los horarios disponibles
5. En la sección **Paciente**, buscá por teléfono
   - Si no existe, hacé click en "Crear paciente nuevo" y completá los datos
6. Opcionalmente agregá notas
7. Revisá el **resumen** y hacé click en **Confirmar Turno**

### 3. Gestionar turnos

- **Calendario** (`/dashboard/secretary/calendar`): vista mensual con filtros por clínica y médico. Hacé click en un día para ver los turnos.
- **Todos los Turnos** (`/dashboard/secretary/appointments`): tabla con tabs Hoy/Próximos/Pasados, búsqueda y acciones (ver detalle, cancelar).
- **Turnos del Día** (`/dashboard/today`): vista rápida con stats del día.

### 4. Administrar entidades

- **Centros** (`/dashboard/clinics`): crear, editar y eliminar clínicas
- **Pacientes** (`/dashboard/patients`): tabla completa con búsqueda, CRUD
- **Médicos** (`/dashboard/doctors`): listado con filtros por clínica y especialidad

## Cómo probar: Flujo de Paciente

1. Logueate con un usuario **sin** `role: "secretary"` (o con `role: "patient"`)
2. En el sidebar verás: **Mis Turnos**, **Agendar Turno**, **Mi Perfil**

### Agendar turno

1. Andá a **Agendar Turno** (`/dashboard/book`)
2. Seguí el wizard de 4 pasos:
   - Paso 1: elegí clínica y especialidad
   - Paso 2: elegí médico
   - Paso 3: elegí fecha y horario
   - Paso 4: revisá el resumen y confirmá

### Ver y cancelar turnos

1. Andá a **Mis Turnos** (`/dashboard/my-appointments`)
2. En la pestaña **Próximos** podés cancelar turnos pendientes
3. Hacé click en el nombre del médico para ver el detalle completo

### Perfil

- **Mi Perfil** (`/dashboard/profile`): información de la cuenta, estadísticas de turnos, y estado de la API con botón "Sincronizar con API".

## Tecnologías

| Tecnología | Uso |
|---|---|
| Next.js 15 | Framework (App Router + Server Components) |
| TypeScript | Tipado estático |
| Tailwind CSS | Estilos utility-first |
| Shadcn/ui | Componentes UI |
| Clerk | Autenticación + roles |
| TanStack Query v5 | Data fetching + cache |
| date-fns | Manipulación de fechas |
| Lucide React | Iconos |
| Sonner | Notificaciones toast |

## API Endpoints consumidos

| Método | Ruta | Auth |
|--------|------|------|
| `GET` | `/clinics` | Bearer |
| `POST` | `/clinics` | Bearer |
| `PUT` | `/clinics/:id` | Bearer |
| `DELETE` | `/clinics/:id` | Bearer |
| `GET` | `/specialties` | — |
| `GET` | `/doctors?clinicId=&specialtyId=` | — |
| `GET` | `/patients?phone=` | Bearer |
| `POST` | `/patients` | Bearer |
| `PUT` | `/patients/:id` | Bearer |
| `DELETE` | `/patients/:id` | Bearer |
| `GET` | `/appointments/available?clinicId=&doctorId=&date=` | — |
| `GET` | `/appointments/available-by-specialty?clinicId=&specialtyId=&date=` | — |
| `POST` | `/appointments` | Bearer |
| `GET` | `/appointments?clinicId=&doctorId=&patientId=` | Bearer |
| `GET` | `/appointments/:id` | Bearer |
| `PATCH` | `/appointments/:id/cancel` | Bearer |
