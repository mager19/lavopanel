# LavoPanel — Lavadero la 55

Sistema de gestión para **lavadero + parqueadero** de autos y motos (Colombia). Permite controlar la ocupación de slots de parqueo y lavado, registrar el ingreso de vehículos, gestionar órdenes de servicio, cobrar tarifas por hora/día, administrar mensualidades, manejar turnos del personal y consultar reportes del negocio.

El acceso está segmentado por roles: **admin**, **dueño (owner)** y **operario (worker)**.

---

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Drizzle ORM** sobre **Turso / libSQL** (`@libsql/client`)
- **Auth.js v5** (`next-auth@5`) con credenciales y hashing `bcryptjs`
- **SWR** para data fetching en el cliente
- **Recharts** para gráficas de reportes
- **React Three Fiber** + **drei** (`three`) para visualización 3D
- **Zod** + **React Hook Form** para validación de formularios
- UI: **shadcn**, **@base-ui/react**, **lucide-react**, **sonner**, **next-themes**

---

## Requisitos

- **Node.js 20+**
- Para producción: una cuenta en [Turso](https://turso.tech) (base de datos libSQL).
- En desarrollo local se usa un archivo SQLite (`file:local.db`), sin necesidad de cuenta Turso.

---

## Setup local paso a paso

1. **Instalar dependencias**

   ```bash
   npm install
   ```

2. **Crear el archivo de entorno** a partir del ejemplo:

   ```bash
   cp .env.example .env.local
   ```

3. **Generar `AUTH_SECRET`** (cualquiera de las dos opciones) y pegarlo en `.env.local`:

   ```bash
   npx auth secret
   # o bien
   openssl rand -base64 32
   ```

   Para desarrollo local podés dejar `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` vacíos: la app y los scripts de DB caen por defecto a `file:local.db`.

4. **Crear el esquema de la base de datos local**:

   ```bash
   npm run db:push
   ```

   > Este script usa `TURSO_DATABASE_URL=file:local.db`, por lo que sincroniza el esquema contra el archivo SQLite local.

5. **Sembrar datos de demo**:

   ```bash
   npm run db:seed
   ```

6. **Levantar el servidor de desarrollo**:

   ```bash
   npm run dev
   ```

   Abrí [http://localhost:3000](http://localhost:3000).

---

## Variables de entorno

Definidas en `.env.example`:

| Variable              | Descripción                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `TURSO_DATABASE_URL`  | URL de la base libSQL/Turso. En local: `file:local.db`.            |
| `TURSO_AUTH_TOKEN`    | Token de autenticación de Turso (solo necesario en producción).    |
| `AUTH_SECRET`         | Secreto de Auth.js. Generar con `npx auth secret`.                 |

---

## Base de datos y migraciones

El esquema vive en `src/lib/db/schema.ts` y la configuración de Drizzle Kit en `drizzle.config.ts` (dialecto `turso`, salida en `./drizzle`). Hay migraciones versionadas en la carpeta `drizzle/`.

| Script             | Qué hace                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `npm run db:generate` | Genera un archivo de migración SQL a partir de los cambios en el schema.                |
| `npm run db:push`     | Sincroniza el esquema directamente contra la base (sin migraciones). Útil en desarrollo. |
| `npm run db:migrate`  | Aplica las migraciones versionadas de `drizzle/`.                                        |
| `npm run db:studio`   | Abre Drizzle Studio para inspeccionar la base local.                                      |

> ⚠️ **NOTA IMPORTANTE sobre producción**
>
> La base de **producción se creó con `push`**, por lo que **no tiene journal de migraciones**. Para aplicar cambios de schema en producción **NO uses `db:migrate`** (intentaría recrear las tablas). En su lugar, usá `push` apuntando a las credenciales reales:
>
> ```bash
> npx dotenv-cli -e .env.local -- npx drizzle-kit push
> ```

---

## Credenciales demo

El seed (`src/lib/db/seed.ts`) crea estos usuarios. **Son solo para desarrollo — cambialos antes de cualquier despliegue real.**

| Rol      | Email                   | Contraseña  |
| -------- | ----------------------- | ----------- |
| Admin    | `admin@lavadero55.com`  | `admin123`  |
| Dueño    | `dueno@lavadero55.com`  | `owner123`  |
| Operario | `juan@lavadero55.com`   | `worker123` |

El seed también carga datos base: tipos de vehículo (Carro, Moto), 6 slots (4 de parqueo `P-01..P-04` y 2 de lavado `L-01..L-02`), tarifas de parqueo por hora/día, servicios de lavado (5 para carro, 3 para moto) y la configuración del negocio.

---

## Módulos

Páginas del dashboard (`src/app/(dashboard)/`):

- **Dashboard / Slots** (`/`) — visualización de ocupación de slots de parqueo y lavado.
- **Ingreso** (`/ingreso`) — registro de ingreso de vehículos.
- **Órdenes** (`/ordenes`) — gestión de órdenes de servicio.
- **Mensualidades** (`/mensualidades`) — administración de clientes con plan mensual.
- **Turnos** (`/turnos`) — gestión de turnos del personal.
- **Reportes** (`/reportes`) — métricas y gráficas del negocio (Recharts).
- **Configuración** (`/configuracion`) — ajustes del negocio, servicios, tarifas y usuarios.

---

## Deploy

Recomendado: **Vercel**.

1. Conectá el repositorio en Vercel.
2. Configurá las variables de entorno en el proyecto:
   - `TURSO_DATABASE_URL` — URL de la base Turso de producción.
   - `TURSO_AUTH_TOKEN` — token de Turso.
   - `AUTH_SECRET` — secreto de Auth.js.
3. Para aplicar cambios de schema en producción, usá `push` (ver la nota en [Base de datos y migraciones](#base-de-datos-y-migraciones)).

---

## Scripts

| Script             | Comando                | Descripción                                  |
| ------------------ | ---------------------- | -------------------------------------------- |
| `dev`              | `next dev`             | Servidor de desarrollo.                      |
| `build`            | `next build`           | Build de producción.                         |
| `start`            | `next start`           | Sirve el build de producción.                |
| `lint`             | `eslint`               | Linter.                                      |
| `db:push`          | `drizzle-kit push`     | Sincroniza el schema contra la base (local). |
| `db:generate`      | `drizzle-kit generate` | Genera una migración SQL.                     |
| `db:migrate`       | `drizzle-kit migrate`  | Aplica migraciones versionadas.              |
| `db:seed`          | `tsx src/lib/db/seed.ts` | Siembra datos de demo.                     |
| `db:studio`        | `drizzle-kit studio`   | Abre Drizzle Studio.                          |
