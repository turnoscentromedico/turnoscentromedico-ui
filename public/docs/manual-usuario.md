# AdminDoctor - Manual de Usuario (Administrador)

## Introduccion

Bienvenido a **AdminDoctor**, la plataforma integral para la administracion de clinicas y centros medicos. Este manual esta dirigido al usuario **administrador** del sistema y cubre todas las funcionalidades disponibles: desde la configuracion inicial hasta la gestion diaria de turnos, pacientes, doctores e historia clinica.

---

## 1. Acceso al Sistema

### 1.1 Registro

1. Ingrese a la pagina principal del sistema
2. Haga clic en **"Registrarse"**
3. Complete los datos solicitados por el formulario de registro (email y contrasena)
4. Una vez registrado, sera redirigido al dashboard

**Nota importante:** Al registrarse por primera vez, su cuenta tendra el rol "Sin permisos" (STANDARD). Si usted es el primer usuario del sistema, debera configurar su propio rol como Administrador desde la base de datos o solicitarlo al equipo tecnico.

### 1.2 Inicio de sesion

1. Ingrese a la pagina principal
2. Haga clic en **"Iniciar Sesion"**
3. Ingrese su email y contrasena
4. Sera redirigido automaticamente al dashboard

### 1.3 Roles del sistema

| Rol | Descripcion |
|---|---|
| **Administrador** | Acceso total a todas las secciones. Puede gestionar usuarios, configuracion, clinicas, y todo el sistema |
| **Operador/Secretaria** | Gestiona turnos, pacientes, doctores, especialidades. No puede acceder a Usuarios, Configuracion ni Historia Clinica (por defecto) |
| **Medico** | Solo ve sus propios turnos. Puede acceder a Historia Clinica para crear entradas. No puede crear turnos ni acceder a administracion |
| **Sin permisos (Standard)** | Sin acceso al dashboard. Debe esperar asignacion de rol por un administrador |

---

## 2. Dashboard Principal

Al ingresar al sistema vera el dashboard con la siguiente informacion:

### 2.1 Indicadores clave (KPIs)

Tarjetas que muestran en tiempo real:
- **Clinicas**: cantidad total de clinicas registradas
- **Doctores**: cantidad total de doctores
- **Pacientes**: cantidad total de pacientes
- **Especialidades**: cantidad de especialidades medicas
- **Usuarios**: cantidad de usuarios activos del sistema

### 2.2 Resumen de turnos

- **Total de turnos** con desglose por estado:
  - Pendientes (amarillo)
  - Confirmados (verde)
  - Cancelados (rojo)
  - Completados (azul)
  - No asistio (gris)

### 2.3 Turnos de hoy

Lista paginada con los turnos del dia actual. Cada turno muestra:
- Hora
- Nombre del paciente (con iniciales como avatar)
- Nombre del doctor
- Estado actual

Al hacer clic en el icono del **ojo** se abre un modal de detalle donde puede:
- Ver toda la informacion del turno
- **Confirmar** el turno (si esta pendiente)
- **Cancelar** el turno (envia notificacion al paciente)
- **Reenviar pedido de confirmacion** (si esta pendiente y el paciente tiene email)

### 2.4 Acciones rapidas

Botones de acceso directo a:
- Nuevo turno
- Ver turnos
- Buscar paciente

---

## 3. Configuracion Inicial (Primer uso)

Para comenzar a utilizar el sistema, siga estos pasos en orden:

### Paso 1: Crear la clinica

1. Vaya a **Administracion > Clinicas** en el menu lateral
2. Haga clic en **"Nueva Clinica"**
3. Complete:
   - **Nombre** (obligatorio): nombre del centro medico
   - **Direccion**: direccion fisica
   - **Telefono**: telefono de contacto
4. Haga clic en **"Crear"**

### Paso 2: Crear especialidades

1. Vaya a **Administracion > Especialidades**
2. Haga clic en **"Nueva Especialidad"**
3. Complete:
   - **Nombre** (obligatorio): ej. "Traumatologia de cadera", "Cardiologia"
   - **Descripcion**: descripcion breve de la especialidad
4. Haga clic en **"Crear"**
5. Repita para cada especialidad que necesite

### Paso 3: Crear doctores

1. Vaya a **Doctores** en el menu lateral
2. Haga clic en **"Nuevo Doctor"**
3. Complete los datos:
   - **Nombre** y **Apellido** (obligatorios)
   - **DNI** (obligatorio, unico)
   - **Matricula** (obligatorio, unica)
   - **Nacionalidad**, **Fecha de nacimiento**, **Telefono**, **Direccion** (opcionales)
   - **Clinica** (obligatorio): seleccione la clinica donde atiende
   - **Especialidades** (obligatorio): marque una o mas especialidades
4. Haga clic en **"Crear"**
5. Sera redirigido a la ficha del doctor para configurar su disponibilidad

### Paso 4: Configurar disponibilidad del doctor

En la ficha del doctor (se accede automaticamente al crear o desde la lista de doctores con el icono de lapiz):

#### Disponibilidad semanal

1. En la seccion **"Disponibilidad Semanal"**
2. Para cada dia de la semana:
   - Active el dia con el switch
   - Configure **Hora inicio** y **Hora fin**
   - Configure **Duracion del turno** (15, 20, 30, 45 o 60 minutos)
3. Opcionalmente active **"Horario de almuerzo"** y configure el rango
4. Haga clic en **"Guardar Disponibilidad"** (el boton aparece cuando hay cambios sin guardar)

#### Excepciones (dias no disponibles)

1. En la seccion **"Excepciones / No Disponible"**
2. Haga clic en **"Agregar"**
3. Complete:
   - **Fecha** (obligatorio)
   - **Hora inicio** y **Hora fin** (opcional; si se deja vacio, es todo el dia)
   - **Motivo** (opcional): ej. "Vacaciones", "Congreso"
4. Haga clic en **"Agregar"**

### Paso 5: Crear pacientes

1. Vaya a **Pacientes** en el menu lateral
2. Haga clic en **"Nuevo Paciente"**
3. Complete:
   - **Nombre** y **Apellido** (obligatorios)
   - **DNI** (obligatorio, unico)
   - **Nacionalidad** y **Fecha de nacimiento** (obligatorios)
   - **Email**: si se completa, el paciente recibira notificaciones por email
   - **Telefono**: formato +54 (codigo de area) (numero). Si se completa, recibira notificaciones por WhatsApp
   - **Direccion** y **CUIL/CUIT** (opcionales)
4. Haga clic en **"Crear"**

**Nota:** Los pacientes tambien pueden crearse directamente durante el proceso de asignacion de un turno.

---

## 4. Gestion de Turnos

### 4.1 Ver turnos

Vaya a **Turnos** en el menu lateral. Dispone de dos vistas:

#### Vista Lista

- Tabla con columnas ordenables: Fecha, Hora, Paciente, Doctor, Especialidad, Clinica, Estado
- Filtros: por clinica, por doctor, y busqueda por texto
- Haga clic en el nombre del paciente para ir a su perfil

#### Vista Calendario

- Vistas: Dia, Semana, Mes
- Los turnos aparecen coloreados segun su estado
- Si selecciona una clinica y un doctor, se muestran los slots disponibles en verde
- Haga clic en un turno para ver el detalle en modal
- Haga clic en un slot disponible para crear un nuevo turno

#### Acciones sobre turnos

Desde el modal de detalle de un turno:
- **Confirmar**: cambia el estado a Confirmado y envia notificacion al paciente
- **Cancelar**: cambia el estado a Cancelado, libera el slot, envia notificacion al paciente, y genera una notificacion interna
- **Reenviar confirmacion**: reenvia el email/WhatsApp de solicitud de confirmacion

Cada accion requiere confirmacion mediante un modal para evitar errores accidentales.

### 4.2 Crear un nuevo turno

1. Haga clic en **"Nuevo Turno"** (desde el menu lateral o el dashboard)
2. Elija el modo de busqueda:

#### Opcion A: Por Especialidad

1. **Seleccionar clinica**: si hay una sola, se preselecciona automaticamente
2. **Seleccionar especialidad**: use el buscador para encontrar rapidamente. Cada tarjeta muestra la cantidad de doctores disponibles
3. **Buscar turno**: dos opciones:
   - **Vista Calendario**: navegue por los dias y haga clic en un slot disponible
   - **Buscar por Fecha**: seleccione un dia y vea todos los slots disponibles con todos los doctores de esa especialidad
4. **Seleccionar paciente**: busque un paciente existente o cree uno nuevo
5. **Confirmar**: revise el resumen del turno, agregue notas opcionales, y haga clic en **"Confirmar Turno"**

#### Opcion B: Por Medico

1. **Seleccionar clinica**
2. **Seleccionar medico**: use el buscador para encontrar por nombre. Si el medico tiene multiples especialidades, debera elegir la especialidad para este turno
3. **Buscar turno**: igual que en Opcion A
4. **Seleccionar paciente**: igual que en Opcion A
5. **Confirmar**: igual que en Opcion A

### 4.3 Flujo de estados de un turno

```
PENDIENTE → CONFIRMADO → COMPLETADO
    ↓           ↓
 CANCELADO   CANCELADO
                ↓
            NO ASISTIO
```

- **Pendiente**: turno creado, esperando confirmacion
- **Confirmado**: turno confirmado (por operador o por el paciente via email/WhatsApp)
- **Cancelado**: turno cancelado (por operador o por el paciente)
- **Completado**: turno atendido
- **No asistio**: el paciente no se presento

### 4.4 Notificaciones automaticas

Al crear un turno, el sistema envia automaticamente (si esta habilitado en Configuracion):

| Momento | Email | WhatsApp |
|---|---|---|
| Al crear el turno | Solicitud de turno con botones de confirmar/cancelar | Mensaje con boton de confirmar |
| Al confirmar | Confirmacion del turno | Mensaje de confirmacion |
| Al cancelar | Aviso de cancelacion | Mensaje de cancelacion |
| 24 horas antes | Recordatorio | Recordatorio |
| 2 horas antes | Recordatorio urgente | Recordatorio urgente |

Los emails incluyen botones para que el paciente pueda **confirmar** o **cancelar** directamente desde el email. Estos botones son de uso unico y expiran en 72 horas.

---

## 5. Gestion de Pacientes

### 5.1 Lista de pacientes

En **Pacientes** puede:
- Buscar por nombre, DNI, email o telefono
- Ordenar por cualquier columna
- Cambiar la cantidad de items por pagina (10, 25, 50, 100)

### 5.2 Editar un paciente

Haga clic en el icono de **lapiz** junto al paciente. Se abre el mismo formulario con los datos cargados.

### 5.3 Eliminar un paciente

Haga clic en el icono de **papelera**. Se mostrara un modal de confirmacion advirtiendo que:
- La accion es **irreversible**
- Se eliminaran **todos los turnos** asociados
- Se eliminara toda la **historia clinica**

---

## 6. Gestion de Doctores

### 6.1 Lista de doctores

En **Doctores** puede:
- Filtrar por clinica y/o especialidad
- Ordenar por columnas
- Ver las especialidades de cada doctor como badges

### 6.2 Eliminar un doctor

Al eliminar un doctor:
- Se cancelan todos sus **turnos activos** (pendientes y confirmados)
- Se envia **notificacion** a todos los pacientes afectados
- Se eliminan sus horarios y excepciones
- Se actualiza la historia clinica de los pacientes

El modal de confirmacion advierte sobre todas estas consecuencias.

### 6.3 Doctor con multiples especialidades

Un doctor puede tener asignadas varias especialidades. Al crear un turno:
- Si se busca por especialidad, el sistema muestra todos los doctores que la tienen
- Si se busca por doctor y este tiene mas de una especialidad, se le pide al usuario que elija la especialidad para ese turno

**Importante**: Si un doctor tiene un turno a las 10:00 para "Traumatologia de cadera", ese horario queda bloqueado para todas sus especialidades, ya que el doctor esta fisicamente ocupado.

---

## 7. Gestion de Especialidades

### 7.1 Lista de especialidades

Muestra nombre, descripcion y **cantidad de doctores**. El numero de doctores es clickeable.

### 7.2 Modal de doctores por especialidad

Al hacer clic en el numero de doctores:
- Se abre un modal con la lista de doctores de esa especialidad
- La lista muestra: nombre, DNI, matricula, clinica, telefono
- Al hacer clic en un doctor, se redirige a su ficha de detalle

---

## 8. Gestion de Clinicas

### 8.1 CRUD de clinicas

En **Administracion > Clinicas** puede crear, editar y eliminar clinicas. Cada clinica muestra la cantidad de doctores y turnos asociados.

---

## 9. Historia Clinica

### 9.1 Acceso

Hay dos formas de acceder a la historia clinica de un paciente:

1. **Desde el menu lateral**: vaya a **Historia Clinica**, busque al paciente por nombre o DNI, y haga clic en su tarjeta
2. **Desde cualquier lugar del sistema**: haga clic en el nombre del paciente (en la lista de turnos, detalle de turno, etc.)

### 9.2 Entradas automaticas

El sistema registra automaticamente:
- **Turno creado**: cuando se crea un turno para el paciente
- **Turno confirmado**: cuando el turno se confirma
- **Turno cancelado**: cuando el turno se cancela

Cada entrada automatica muestra la fecha, hora y datos del turno asociado.

### 9.3 Crear una entrada manual

1. En el perfil del paciente, vaya a la pestana **"Historia clinica"**
2. Haga clic en **"Nueva entrada"**
3. Complete los campos disponibles:
   - **Fecha** (obligatorio)
   - **Motivo de consulta**
   - **Diagnostico**
   - **Tratamiento**
   - **Indicaciones/Prescripciones**
   - **Estudios solicitados**
   - **Observaciones**
4. Opcionalmente, expanda **"Signos vitales"** y complete:
   - Peso (kg)
   - Altura (cm)
   - Presion arterial (ej: 120/80)
   - Temperatura (C)
   - Frecuencia cardiaca (lpm)
5. Haga clic en **"Guardar entrada"**

### 9.4 Filtrar entradas

Use los filtros de tipo para ver:
- **Todas** las entradas
- Solo **Manuales**
- Solo **Turno creado**, **Turno confirmado** o **Turno cancelado**

### 9.5 Eliminar entradas

Solo las entradas **manuales** pueden eliminarse. Las entradas automaticas son parte del registro inmutable del sistema.

---

## 10. Gestion de Usuarios

### 10.1 Acceso

Vaya a **Administracion > Usuarios**. Esta seccion es exclusiva para administradores.

### 10.2 Como se crean los usuarios

Los usuarios **no se crean desde el panel**. La unica forma de crear un usuario es mediante el proceso de **registro (signup)** en la pagina de inicio del sistema. Una vez registrado, el administrador le asigna el rol correspondiente.

### 10.3 Editar un usuario

Haga clic en el icono de **lapiz** junto al usuario. Puede modificar:
- **Nombre** y **Email**
- **Rol**: Administrador, Operador, Medico, Sin permisos
- **Clinicas asignadas**: marque las clinicas a las que el usuario tendra acceso
- **Doctor vinculado** (solo para rol Medico): vincule el usuario con un registro de doctor existente

### 10.4 Vincular usuario con doctor

Cuando asigne el rol **Medico** a un usuario:
1. Aparecera el campo **"Doctor vinculado"**
2. Seleccione el doctor correspondiente de la lista
3. Solo aparecen doctores que no estan vinculados a otro usuario
4. Esta vinculacion permite que el medico solo vea sus propios turnos

---

## 11. Configuracion del Sistema

Vaya a **Administracion > Configuracion**.

### 11.1 Calendario

- **Mostrar 24 horas**: si se activa, el calendario muestra todas las horas del dia
- **Hora de inicio**: hora a partir de la cual se muestra el calendario (ej: 07:00)
- **Hora de fin**: hora hasta la cual se muestra el calendario (ej: 21:00)

### 11.2 Notificaciones a pacientes

Dos switches independientes:
- **Notificaciones por Email**: activa o desactiva el envio de emails al paciente
- **Notificaciones por WhatsApp**: activa o desactiva el envio de mensajes WhatsApp al paciente

Si ambos estan desactivados, no se enviara ninguna notificacion al paciente (los turnos se crean normalmente pero sin avisos).

### 11.3 Vistas por roles

Aqui configura que secciones del sistema puede ver cada rol. Se muestra una matriz con:
- **Filas**: cada seccion del sistema (Dashboard, Turnos, Nuevo Turno, Notificaciones, Historia Clinica, Clinicas, Especialidades, Doctores, Pacientes, Usuarios, Configuracion)
- **Columnas**: Operador y Medico (el Administrador siempre tiene acceso total)

Marque o desmarque las casillas para personalizar el acceso. Los cambios se aplican inmediatamente al guardar.

#### Permisos por defecto

**Operador/Secretaria**: accede a todo excepto:
- Historia Clinica
- Usuarios
- Configuracion

**Medico**: accede solo a:
- Dashboard (solo sus datos)
- Turnos (solo los suyos)
- Historia Clinica (puede crear entradas)
- Pacientes (solo lectura)

---

## 12. Notificaciones Internas

Vaya a **Notificaciones** en el menu lateral.

Esta seccion muestra las notificaciones generadas por el sistema, como por ejemplo cuando un paciente cancela un turno desde el email o WhatsApp. Esto permite al operador saber que se libero un slot.

### 12.1 Acciones

- **Marcar como leida**: individualmente o todas a la vez
- El badge en el menu lateral muestra la cantidad de notificaciones sin leer

---

## 13. Perfil del Paciente

### 13.1 Como acceder

Haga clic en el nombre de cualquier paciente en:
- La lista de turnos
- El detalle de un turno (modal)
- La lista de pacientes
- La seccion de Historia Clinica

### 13.2 Pestanas disponibles

1. **Datos personales**: informacion del paciente (solo lectura desde esta vista)
2. **Historia clinica**: timeline completo de entradas automaticas y manuales, con posibilidad de crear nuevas entradas (si tiene permisos)
3. **Turnos**: lista de todos los turnos del paciente con su estado

---

## 14. Flujo Completo: De la Configuracion al Turno

A modo de resumen, este es el flujo completo de uso del sistema:

1. **Configurar el sistema**: crear clinica, especialidades, y doctores con sus horarios
2. **Registrar pacientes**: crear pacientes con sus datos de contacto
3. **Asignar turnos**: usar el asistente de nuevo turno para reservar slots
4. **Gestionar turnos**: confirmar, cancelar, o reenviar confirmaciones desde la lista de turnos o el dashboard
5. **Notificaciones automaticas**: el sistema envia emails y WhatsApp al paciente segun los eventos
6. **Historia clinica**: registrar consultas, diagnosticos y tratamientos en el perfil del paciente
7. **Monitorear**: usar el dashboard para ver el resumen del dia y las estadisticas generales

---

## 15. Preguntas Frecuentes

### Un paciente cancelo su turno desde el email, como me entero?

Se genera automaticamente una notificacion interna visible en la seccion **Notificaciones**. Ademas, el badge del menu lateral muestra un numero con las notificaciones sin leer.

### Puedo enviar notificaciones solo por email y no por WhatsApp?

Si. Vaya a **Configuracion** y desactive el switch de **Notificaciones por WhatsApp**.

### Un doctor tiene dos especialidades y quiero que atienda ambas, como configuro?

Al crear o editar el doctor, marque ambas especialidades en los checkboxes. La disponibilidad horaria es compartida: si tiene turno a las 10:00 para una especialidad, no estara disponible a esa hora para la otra.

### Como cambio el rol de un usuario?

Vaya a **Administracion > Usuarios**, haga clic en el icono de lapiz del usuario, y cambie el rol en el desplegable.

### El paciente no recibio el email de confirmacion, que hago?

Verifique que:
1. El paciente tiene email cargado en su ficha
2. Las notificaciones por email estan habilitadas en Configuracion
3. Si todo esta correcto, desde el detalle del turno use **"Reenviar pedido de confirmacion"**

### Como le doy acceso a un nuevo operador?

1. Pida al nuevo operador que se registre en el sistema (pagina de inicio > Registrarse)
2. Una vez registrado, vaya a **Administracion > Usuarios**
3. Busque al nuevo usuario y editelo
4. Asigne el rol **Operador** y marque las clinicas a las que tendra acceso
5. Guarde los cambios

### Puedo personalizar que secciones ve cada rol?

Si. Vaya a **Configuracion > Vistas por roles** y marque/desmarque las secciones para cada rol.

### Como configuro los turnos de los sabados para un doctor?

En la ficha del doctor, en **Disponibilidad Semanal**, active el dia **Sabado** y configure el horario de inicio, fin y duracion del turno.

### Un doctor se fue de vacaciones, como bloqueo sus turnos?

En la ficha del doctor, en **Excepciones / No Disponible**, agregue las fechas de vacaciones. Si es todo el dia, deje las horas en blanco. Puede agregar un motivo como "Vacaciones".

---

## 16. Glosario

| Termino | Definicion |
|---|---|
| **Turno** | Cita medica reservada para un paciente con un doctor |
| **Slot** | Espacio horario disponible para reservar un turno |
| **Operador** | Usuario con rol de secretaria/operador que gestiona el sistema |
| **Historia Clinica** | Registro cronologico de consultas, diagnosticos y tratamientos de un paciente |
| **Especialidad** | Area de la medicina (ej: Cardiologia, Traumatologia) |
| **KPI** | Indicador clave de rendimiento mostrado en el dashboard |
| **Notificacion interna** | Alerta dentro del sistema para operadores y administradores |
| **Token de accion** | Enlace de uso unico incluido en emails para confirmar/cancelar turnos |
