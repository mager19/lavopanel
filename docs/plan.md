# Plan de trabajo — LavoPanel

## Estimado total: 12–17 días de trabajo

---

## Fase 0 — Setup del proyecto (1–2 días)

**Objetivo**: proyecto corriendo en local y en Vercel con auth funcionando.

- [ ] Inicializar Next.js 15 con App Router + TypeScript
- [ ] Configurar Tailwind CSS + shadcn/ui (tema dark por defecto)
- [ ] Crear cuenta en Turso, crear DB, obtener `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`
- [ ] Configurar `@libsql/client` + Drizzle ORM + `drizzle-kit`
- [ ] Definir schema inicial en `src/lib/db/schema.ts`
- [ ] Correr primera migración con `drizzle-kit push`
- [ ] Implementar Auth.js v5 con Credentials provider + bcrypt
- [ ] Middleware de protección de rutas por rol (`middleware.ts`)
- [ ] Layout base: sidebar (desktop), bottom navigation (mobile)
- [ ] Primer deploy a Vercel con variables de entorno

**Definición de terminado**: se puede hacer login y ver una pantalla vacía protegida por rol.

---

## Fase 1 — Núcleo operativo (4–5 días)

**Objetivo**: flujo completo de ingreso → lavado → entrega funcionando.

- [ ] Schema completo + seed inicial (tipos de vehículo, servicios, slots, tarifas de parqueo, business_config)
- [ ] `/configuracion` — tab **Plazas**: CRUD de slots
- [ ] `/configuracion` — tab **Tarifas**: precios hora/día por tipo de vehículo
- [ ] `/configuracion` — tab **Servicios**: CRUD de servicios de lavado
- [ ] `/configuracion` — tab **Vehículos**: CRUD de tipos de vehículo
- [ ] `/ingreso` — formulario rápido (placa + tipo + modalidad + servicio + slot + empleado + cliente)
- [ ] Lógica de auto-reconocimiento de placa existente
- [ ] Validación: placa activa no puede ingresar dos veces
- [ ] `/` dashboard — grilla de slots con estado en tiempo real (SWR polling 8s)
- [ ] KPIs del turno en dashboard (autos hoy, listos, ingresos)
- [ ] `/ordenes` — lista con filtros por estado y fecha
- [ ] `/ordenes/[id]` — detalle + cambio de estado (workflow)
- [ ] Liberar slot automáticamente al marcar orden como "Entregado"

**Definición de terminado**: se puede registrar un auto, lavarlo y entregarlo; el dashboard refleja cada cambio.

---

## Fase 2 — Personal y turnos (2–3 días)

**Objetivo**: control de operarios, apertura/cierre de turno y caja.

- [ ] `/configuracion` — tab **Empleados**: CRUD de usuarios con roles
- [ ] Restricción: trabajadores sin turno abierto no pueden registrar ingresos
- [ ] `/turnos` — pantalla de apertura de turno (caja inicial)
- [ ] `/turnos` — pantalla de cierre de turno (caja final + consolidado)
- [ ] Vinculación automática `service_order.shift_id` al turno activo del usuario
- [ ] Widget "Mi turno" en dashboard: tiempo abierto, órdenes del turno, ingresos del turno
- [ ] `/turnos` — historial de turnos (para dueño/admin)

**Definición de terminado**: un operario abre turno, registra 3 órdenes, las cierra y puede ver el consolidado del turno.

---

## Fase 3 — Mensualidades (1–2 días)

**Objetivo**: gestión de parqueo mensual.

- [ ] `/mensualidades` — listado con estado (activo / vencido / próximo a vencer)
- [ ] Formulario de nuevo plan mensual (vehículo, periodo, monto)
- [ ] Auto-reconocimiento en `/ingreso` de vehículos con plan activo
- [ ] Widget en dashboard: planes que vencen en ≤ 7 días
- [ ] Historial de planes por placa

**Definición de terminado**: se puede crear un plan mensual, el sistema reconoce la placa al ingresar y muestra alertas de vencimiento.

---

## Fase 4 — Reportes (2–3 días)

**Objetivo**: visibilidad financiera y de rendimiento para el dueño.

- [ ] `/reportes` — selector de período (hoy / semana / mes / rango personalizado)
- [ ] Reporte de ventas por día (gráfico de barras, Recharts)
- [ ] Reporte por empleado (tabla: órdenes, ingresos, servicios más frecuentes)
- [ ] Reporte por servicio (donut de mix de servicios)
- [ ] Reporte por turno (tabla: caja inicial, ventas, caja final, diferencia)
- [ ] Consolidado semanal automático
- [ ] Exportar a CSV (todos los reportes)
- [ ] `/configuracion` — tab **Negocio**: nombre del local, horario

**Definición de terminado**: el dueño puede abrir `/reportes`, seleccionar la semana pasada y ver ingresos por empleado exportables.

---

## Fase 5 — Pulido y deploy final (1–2 días)

**Objetivo**: app lista para uso real.

- [ ] Validaciones de formularios con mensajes de error claros
- [ ] Toasts de confirmación y error (shadcn/ui Sonner)
- [ ] Estados de carga (skeletons) en dashboard y listas
- [ ] Pantalla de error 404 y error de servidor
- [ ] Seed completo para demo: 1 admin + 2 trabajadores + servicios reales + slots del local
- [ ] PWA manifest (ícono, nombre, pantalla de inicio)
- [ ] Deploy final a Vercel con dominio personalizado (opcional)
- [ ] Variables de entorno documentadas en `.env.example`

**Definición de terminado**: el dueño puede usar la app desde su teléfono en el local sin guía.

---

## Backlog (post-MVP)

Funcionalidades identificadas pero fuera del alcance inicial:

| Feature | Complejidad | Valor |
|---|---|---|
| Portal de clientes (ver estado del auto por placa) | Media | Alto |
| Reservas online para clientes | Alta | Alto |
| Notificaciones WhatsApp (aviso de auto listo) | Media | Alto |
| Ticket imprimible / comprobante | Baja | Medio |
| Facturación electrónica (DIAN) | Alta | Medio |
| Multi-turno simultáneo por empleado | Baja | Bajo |
| Inventario de insumos | Alta | Bajo |
| Multi-sede | Muy alta | Futuro |

---

## Dependencias y orden crítico

```
Schema DB
  └── Configuración (Plazas, Servicios, Tarifas)
        └── Ingreso de vehículo
              └── Dashboard (slots en vivo)
              └── Órdenes (workflow)
                    └── Turnos (contexto de caja)
                          └── Reportes (datos históricos)
```

> La configuración va **primero** porque el resto del sistema depende de que existan slots, servicios y tipos de vehículo definidos.
