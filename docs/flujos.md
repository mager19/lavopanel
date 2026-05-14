# Flujos y state machines — LavoPanel

## 1. Flujo de ingreso de vehículo

```
Trabajador abre /ingreso
        │
        ▼
┌─────────────────┐
│ Ingresa placa   │
└────────┬────────┘
         │
         ▼
  ¿Placa existe en DB?
    │           │
   Sí           No
    │           │
    ▼           ▼
Auto-completa   Crear vehículo
tipo y cliente  nuevo en DB
    │           │
    └─────┬─────┘
          │
          ▼
  ¿Placa tiene orden activa?
    │           │
   Sí           No
    │           │
    ▼           ▼
Mostrar error  Continuar
"Vehículo ya   formulario
está dentro"
          │
          ▼
  Seleccionar modalidad
    │           │
 Diario      Mensual
    │           │
    ▼           ▼
Seleccionar  ¿Plan activo?
servicio(s)    │       │
               Sí      No
               │       │
               ▼       ▼
           Registrar  Mostrar
           como       aviso sin
           mensual    plan activo
    │           │
    └─────┬─────┘
          │
          ▼
Seleccionar slot disponible
(filtrado por kind correcto)
          │
          ▼
Seleccionar empleado asignado
(default: usuario logueado)
          │
          ▼
Revisar total calculado
          │
          ▼
   [Registrar ingreso]
          │
          ▼
Crea service_order (status: received)
Crea order_items
Actualiza slot.status → 'occupied' o 'in_progress'
Vincula shift_id al turno activo del usuario
          │
          ▼
Redirige a /ordenes/[id]
```

---

## 2. State machine — Órdenes de servicio

```
                    ┌─────────────────────────────────────────┐
                    │          (solo admin puede revertir)     │
                    │                                          │
         ┌──────────▼──────────┐                              │
         │      RECIBIDO       │ ← estado inicial             │
         │     (received)      │                              │
         └──────────┬──────────┘                              │
                    │ trabajador / dueño / admin               │
                    ▼                                          │
         ┌──────────────────────┐                             │
         │     EN LAVADO        │                             │
         │    (in_progress)     │ ─────────────────────────── ┘
         │  slot → in_progress  │
         └──────────┬───────────┘
                    │ trabajador / dueño / admin
                    ▼
         ┌──────────────────────┐
         │   LISTO PARA ENTREGA │
         │       (ready)        │
         └──────────┬───────────┘
                    │ trabajador / dueño / admin
                    ▼
         ┌──────────────────────┐
         │      ENTREGADO       │ ← estado final
         │    (delivered)       │
         │  slot → free         │ ← libera el slot automáticamente
         └──────────────────────┘
```

### Reglas de transición

| Desde | Hacia | Quién puede | Efecto colateral |
|---|---|---|---|
| `received` | `in_progress` | todos | `started_at = now()`, `slot.status = 'in_progress'` |
| `in_progress` | `ready` | todos | `finished_at = now()` |
| `ready` | `delivered` | todos | `delivered_at = now()`, `slot.status = 'free'` |
| cualquiera | estado anterior | solo admin | revertir estado, sin cambio de slot |

### Campos de timestamp por transición

```
created_at   → al crear la orden (received)
started_at   → al pasar a in_progress
finished_at  → al pasar a ready
delivered_at → al pasar a delivered
```

---

## 3. Ciclo de vida de un turno

```
         ┌─────────────────────────────────────┐
         │         SIN TURNO ABIERTO            │
         │  trabajador no puede registrar       │
         │  ingresos ni cambiar estados         │
         └──────────────┬──────────────────────┘
                        │ usuario pulsa "Abrir turno"
                        │ ingresa caja inicial
                        ▼
         ┌─────────────────────────────────────┐
         │          TURNO ABIERTO               │
         │  shift.opened_at = now()             │
         │  shift.opening_cash = monto          │
         │                                      │
         │  Durante el turno:                   │
         │  - Cada service_order creada queda   │
         │    vinculada a este shift_id          │
         │  - El dashboard muestra KPIs en vivo │
         └──────────────┬──────────────────────┘
                        │ usuario pulsa "Cerrar turno"
                        │ ingresa caja final
                        ▼
         ┌─────────────────────────────────────┐
         │          TURNO CERRADO               │
         │  shift.closed_at = now()             │
         │  shift.closing_cash = monto          │
         │                                      │
         │  Consolidado generado:               │
         │  - Total órdenes del turno           │
         │  - Total ingresos del turno          │
         │  - Diferencia de caja                │
         │    (closing - opening - ingresos)    │
         └─────────────────────────────────────┘
```

### Reglas de turnos

- Un usuario solo puede tener **un turno abierto a la vez**.
- Al cerrar el turno, los ingresos del día **no** se resetean en el dashboard — el dashboard muestra el día calendario completo (suma de todos los turnos del día).
- El dueño/admin puede ver el historial de todos los turnos; el trabajador solo ve los propios.
- Si el turno queda abierto al final del día (el trabajador se fue sin cerrar), el admin puede cerrarlo desde `/configuracion` o `/turnos`.

---

## 4. Ciclo de vida de una mensualidad

```
Admin/dueño crea plan mensual
para una placa específica
        │
        ▼
┌───────────────┐
│    ACTIVO     │ ← desde start_date hasta end_date
│   (active)    │
└───────┬───────┘
        │
        ├── end_date se cumple → automáticamente VENCIDO
        │
        ├── admin lo cancela manualmente → CANCELADO
        │
        ▼
┌───────────────┐   ┌───────────────┐
│   VENCIDO     │   │  CANCELADO    │
│  (expired)    │   │ (cancelled)   │
└───────────────┘   └───────────────┘
```

### Reconocimiento al ingresar

```
Operario digita placa en /ingreso
        │
        ▼
  Sistema busca plan mensual activo para esa placa
        │
    Encontrado          No encontrado
        │                    │
        ▼                    ▼
Auto-selecciona          Muestra flujo
modalidad "Mensual"      normal (diario)
Muestra badge verde
"Plan activo hasta [fecha]"
```

### Alertas de vencimiento

- **≤ 7 días**: badge amarillo en la lista de mensualidades y widget en dashboard.
- **Vencido**: badge rojo, el vehículo ya no es reconocido como mensual al ingresar.

---

## 5. Flujo de configuración inicial (onboarding)

Al arrancar el sistema por primera vez (sin datos), el admin debe completar este orden para que el sistema sea usable:

```
1. Login como admin (usuario creado en seed)
        │
        ▼
2. /configuracion → Tipos de vehículo
   Verificar o agregar: Carro, Moto
        │
        ▼
3. /configuracion → Plazas
   Crear slots del establecimiento
   Ej: P-01..P-10 (parqueo), L-01..L-03 (lavado)
        │
        ▼
4. /configuracion → Tarifas
   Definir precio/hora y precio/día por tipo de vehículo
        │
        ▼
5. /configuracion → Servicios
   Crear los servicios de lavado con precios
        │
        ▼
6. /configuracion → Empleados
   Crear usuarios para los trabajadores y el dueño
        │
        ▼
7. /configuracion → Negocio
   Nombre del local, horario
        │
        ▼
Sistema listo para operar
```

---

## 6. Flujo de generación de reporte

```
Dueño/admin abre /reportes
        │
        ▼
Selecciona período (hoy / semana / mes / rango)
        │
        ▼
Sistema ejecuta queries en paralelo:
  ├── Ventas por día del período
  ├── Órdenes por empleado
  ├── Mix de servicios
  └── Resumen de turnos
        │
        ▼
Renderiza gráficos y tablas
        │
        ▼
[Exportar CSV] → descarga archivo con datos crudos del período
```
