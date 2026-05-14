import { db } from "@/lib/db/client";
import {
  serviceOrders,
  vehicles,
  vehicleTypes,
  orderItems,
  services,
  users,
  slots,
} from "@/lib/db/schema";
import { eq, and, gte, ne, sql } from "drizzle-orm";

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
  currentStatus: ActiveStatus,
  _isAdmin: boolean
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

  // Free the slot when delivered
  if (next === "delivered") {
    const [order] = await db
      .select({ slotId: serviceOrders.slotId })
      .from(serviceOrders)
      .where(eq(serviceOrders.id, id))
      .limit(1);

    if (order?.slotId) {
      await db
        .update(slots)
        .set({ status: "free" })
        .where(eq(slots.id, order.slotId));
    }
  }

  return getOrderById(id);
}
