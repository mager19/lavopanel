# Arquitectura técnica — LavoPanel

## Stack

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| Framework | Next.js (App Router) | 15.x | SSR, API routes, edge runtime, deploy nativo en Vercel |
| Lenguaje | TypeScript | 5.x | Type safety end-to-end |
| Estilos | Tailwind CSS | 4.x | Utility-first, consistente con shadcn/ui |
| Componentes | shadcn/ui | latest | Accesible, sin bundle overhead, compatible con Tailwind |
| Base de datos | Turso (libSQL/SQLite) | — | Free tier 9 GB, sin pausa por inactividad, edge-compatible |
| ORM | Drizzle ORM | latest | Type-safe, ligero, excelente soporte libSQL |
| Auth | Auth.js v5 (NextAuth) | 5.x | Credentials provider, JWT sessions, multi-provider ready |
| Validación | Zod | 3.x | Schemas compartidos cliente/servidor |
| Forms | React Hook Form | 7.x | Rendimiento, integración con Zod |
| Data fetching | SWR | 2.x | Polling, caché, revalidación automática |
| Gráficos | Recharts | 2.x | Ligero, composable, compatible con React |
| Deploy | Vercel | — | Free tier, CI/CD automático desde Git, env vars |

---

## Esquema de base de datos

```sql
-- Tipos de vehículo (Carro, Moto, Camioneta...)
vehicle_types (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  icon        TEXT,                    -- nombre de icono Lucide
  active      INTEGER DEFAULT 1
)

-- Usuarios del sistema (admin, dueño, trabajador)
users (
  id             INTEGER PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  role           TEXT NOT NULL,        -- 'admin' | 'owner' | 'worker'
  active         INTEGER DEFAULT 1,
  created_at     INTEGER NOT NULL      -- Unix timestamp
)

-- Vehículos registrados
vehicles (
  id               INTEGER PRIMARY KEY,
  plate            TEXT NOT NULL UNIQUE,
  vehicle_type_id  INTEGER REFERENCES vehicle_types(id),
  owner_name       TEXT,
  owner_phone      TEXT,
  notes            TEXT,
  created_at       INTEGER NOT NULL
)

-- Servicios de lavado disponibles
services (
  id                INTEGER PRIMARY KEY,
  name              TEXT NOT NULL,
  vehicle_type_id   INTEGER REFERENCES vehicle_types(id),
  price             INTEGER NOT NULL,  -- en pesos colombianos (sin decimales)
  estimated_minutes INTEGER,
  position          INTEGER,           -- orden visual en el formulario
  active            INTEGER DEFAULT 1
)

-- Tarifas de parqueo (por tipo de vehículo y granularidad)
parking_rates (
  id               INTEGER PRIMARY KEY,
  vehicle_type_id  INTEGER REFERENCES vehicle_types(id),
  rate_type        TEXT NOT NULL,      -- 'hour' | 'day'
  amount           INTEGER NOT NULL    -- en pesos colombianos
)

-- Slots físicos del establecimiento
slots (
  id        INTEGER PRIMARY KEY,
  label     TEXT NOT NULL,             -- 'P-01', 'L-02', etc.
  kind      TEXT NOT NULL,             -- 'parking' | 'wash'
  status    TEXT DEFAULT 'free',       -- 'free' | 'occupied' | 'in_progress'
  position  INTEGER,                   -- orden en la grilla visual
  active    INTEGER DEFAULT 1
)

-- Turnos de trabajo
shifts (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  opened_at     INTEGER NOT NULL,      -- Unix timestamp
  opening_cash  INTEGER NOT NULL,      -- caja inicial en pesos
  closed_at     INTEGER,
  closing_cash  INTEGER,
  notes         TEXT
)

-- Órdenes de servicio (una por ingreso de vehículo)
service_orders (
  id           INTEGER PRIMARY KEY,
  vehicle_id   INTEGER REFERENCES vehicles(id),
  slot_id      INTEGER REFERENCES slots(id),
  employee_id  INTEGER REFERENCES users(id),
  shift_id     INTEGER REFERENCES shifts(id),
  status       TEXT NOT NULL DEFAULT 'received',
               -- 'received' | 'in_progress' | 'ready' | 'delivered'
  total        INTEGER NOT NULL,       -- snapshot del total en pesos
  created_at   INTEGER NOT NULL,
  started_at   INTEGER,                -- cuando pasó a in_progress
  finished_at  INTEGER,               -- cuando pasó a ready
  delivered_at INTEGER                 -- cuando se entregó (libera slot)
)

-- Items de una orden (uno por servicio seleccionado)
order_items (
  id             INTEGER PRIMARY KEY,
  order_id       INTEGER REFERENCES service_orders(id),
  service_id     INTEGER REFERENCES services(id),
  price_snapshot INTEGER NOT NULL,    -- precio al momento del ingreso
  qty            INTEGER DEFAULT 1
)

-- Planes mensuales de parqueo
monthly_plans (
  id          INTEGER PRIMARY KEY,
  vehicle_id  INTEGER REFERENCES vehicles(id),
  start_date  TEXT NOT NULL,          -- ISO date 'YYYY-MM-DD'
  end_date    TEXT NOT NULL,
  amount      INTEGER NOT NULL,
  status      TEXT DEFAULT 'active',  -- 'active' | 'expired' | 'cancelled'
  notes       TEXT
)

-- Configuración del negocio (key-value)
business_config (
  id    INTEGER PRIMARY KEY,
  key   TEXT NOT NULL UNIQUE,         -- 'business_name', 'open_time', etc.
  value TEXT NOT NULL
)
```

### Notas de modelado

- **Precios en enteros (pesos)**: no se usan decimales. $15.000 = `15000`.
- **Timestamps como Unix integers**: compatibles con libSQL/SQLite, fáciles de comparar y filtrar.
- **Fechas como ISO strings**: solo para `monthly_plans` donde importa el día calendario, no el instante.
- **Soft delete**: entidades con `active` nunca se eliminan físicamente.
- **Snapshot de precios**: `order_items.price_snapshot` y `service_orders.total` se calculan y guardan al crear la orden. Cambios futuros de tarifa no afectan registros históricos.

---

## Estructura de carpetas

```
lavaderola55/
├── docs/                        # ← estás aquí
│   ├── especificaciones.md
│   ├── plan.md
│   ├── arquitectura.md
│   └── flujos.md
├── design.md                    # sistema de diseño + prompts Stitch
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx       # sidebar + bottom nav + auth guard
│   │   │   ├── page.tsx         # dashboard principal (grilla de slots)
│   │   │   ├── ingreso/
│   │   │   │   └── page.tsx
│   │   │   ├── ordenes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── mensualidades/
│   │   │   │   └── page.tsx
│   │   │   ├── turnos/
│   │   │   │   └── page.tsx
│   │   │   ├── reportes/
│   │   │   │   └── page.tsx
│   │   │   └── configuracion/
│   │   │       └── page.tsx     # tabs: plazas, tarifas, servicios, vehículos, empleados, negocio
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── slots/
│   │       │   └── route.ts
│   │       ├── orders/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── shifts/
│   │       │   └── route.ts
│   │       └── reports/
│   │           └── route.ts
│   ├── components/
│   │   ├── slots/
│   │   │   ├── SlotGrid.tsx     # grilla principal del dashboard
│   │   │   └── SlotCard.tsx     # tarjeta individual de slot
│   │   ├── orders/
│   │   │   ├── OrderCard.tsx
│   │   │   ├── OrderStatusBadge.tsx
│   │   │   └── StatusStepper.tsx
│   │   ├── forms/
│   │   │   ├── IngresoForm.tsx
│   │   │   └── PlateInput.tsx   # input especializado para placa
│   │   ├── reports/
│   │   │   ├── SalesBarChart.tsx
│   │   │   ├── ServiceDonut.tsx
│   │   │   └── EmployeeTable.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── ShiftBanner.tsx  # banner de turno abierto
│   │   └── ui/                  # componentes shadcn/ui (auto-generados)
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts        # definición Drizzle de todas las tablas
│   │   │   ├── client.ts        # instancia libSQL + Drizzle
│   │   │   └── seed.ts          # datos iniciales para demo
│   │   ├── services/            # lógica de negocio (sin acceso directo a Request/Response)
│   │   │   ├── orders.ts        # crear, avanzar estado, calcular total
│   │   │   ├── shifts.ts        # abrir, cerrar, obtener turno activo
│   │   │   ├── vehicles.ts      # buscar por placa, crear
│   │   │   ├── reports.ts       # queries de reportes
│   │   │   └── config.ts        # leer/escribir business_config
│   │   ├── auth.ts              # configuración Auth.js
│   │   └── utils.ts             # helpers (formatear pesos, fechas, etc.)
│   ├── types/
│   │   └── index.ts             # tipos compartidos (OrderStatus, UserRole, etc.)
│   └── middleware.ts            # protección de rutas por rol
├── drizzle/                     # migraciones generadas por drizzle-kit
├── .env.local                   # variables de entorno (no commitear)
├── .env.example                 # plantilla de variables (sí commitear)
└── drizzle.config.ts
```

---

## Variables de entorno

```bash
# .env.example

# Turso (libSQL)
TURSO_DATABASE_URL=libsql://[db-name]-[org].turso.io
TURSO_AUTH_TOKEN=eyJ...

# Auth.js
AUTH_SECRET=genera-con-openssl-rand-base64-32

# Entorno
NODE_ENV=development
```

Para generar `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## Decisiones de arquitectura

### ¿Por qué libSQL (Turso) en lugar de Postgres?
Turso ofrece SQLite en la nube con free tier de 9 GB sin pausa por inactividad. Neon y Vercel Postgres pausan proyectos inactivos en el free tier, lo que generaría cold starts de varios segundos en el primer uso del día — inaceptable en un local operativo.

### ¿Por qué no Supabase?
Supabase pausa proyectos inactivos después de 1 semana en el free tier. Además, la cantidad de features de Supabase (auth, realtime, storage) introduce complejidad innecesaria para este caso.

### ¿Por qué polling en lugar de WebSockets?
El dashboard necesita actualización en tiempo real de los slots. Para un local pequeño con ≤20 slots y ≤5 usuarios simultáneos, polling con SWR cada 8 segundos es suficiente y mucho más simple de desplegar en Vercel (WebSockets y SSE requieren infraestructura persistente). Se puede migrar a SSE o Pusher en el futuro sin cambiar la UI.

### ¿Por qué App Router y no Pages Router?
App Router permite Server Components, lo que simplifica el data fetching inicial (sin `getServerSideProps`), mejora el rendimiento y es la dirección oficial de Next.js desde la versión 13.

### ¿Por qué la capa `lib/services/`?
Para desacoplar la lógica de negocio de las rutas HTTP. Así, cuando se agregue un portal de clientes o una API pública, los mismos servicios se reusan sin duplicar lógica. Cada función en `services/` recibe parámetros tipados y retorna datos, sin acceder a `Request` o `Response`.

---

## Guía de deployment

### Primer deploy

1. Push del repositorio a GitHub.
2. Importar el proyecto en Vercel.
3. Agregar variables de entorno en Vercel Dashboard → Settings → Environment Variables.
4. Vercel detecta Next.js automáticamente y configura el build.
5. Tras el primer deploy, ejecutar la migración inicial:
   ```bash
   npx drizzle-kit push
   ```
6. Ejecutar el seed:
   ```bash
   npx tsx src/lib/db/seed.ts
   ```

### Deploys subsiguientes

Cada push a `main` dispara un deploy automático en Vercel. Las migraciones de schema se ejecutan manualmente con `drizzle-kit push` antes de cada deploy que cambie el schema.
