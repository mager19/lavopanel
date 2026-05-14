# Especificaciones funcionales — LavoPanel

## Descripción del negocio

Lavadero y parqueadero de carros y motos ubicado en Colombia. Opera con:
- **Parqueo**: por día o por plan mensual (carro y moto).
- **Lavado**: servicios puntuales (sencillo, completo, de motor, cojinería, etc.).
- **Personal**: dueño, admin y operarios (trabajadores) que abren y cierran turnos.

La app es una herramienta **interna** para el personal del establecimiento. Los clientes finales no interactúan con ella en el MVP.

---

## Roles y permisos

| Acción | Trabajador | Dueño | Admin |
|---|:---:|:---:|:---:|
| Ver dashboard y slots | ✅ | ✅ | ✅ |
| Registrar ingreso de vehículo | ✅ | ✅ | ✅ |
| Cambiar estado de orden | ✅ | ✅ | ✅ |
| Abrir / cerrar turno propio | ✅ | ✅ | ✅ |
| Ver órdenes de otros turnos | ❌ | ✅ | ✅ |
| Ver reportes y consolidados | ❌ | ✅ | ✅ |
| Gestionar mensualidades | ❌ | ✅ | ✅ |
| Panel de configuración | ❌ | ✅ | ✅ |
| Crear / editar empleados | ❌ | ❌ | ✅ |
| Eliminar registros | ❌ | ❌ | ✅ |

> Regla: los registros **nunca se borran físicamente** (solo se marcan inactivos) para preservar integridad de reportes históricos.

---

## Módulos del MVP

### 1. Autenticación
- Login con email + contraseña.
- Sesión persistente (JWT).
- Acceso bloqueado sin turno abierto para trabajadores (solo pueden ver, no registrar).
- Recuperación de contraseña: fuera de alcance en MVP (el admin la resetea manualmente).

### 2. Panel de configuración
*Solo admin/dueño. Pestañas:*

**Plazas (slots)**
- Crear, editar y desactivar bahías de lavado y espacios de parqueo.
- Cada slot tiene: label (ej. `P-01`, `L-02`), tipo (`parqueo` / `lavado`), posición (orden visual), estado activo.
- El estado operativo (libre/ocupado/en proceso) lo gestiona el sistema automáticamente.

**Tarifas de parqueo**
- Precio por hora y por día, diferenciado por tipo de vehículo.
- Ejemplo: carro $3.000/h, $15.000/día — moto $2.000/h, $10.000/día.
- Al calcular el total de una orden de parqueo, se usa la tarifa vigente en ese momento (snapshot).

**Servicios de lavado**
- CRUD: nombre, precio, tiempo estimado (minutos), tipo de vehículo al que aplica, activo/inactivo.
- Un mismo servicio puede tener precios distintos por tipo de vehículo.

**Tipos de vehículo**
- CRUD: nombre (Carro, Moto, Camioneta…), icono.

**Empleados**
- CRUD de usuarios: nombre, email, contraseña inicial, rol, activo/inactivo.
- El admin es el único que puede crear usuarios.

**Negocio**
- Nombre del local, horario de atención (referencia informativa para turnos).

### 3. Dashboard (pantalla principal)
- Grilla visual de todos los slots activos con su estado en tiempo real.
- Colores de estado: verde (libre), ámbar (parqueado sin lavado activo), azul (en lavado), teal (listo para entrega).
- KPIs del turno actual: autos ingresados hoy, órdenes listas para recoger, ingresos del turno.
- Botón flotante "+ Ingreso" siempre visible.
- Actualización automática cada 5–10 segundos (polling SWR).

### 4. Registro de ingreso
Formulario rápido, diseñado para completarse en ≤ 30 segundos:
- **Placa** — obligatoria, mayúsculas automáticas. Si la placa ya existe en el sistema, auto-completa tipo de vehículo y datos del cliente.
- **Tipo de vehículo** — selector visual grande (Carro / Moto / …).
- **Modalidad** — Diario o Mensual.
  - *Mensual*: verifica si ya tiene plan activo; si existe, lo reconoce automáticamente.
  - *Diario*: selecciona servicio(s).
- **Servicio(s)** — checklist de servicios aplicables al tipo de vehículo elegido.
- **Slot** — selector de slots disponibles del tipo correcto (parqueo/lavado).
- **Empleado asignado** — selector (por defecto: el usuario logueado).
- **Cliente** — nombre y teléfono opcionales.
- **Total calculado** automáticamente según servicios y tarifas vigentes.

### 5. Órdenes de servicio
- Lista con filtros: estado, fecha, empleado.
- Cada orden muestra: placa, tipo, servicio(s), empleado, estado, tiempo transcurrido, total.
- **Workflow de estados** (ver `flujos.md` para el diagrama completo):
  `Recibido → En lavado → Listo → Entregado`
- Solo se puede avanzar al estado siguiente (no retroceder, salvo admin).
- Al marcar como "Entregado" se libera automáticamente el slot.

### 6. Turnos
- Cada usuario abre **un turno a la vez**.
- Al abrir el turno: registra caja inicial (efectivo de apertura).
- Al cerrar el turno: registra caja final y genera el consolidado (órdenes realizadas, ingresos totales, diferencia de caja).
- Las órdenes creadas durante un turno quedan vinculadas a ese turno.
- Historial de turnos: consulta por fecha o empleado.
- Consolidado semanal automático de todos los turnos.

### 7. Mensualidades de parqueo
- Un vehículo puede tener un plan mensual activo.
- El plan tiene: fecha inicio, fecha fin, monto total, estado (activo / vencido / cancelado).
- Al ingresar una placa con plan activo → el sistema la identifica y la registra como parqueo mensual sin cobro puntual.
- Alerta visual para planes que vencen en ≤ 7 días.
- Historial de planes por vehículo.

### 8. Reportes
Acceso: dueño y admin.

| Reporte | Filtros | Visualización |
|---|---|---|
| Ventas por período | Fecha inicio/fin | Barra (ventas por día), total |
| Por empleado | Período, empleado | Tabla + total por persona |
| Por servicio | Período | Donut (mix de servicios) |
| Por turno | Fecha | Tabla de turnos con caja y diferencia |
| Consolidado semanal | Semana | Resumen automático |
| Ocupación de slots | Período | Línea (% ocupación por hora) |

- Exportar a CSV.
- Todos los reportes usan datos históricos (sin afectar operación en vivo).

---

## Reglas de negocio

1. **No hay slot sin límite** — un vehículo solo puede ocupar un slot a la vez.
2. **Placa única activa** — no se puede registrar la misma placa dos veces con orden activa simultánea.
3. **Turno obligatorio** — los trabajadores no pueden registrar ingresos si no tienen un turno abierto.
4. **Snapshot de precios** — el precio guardado en la orden es el vigente al momento del ingreso, no el actual. Los cambios de tarifa no afectan órdenes pasadas.
5. **Soft delete** — los registros nunca se eliminan. Las entidades tienen campo `active` o `status`.
6. **Transiciones de estado protegidas** — solo admin puede revertir el estado de una orden.

---

## Fuera de alcance (MVP)

- Portal o app para clientes finales (reservas online, ver estado del auto).
- Notificaciones push, SMS o WhatsApp.
- Integración con pasarelas de pago.
- Facturación electrónica (DIAN Colombia).
- Inventario de insumos (jabón, cera, etc.).
- Control de caja con múltiples denominaciones.
- App móvil nativa (iOS/Android) — la web es PWA-friendly pero no es app store.
- Multi-sede (una sola sede por instancia en MVP).

---

## Criterios de aceptación del MVP

- [ ] Un trabajador puede registrar el ingreso de un vehículo en ≤ 30 segundos.
- [ ] El dashboard refleja cambios de estado en ≤ 10 segundos sin recargar la página.
- [ ] El dueño puede ver el consolidado del día (ventas por empleado y por servicio) al final de la jornada.
- [ ] El admin puede agregar un nuevo servicio y un nuevo empleado sin tocar código.
- [ ] La app funciona correctamente en un teléfono Android de gama media (Chrome, pantalla 375px).
- [ ] El sistema impide registrar la misma placa activa dos veces.
- [ ] Un plan mensual vencido muestra alerta visual antes de vencer.
