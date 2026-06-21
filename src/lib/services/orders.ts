import { db } from "@/lib/db/client";
import {
  serviceOrders,
  vehicles,
  vehicleTypes,
  orderItems,
  services,
  users,
  slots,
  shifts,
  parkingRates,
} from "@/lib/db/schema";
import { eq, and, gte, ne, isNull, sql } from "drizzle-orm";
import { upsertVehicle } from "./vehicles";

// Next status map
const nextStatus = {
  received: "in_progress",
  in_progress: "ready",
  ready: "delivered",
} as const;

type ActiveStatus = keyof typeof nextStatus;

function todayUnix(): number {
  return Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
}

/**
 * Returns all non-delivered orders with full joins.
 */
export async function getActiveOrders() {
  const rows = await db
    .select({
      order: serviceOrders,
      vehicle: vehicles,
      vehicleType: vehicleTypes,
      employee: users,
    })
    .from(serviceOrders)
    .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id))
    .leftJoin(vehicleTypes, eq(vehicles.vehicleTypeId, vehicleTypes.id))
    .leftJoin(users, eq(serviceOrders.employeeId, users.id))
    .where(ne(serviceOrders.status, "delivered"));

  // Fetch order items separately for each order to avoid cartesian product complexity
  const orderIds = rows.map((r) => r.order.id);

  if (orderIds.length === 0) return [];

  const items = await db
    .select({
      item: orderItems,
      service: services,
    })
    .from(orderItems)
    .leftJoin(services, eq(orderItems.serviceId, services.id))
    .where(
      sql`${orderItems.orderId} IN (${sql.join(
        orderIds.map((id) => sql`${id}`),
        sql`, `
      )})`
    );

  return rows.map((r) => ({
    ...r.order,
    vehicle: r.vehicle,
    vehicleType: r.vehicleType,
    employee: r.employee,
    items: items
      .filter((i) => i.item.orderId === r.order.id)
      .map((i) => ({ ...i.item, service: i.service })),
  }));
}

/**
 * Returns today's KPIs.
 */
export async function getTodayKPIs(): Promise<{
  todayCount: number;
  readyCount: number;
  todayRevenue: number;
}> {
  const startOfDay = todayUnix();

  const [todayCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(serviceOrders)
    .where(gte(serviceOrders.createdAt, new Date(startOfDay * 1000)));

  const [readyCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(serviceOrders)
    .where(eq(serviceOrders.status, "ready"));

  const [revenueRow] = await db
    .select({ total: sql<number>`coalesce(sum(${serviceOrders.total}), 0)` })
    .from(serviceOrders)
    .where(
      and(
        gte(serviceOrders.createdAt, new Date(startOfDay * 1000)),
        sql`${serviceOrders.status} IN ('delivered', 'ready')`
      )
    );

  return {
    todayCount: Number(todayCountRow?.count ?? 0),
    readyCount: Number(readyCountRow?.count ?? 0),
    todayRevenue: Number(revenueRow?.total ?? 0),
  };
}

/**
 * Returns a single order with all joins.
 */
export async function getOrderById(id: number) {
  const [row] = await db
    .select({
      order: serviceOrders,
      vehicle: vehicles,
      vehicleType: vehicleTypes,
      employee: users,
    })
    .from(serviceOrders)
    .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id))
    .leftJoin(vehicleTypes, eq(vehicles.vehicleTypeId, vehicleTypes.id))
    .leftJoin(users, eq(serviceOrders.employeeId, users.id))
    .where(eq(serviceOrders.id, id))
    .limit(1);

  if (!row) return null;

  const items = await db
    .select({ item: orderItems, service: services })
    .from(orderItems)
    .leftJoin(services, eq(orderItems.serviceId, services.id))
    .where(eq(orderItems.orderId, id));

  return {
    ...row.order,
    vehicle: row.vehicle,
    vehicleType: row.vehicleType,
    employee: row.employee,
    items: items.map((i) => ({ ...i.item, service: i.service })),
  };
}

/**
 * Advances an order to the next status.
 * Sets timestamps accordingly and frees the slot on delivery.
 */
export async function advanceOrderStatus(
  id: number,
  currentStatus: ActiveStatus
) {
  const next = nextStatus[currentStatus];
  if (!next) throw new Error(`Cannot advance from status: ${currentStatus}`);

  const now = new Date();
  const updates: Partial<typeof serviceOrders.$inferInsert> = {
    status: next,
  };

  if (next === "in_progress") {
    updates.startedAt = now;
  } else if (next === "ready") {
    updates.finishedAt = now;
  } else if (next === "delivered") {
    updates.deliveredAt = now;
  }

  await db
    .update(serviceOrders)
    .set(updates)
    .where(eq(serviceOrders.id, id));

  // Update slot status when order changes state
  const [order] = await db
    .select({ slotId: serviceOrders.slotId })
    .from(serviceOrders)
    .where(eq(serviceOrders.id, id))
    .limit(1);

  if (order?.slotId) {
    if (next === "in_progress") {
      await db.update(slots).set({ status: "in_progress" }).where(eq(slots.id, order.slotId));
    } else if (next === "delivered") {
      await db.update(slots).set({ status: "free" }).where(eq(slots.id, order.slotId));
    }
  }

  return getOrderById(id);
}

/**
 * Órdenes EN ESPERA: activas (no entregadas) y sin espacio asignado. Es la cola
 * para cuando se ingresa con todo ocupado.
 */
export async function getWaitingOrders() {
  const rows = await db
    .select({
      id: serviceOrders.id,
      kind: serviceOrders.kind,
      status: serviceOrders.status,
      createdAt: serviceOrders.createdAt,
      plate: vehicles.plate,
      vehicleType: vehicleTypes.name,
    })
    .from(serviceOrders)
    .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id))
    .leftJoin(vehicleTypes, eq(vehicles.vehicleTypeId, vehicleTypes.id))
    .where(and(ne(serviceOrders.status, "delivered"), isNull(serviceOrders.slotId)))
    .orderBy(serviceOrders.createdAt);
  return rows;
}

/**
 * Asigna manualmente un espacio libre a una orden en espera y lo ocupa.
 * Valida que el espacio esté libre y que el tipo coincida con la modalidad.
 */
export async function assignSlotToOrder(orderId: number, slotId: number) {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(serviceOrders)
      .where(eq(serviceOrders.id, orderId))
      .limit(1);
    if (!order) throw new Error("Orden no encontrada");
    if (order.status === "delivered") throw new Error("La orden ya fue entregada");
    if (order.slotId) throw new Error("La orden ya tiene un espacio asignado");

    const [slot] = await tx.select().from(slots).where(eq(slots.id, slotId)).limit(1);
    if (!slot || !slot.active) throw new Error("Espacio inválido");
    if (slot.status !== "free") throw new Error("El espacio ya está ocupado");

    // El tipo de espacio debe coincidir con la modalidad de la orden.
    const okKind =
      order.kind === "wash" ? slot.kind === "wash" : slot.kind === "parking" || slot.kind === "monthly";
    if (!okKind) {
      throw new Error(
        order.kind === "wash"
          ? "Asigná una bahía de lavado"
          : "Asigná una plaza de parqueo"
      );
    }

    await tx.update(serviceOrders).set({ slotId }).where(eq(serviceOrders.id, orderId));
    await tx
      .update(slots)
      .set({ status: order.status === "in_progress" ? "in_progress" : "occupied" })
      .where(eq(slots.id, slotId));
  });
}

/**
 * Registra la salida de un parqueo: calcula el cobro (por hora → horas
 * redondeadas hacia arriba × tarifa; por día → monto fijo ya seteado),
 * marca la orden como entregada y libera el espacio.
 */
export async function exitParkingOrder(id: number) {
  const [order] = await db
    .select()
    .from(serviceOrders)
    .where(eq(serviceOrders.id, id))
    .limit(1);

  if (!order) throw new Error("Orden no encontrada");
  if (order.kind !== "parking") throw new Error("La orden no es un parqueo");
  if (order.status === "delivered") throw new Error("El parqueo ya fue cerrado");

  const now = new Date();
  let total = order.total;

  if (order.parkingRateType === "hour") {
    const ms = now.getTime() - new Date(order.createdAt).getTime();
    const hours = Math.max(1, Math.ceil(ms / (1000 * 60 * 60)));
    total = hours * (order.parkingRate ?? 0);
  }

  await db
    .update(serviceOrders)
    .set({ status: "delivered", deliveredAt: now, finishedAt: now, total })
    .where(eq(serviceOrders.id, id));

  if (order.slotId) {
    await db.update(slots).set({ status: "free" }).where(eq(slots.id, order.slotId));
  }

  return getOrderById(id);
}

/**
 * Creates a new service order, upserting the vehicle and updating the slot.
 */
export async function createOrder({
  plate,
  vehicleTypeId,
  serviceIds,
  slotId,
  ownerName,
  ownerPhone,
  userId,
  employeeId,
  kind = "wash",
  parkingRateType,
}: {
  plate: string;
  vehicleTypeId: number;
  serviceIds: number[];
  slotId?: number | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  userId?: number | null;
  employeeId?: number | null;
  kind?: "wash" | "parking";
  parkingRateType?: "hour" | "day" | null;
}) {
  // Todo el ingreso (vehículo + orden + items + ocupar slot) corre en una
  // transacción: si algo falla a mitad, no quedan datos huérfanos.
  return db.transaction(async (tx) => {
    // Find open shift for this user
    let shiftId: number | null = null;
    if (userId) {
      const openShift = await tx
        .select({ id: shifts.id })
        .from(shifts)
        .where(and(eq(shifts.userId, userId), isNull(shifts.closedAt)))
        .get();
      shiftId = openShift?.id ?? null;
    }

    // Upsert vehicle
    const vehicle = await upsertVehicle(
      {
        plate,
        vehicleTypeId,
        ownerName: ownerName ?? undefined,
        ownerPhone: ownerPhone ?? undefined,
      },
      tx
    );

    // ── Parqueo ──────────────────────────────────────────────────
    if (kind === "parking") {
      const rateType = parkingRateType ?? "hour";
      // Tarifa snapshot del tipo de vehículo (por hora o por día).
      const rateRow = await tx
        .select({ amount: parkingRates.amount })
        .from(parkingRates)
        .where(
          and(
            eq(parkingRates.vehicleTypeId, vehicleTypeId),
            eq(parkingRates.rateType, rateType)
          )
        )
        .get();
      const rate = rateRow?.amount ?? 0;
      // Día: se cobra el monto fijo al ingresar. Hora: se cobra a la salida
      // (total arranca en 0 y se calcula al registrar la salida).
      const total = rateType === "day" ? rate : 0;

      const [order] = await tx
        .insert(serviceOrders)
        .values({
          vehicleId: vehicle.id,
          slotId: slotId ?? null,
          employeeId: employeeId ?? userId ?? null,
          shiftId,
          kind: "parking",
          parkingRateType: rateType,
          parkingRate: rate,
          status: "received",
          total,
        })
        .returning();

      if (slotId) {
        await tx.update(slots).set({ status: "occupied" }).where(eq(slots.id, slotId));
      }

      return order;
    }

    // ── Lavado ───────────────────────────────────────────────────
    // Get service prices
    const selectedServices =
      serviceIds.length > 0
        ? await tx
            .select()
            .from(services)
            .where(
              sql`${services.id} IN (${sql.join(
                serviceIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            )
        : [];

    const total = selectedServices.reduce((sum, s) => sum + s.price, 0);

    // Snapshot del % de comisión del empleado asignado (congelado en la orden
    // para que la liquidación use el valor vigente al momento del ingreso).
    const effectiveEmployeeId = employeeId ?? userId ?? null;
    let commissionPercent = 0;
    if (effectiveEmployeeId) {
      const emp = await tx
        .select({ pct: users.commissionPercent })
        .from(users)
        .where(eq(users.id, effectiveEmployeeId))
        .get();
      commissionPercent = emp?.pct ?? 0;
    }

    // Create order
    const [order] = await tx
      .insert(serviceOrders)
      .values({
        vehicleId: vehicle.id,
        slotId: slotId ?? null,
        employeeId: effectiveEmployeeId,
        shiftId,
        kind: "wash",
        status: "received",
        total,
        commissionPercent,
      })
      .returning();

    // Create order items
    if (selectedServices.length > 0) {
      await tx.insert(orderItems).values(
        selectedServices.map((s) => ({
          orderId: order.id,
          serviceId: s.id,
          priceSnapshot: s.price,
          qty: 1,
        }))
      );
    }

    // Mark slot as occupied
    if (slotId) {
      await tx
        .update(slots)
        .set({ status: "occupied" })
        .where(eq(slots.id, slotId));
    }

    return order;
  });
}
