# AdminDoctor - Frontend: Guia Tecnica Completa

## 1. Vision General

El frontend de AdminDoctor es una aplicacion web construida con **Next.js 16** (App Router), **React 19** y **TypeScript**. Utiliza **Clerk** para autenticacion, **shadcn/ui** como sistema de componentes, **TanStack Query** para manejo de estado del servidor, y **Tailwind CSS** para estilos.

---

## 2. Stack Tecnologico

| Componente | Tecnologia | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.x |
| UI | React | 19.2.x |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS | 4.x |
| Componentes UI | shadcn/ui (base-nova) | 4.1.x |
| Autenticacion | @clerk/nextjs | 4.x |
| State Management | @tanstack/react-query | - |
| Formularios | react-hook-form + @hookform/resolvers | - |
| Validacion | Zod | 4.3.x |
| Calendario | FullCalendar | - |
| Iconos | lucide-react | - |
| Toasts | sonner | - |
| Tema dark/light | next-themes | - |
| Fechas | date-fns | - |
| Deployment | Vercel | - |

---

## 3. Estructura del Proyecto

```
appointments-ui/
  src/
    app/
      layout.tsx             # Root layout: ClerkProvider, ThemeProvider, Toaster
      page.tsx               # Landing page (redirige a /dashboard si logueado)
      globals.css            # Tema OKLCH, variables CSS, FullCalendar styles
      sign-in/[[...sign-in]]/page.tsx   # Pagina de login de Clerk
      sign-up/[[...sign-up]]/page.tsx   # Pagina de registro de Clerk
      appointment-action/page.tsx       # Pagina publica para acciones via token
      dashboard/
        layout.tsx           # Layout autenticado: sidebar + header + providers
        page.tsx             # Dashboard principal con KPIs y turnos de hoy
        appointments/
          page.tsx           # Lista/calendario de turnos
          new/page.tsx       # Asistente de nuevo turno (wizard multi-paso)
        clinics/page.tsx     # CRUD de clinicas
        specialties/page.tsx # CRUD de especialidades (con modal de doctores)
        doctors/
          page.tsx           # Lista de doctores
          [id]/page.tsx      # Detalle de doctor (datos, horarios, excepciones)
        patients/
          page.tsx           # Lista de pacientes
          [id]/page.tsx      # Perfil del paciente (datos, HC, turnos)
        users/page.tsx       # Gestion de usuarios (solo edicion de roles)
        settings/page.tsx    # Configuracion admin (calendario, notificaciones, vistas)
        notifications/page.tsx  # Notificaciones internas
        medical-records/page.tsx # Busqueda de pacientes para HC
    components/
      home-content.tsx       # Contenido visual de la landing page
      app-sidebar.tsx        # Sidebar con navegacion y permisos
      view-guard.tsx         # HOC de proteccion por permisos de vista
      theme-toggle.tsx       # Switch dark/light mode
      theme-sync.tsx         # Sincronizacion de tema con preferencias
      phone-input.tsx        # Input de telefono con formato E.164 (+54)
      confirm-dialog.tsx     # Dialog de confirmacion reutilizable
      patient-link.tsx       # Enlace al perfil de paciente
      appointment-calendar.tsx  # Componente de calendario FullCalendar
      availability-search.tsx   # Busqueda de slots disponibles por fecha
      pagination-controls.tsx   # Controles de paginacion reutilizables
      setup-banner.tsx       # Banner de configuracion inicial
      ui/                    # 26 componentes shadcn/ui
        alert-dialog, avatar, badge, button, calendar, card,
        checkbox, command, dialog, dropdown-menu, input,
        input-group, label, popover, scroll-area, select,
        separator, sheet, sidebar, skeleton, sonner, switch,
        table, tabs, textarea, tooltip
    hooks/
      use-appointments.ts    # Queries y mutaciones de turnos
      use-clinics.ts         # Queries y mutaciones de clinicas
      use-doctors.ts         # Queries y mutaciones de doctores
      use-patients.ts        # Queries y mutaciones de pacientes
      use-specialties.ts     # Queries y mutaciones de especialidades
      use-users.ts           # Queries y mutaciones de usuarios
      use-medical-records.ts # Queries y mutaciones de HC
      use-notifications.ts   # Queries y mutaciones de notificaciones
      use-role.ts            # Hook useMe() y useRole()
      use-view-permissions.ts # Permisos de vista por rol
      use-page-size.ts       # Page size con persistencia
      use-user-preferences.ts # Preferencias de usuario con API + localStorage
    lib/
      api.ts                 # Cliente HTTP centralizado (ApiClient)
      query-keys.ts          # Claves de cache para TanStack Query
      schemas.ts             # Schemas Zod para formularios
      utils.ts               # Utilidad cn() para classnames
    types/
      index.ts               # Tipos TypeScript de todo el dominio
    providers/
      query-provider.tsx     # QueryClientProvider
      auth-token-provider.tsx # Inyeccion de token Clerk en ApiClient
  components.json            # Configuracion de shadcn/ui
  next.config.ts
  tsconfig.json
  .env.example
```

---

## 4. Variables de Entorno

| Variable | Descripcion |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL base del backend (default: `http://localhost:3001`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clave publica de Clerk |
| `CLERK_SECRET_KEY` | Clave secreta de Clerk (server-side) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Ruta de login (`/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Ruta de registro (`/sign-up`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Ruta post-login (`/dashboard`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Ruta post-registro (`/dashboard`) |

---

## 5. Autenticacion

### 5.1 Flujo

1. **ClerkProvider** envuelve toda la app en `layout.tsx` con locale `esES`
2. `signInFallbackRedirectUrl` y `signUpFallbackRedirectUrl` apuntan a `/dashboard`
3. La pagina raiz (`page.tsx`) es un Server Component que usa `auth()` de Clerk: si hay `userId`, redirige a `/dashboard`
4. El `dashboard/layout.tsx` es un Client Component que carga `AuthTokenProvider`
5. `AuthTokenProvider` obtiene `getToken` de `useAuth()` y lo inyecta en `apiClient.setTokenGetter()`
6. Todas las peticiones HTTP posteriores incluyen `Authorization: Bearer <token>` automaticamente

### 5.2 Roles

El hook `useMe()` llama a `GET /api/me` y cachea el resultado. El hook `useRole()` extrae solo el rol.

Roles: `ADMIN`, `OPERATOR`, `DOCTOR`, `STANDARD`.

Los usuarios con rol `STANDARD` ven un mensaje de "No tienes acceso al dashboard" hasta que un admin les asigne un rol.

---

## 6. Sistema de Permisos (RBAC)

### 6.1 ViewGuard

Componente que envuelve cada pagina protegida. Recibe un `viewId` y verifica contra los permisos del rol actual:

```tsx
<ViewGuard viewId="appointments">
  {/* contenido de la pagina */}
</ViewGuard>
```

### 6.2 Hook useViewPermissions

```typescript
const { canAccess, loading } = useViewPermissions();
canAccess("medical-records"); // boolean
```

Logica:
- **ADMIN**: accede a todo siempre
- **STANDARD**: no accede a nada
- **OPERATOR/DOCTOR**: accede segun la configuracion almacenada en `settings` bajo la clave `views.{ROLE}` (array de viewIds permitidos)

### 6.3 View IDs del sistema

| viewId | Seccion |
|---|---|
| `dashboard` | Dashboard principal |
| `appointments` | Lista de turnos |
| `appointments.new` | Nuevo turno |
| `notifications` | Notificaciones |
| `medical-records` | Historia clinica |
| `clinics` | Clinicas |
| `specialties` | Especialidades |
| `doctors` | Doctores |
| `patients` | Pacientes |
| `users` | Usuarios |
| `settings` | Configuracion |

### 6.4 Sidebar dinamico

El sidebar (`app-sidebar.tsx`) filtra los items de navegacion segun `canAccess()`. Los items no permitidos no se renderizan.

---

## 7. Cliente API (api.ts)

### 7.1 Arquitectura

`ApiClient` es una clase singleton que centraliza todas las llamadas HTTP al backend:

- `setTokenGetter(fn)`: recibe la funcion de Clerk para obtener el token JWT
- `request<T>(method, path, options)`: peticion generica con autenticacion automatica
- `requestPaginated<T>(...)`: peticion con parametros de paginacion y sorting
- Metodos especificos por dominio: `getClinics()`, `createAppointment()`, etc.

### 7.2 Base URL

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
```

### 7.3 Paginacion

Todas las listas usan `requestPaginated` que envia:
- `page`, `pageSize`, `sortBy`, `sortOrder` como query params
- Retorna `{ data: T[], total: number, page: number, pageSize: number }`

---

## 8. TanStack Query

### 8.1 Configuracion

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,    // 30 segundos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 8.2 Query Keys

Centralizadas en `query-keys.ts` como factory functions:

```typescript
queryKeys.appointments.list({ page: 1, pageSize: 25, sortBy: "date" })
queryKeys.patients.detail(42)
queryKeys.medicalRecords.byPatient(10, { page: 1 })
```

### 8.3 Hooks de datos

Cada modulo tiene su propio hook file que exporta queries y mutaciones:

```typescript
// Ejemplo: use-appointments.ts
export function useAppointments(params) { ... }     // useQuery
export function useCreateAppointment() { ... }      // useMutation + invalidateQueries
export function useConfirmAppointment() { ... }     // useMutation + invalidateQueries + toast
```

Las mutaciones invalidan caches relevantes y muestran toasts de exito/error con Sonner.

---

## 9. Temas y Estilos

### 9.1 Paleta de colores

Definida en `globals.css` usando OKLCH. El color primario es **indigo**:

- Light: `--primary: oklch(0.488 0.217 264)`
- Dark: `--primary: oklch(0.65 0.22 264)`

Colores de acento para KPIs: azul, teal, indigo, amber, violet, rojo.

### 9.2 Dark mode

- Controlado por `next-themes` con `ThemeProvider`
- Toggle en el header del dashboard (`ThemeToggle`)
- La preferencia se guarda en el backend (`user-preferences`) y en `localStorage`
- `ThemeSync` aplica el tema guardado al cargar

### 9.3 Fuentes

- `Geist` (sans-serif) como fuente principal
- `Geist Mono` como fuente monospace

---

## 10. Componentes Reutilizables

### 10.1 PaginationControls

Componente con:
- Selector de items por pagina (10, 25, 50, 100)
- Botones Anterior / Siguiente
- Indicador "Mostrando X-Y de Z"

La preferencia de `pageSize` se persiste por seccion en `user-preferences`.

### 10.2 ConfirmDialog

Modal de confirmacion reutilizable con:
- Titulo y descripcion personalizables
- Variantes: `default` / `destructive`
- Estado de loading (spinner en boton)

### 10.3 PatientLink

Enlace al perfil del paciente reutilizable. Se usa en listas de turnos, detalles de turno, etc.

### 10.4 PhoneInput

Input de telefono con:
- Prefijo `+54` bloqueado
- Campos separados para codigo de area y numero
- Formateo automatico al formato E.164

### 10.5 AppointmentCalendar

Calendario FullCalendar integrado con:
- Vistas: dia, semana, mes
- Eventos coloreados por estado
- Slots disponibles clickeables
- Leyenda de estados
- Estilos custom para dias pasados (rayas diagonales)

---

## 11. Paginas del Dashboard

### 11.1 Dashboard (/)

- Saludo dinamico (Buenos dias/tardes/noches)
- KPIs: clinicas, doctores, pacientes, especialidades, usuarios (con iconos y colores)
- Resumen de turnos por estado
- Acciones rapidas: Nuevo turno, Ver turnos, Buscar paciente
- Lista paginada de turnos de hoy con modal de detalle

### 11.2 Turnos (/appointments)

- Vista dual: Lista (tabla sorteable) / Calendario (FullCalendar)
- Filtros: clinica, doctor, busqueda
- Modal de detalle con acciones: confirmar, cancelar, reenviar confirmacion
- Columnas: fecha, hora, paciente (enlace), doctor, especialidad, clinica, estado

### 11.3 Nuevo Turno (/appointments/new)

Wizard de 5 pasos con dos modos:
- **Por especialidad**: Clinica → Especialidad → Calendario/Busqueda → Paciente → Confirmar
- **Por medico**: Clinica → Medico (+ especialidad si tiene varias) → Calendario/Busqueda → Paciente → Confirmar

En el paso de paciente se puede buscar uno existente o crear uno nuevo.

### 11.4 Clinicas (/clinics)

CRUD simple con tabla sorteable y dialog de creacion/edicion.

### 11.5 Especialidades (/specialties)

CRUD con tabla sorteable. El conteo de doctores es clickeable y abre un modal con la lista de doctores de esa especialidad (paginada, con enlaces a la ficha de cada doctor).

### 11.6 Doctores (/doctors)

Lista con filtros por clinica y especialidad. Dialog de creacion (seleccion multiple de especialidades). Enlace a detalle.

### 11.7 Detalle Doctor (/doctors/[id])

Tres secciones:
1. Datos personales (formulario editable)
2. Disponibilidad semanal (por dia, con duracion de slot y pausa almuerzo)
3. Excepciones/no disponible (lista + dialog para agregar)

### 11.8 Pacientes (/patients)

Lista con busqueda client-side, CRUD con dialog. Eliminacion con ConfirmDialog (advierte sobre datos irreversibles).

### 11.9 Perfil Paciente (/patients/[id])

Tabs: Datos personales | Historia clinica | Turnos

La tab de Historia Clinica (condicional segun permisos) muestra:
- Timeline de entradas (automaticas y manuales)
- Filtro por tipo
- Modal de nueva entrada con campos clinicos y signos vitales
- Solo entradas manuales son eliminables

### 11.10 Usuarios (/users)

Solo edicion de usuarios existentes (no se pueden crear desde aqui). Se asigna rol, clinicas, y si es DOCTOR, se vincula con un registro de doctor.

### 11.11 Configuracion (/settings)

Tres bloques:
1. Calendario: rango horario visible, mostrar 24h
2. Notificaciones: toggles email y WhatsApp
3. Vistas por roles: matriz de permisos por rol (OPERATOR, DOCTOR)

### 11.12 Notificaciones (/notifications)

Lista paginada de notificaciones internas con boton "Marcar como leida" individual y masivo.

### 11.13 Historia Clinica (/medical-records)

Buscador de pacientes que redirige al perfil del paciente con `?tab=history`.

---

## 12. Instalacion del Entorno de Desarrollo

### 12.1 Prerequisitos

- Node.js 18+
- Backend corriendo en `localhost:3001` (o configurar `NEXT_PUBLIC_API_URL`)
- Cuenta en Clerk con claves configuradas

### 12.2 Pasos

```bash
# 1. Ir al directorio del frontend
cd appointments-ui

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 4. Iniciar en modo desarrollo
npm run dev
```

### 12.3 Scripts disponibles

| Script | Descripcion |
|---|---|
| `npm run dev` | Inicia Next.js en modo desarrollo |
| `npm run build` | Genera build de produccion |
| `npm start` | Inicia desde build |
| `npm run lint` | Ejecuta ESLint |

---

## 13. Deploy en Produccion (Vercel)

### 13.1 Variables de entorno necesarias

Configurar en el panel de Vercel:
- `NEXT_PUBLIC_API_URL`: URL del backend en Railway (ej: `https://turnoscentromedico-production.up.railway.app`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- Las demas variables `NEXT_PUBLIC_CLERK_*` para rutas

### 13.2 Build

Vercel detecta automaticamente Next.js y ejecuta `npm run build`. No se requiere configuracion adicional.

---

## 14. Tipos TypeScript (types/index.ts)

Todos los tipos del dominio estan centralizados:

- **Roles**: `UserRole = "ADMIN" | "OPERATOR" | "DOCTOR" | "STANDARD"`
- **Entidades**: `Clinic`, `Specialty`, `Doctor`, `Patient`, `Appointment`, `SystemUser`, `MedicalRecord`, `InternalNotification`, etc.
- **Paginacion**: `PaginatedResponse<T>`, `PaginationParams`, `SortParams`
- **API**: `ApiResponse<T>`, `DashboardStats`, `MeResponse`, `SetupStatus`

---

## 15. Schemas Zod (schemas.ts)

Schemas para validacion de formularios con `react-hook-form`:

- `clinicSchema`: nombre (requerido), direccion, telefono
- `specialtySchema`: nombre (requerido), descripcion
- `doctorSchema`: nombre, apellido, DNI, matricula (requeridos), clinicId, specialtyIds
- `scheduleSchema`: dia, inicio, fin, duracion
- `patientSchema`: nombre, apellido, DNI, nacionalidad, fecha nacimiento (requeridos), email, telefono, direccion, CUIL
- `appointmentSchema`: patientId, doctorId, specialtyId, clinicId, date, startTime, endTime
- `userSchema`: nombre, email, rol, clinicIds

---

## 16. Patron de Hooks

Todos los hooks de datos siguen el mismo patron:

```typescript
// Query (lectura)
export function useXxx(params) {
  return useQuery({
    queryKey: queryKeys.xxx.list(params),
    queryFn: () => apiClient.getXxx(params),
  });
}

// Mutation (escritura)
export function useCreateXxx() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiClient.createXxx(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.xxx.all });
      toast.success("Creado exitosamente");
    },
    onError: (err) => toast.error(err.message),
  });
}
```
