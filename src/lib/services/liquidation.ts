import { db } from "@/lib/db/client";
import { serviceOrders, vehicles } from "@/lib/db/schema";
import { and, eq, isNull, sql, desc } from "drizzle-orm";

/**
 * Comisión de una orden = total del lavado × % congelado / 100 (redondeado abajo).
 */
function commissionOf(total: number, percent: number): number {
  return Math.floor((total * percent) / 100);
}

/**
 * Comisión pendiente (no liquidada) por trabajador. Solo cuenta órdenes de
 * lavado ya entregadas con empleado asignado y sin liquidar.
 * Devuelve un map: employeeId → { orderCount, commissionTotal }.
 */
export async function getPendingCommissionByWorker(): Promise<
  Map<number, { orderCount: number; commissionTotal: number }>
> {
  const rows = await db
    .select({
      employeeId: serviceOrders.employeeId,
      total: serviceOrders.total,
      commissionPercent: serviceOrders.commissionPercent,
    })
    .from(serviceOrders)
    .where(
      and(
        eq(serviceOrders.kind, "wash"),
        eq(serviceOrders.status, "delivered"),
        isNull(serviceOrders.liquidatedAt)
      )
    );

  const map = new Map<number, { orderCount: number; commissionTotal: number }>();
  for (const r of rows) {
    if (!r.employeeId) continue;
    const prev = map.get(r.employeeId) ?? { orderCount: 0, commissionTotal: 0 };
    prev.orderCount += 1;
    prev.commissionTotal += commissionOf(r.total, r.commissionPercent);
    map.set(r.employeeId, prev);
  }
  return map;
}

/**
 * Detalle de las órdenes pendientes de liquidar de un trabajador.
 */
export async function getWorkerLiquidationDetail(workerId: number) {
  const rows = await db
    .select({
      id: serviceOrders.id,
      total: serviceOrders.total,
      commissionPercent: serviceOrders.commissionPercent,
      deliveredAt: serviceOrders.deliveredAt,
      plate: vehicles.plate,
    })
    .from(serviceOrders)
    .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id))
    .where(
      and(
        eq(serviceOrders.employeeId, workerId),
        eq(serviceOrders.kind, "wash"),
        eq(serviceOrders.status, "delivered"),
        isNull(serviceOrders.liquidatedAt)
      )
    )
    .orderBy(desc(serviceOrders.deliveredAt));

  const orders = rows.map((r) => ({
    ...r,
    commission: commissionOf(r.total, r.commissionPercent),
  }));
  const commissionTotal = orders.reduce((s, o) => s + o.commission, 0);
  return { orders, commissionTotal, orderCount: orders.length };
}

/**
 * Liquida (marca como pagadas) todas las órdenes pendientes del trabajador.
 * Devuelve el total liquidado y la cantidad de órdenes.
 */
export async function liquidateWorker(workerId: number) {
  const { orders, commissionTotal, orderCount } = await getWorkerLiquidationDetail(workerId);
  if (orderCount === 0) {
    return { orderCount: 0, commissionTotal: 0 };
  }
  const now = new Date();
  const ids = orders.map((o) => o.id);
  await db
    .update(serviceOrders)
    .set({ liquidatedAt: now })
    .where(
      sql`${serviceOrders.id} IN (${sql.join(
        ids.map((id) => sql`${id}`),
        sql`, `
      )})`
    );
  return { orderCount, commissionTotal };
}
