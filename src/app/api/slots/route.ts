import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import {
  slots,
  serviceOrders,
  vehicles,
  vehicleTypes,
  orderItems,
  services,
  users,
} from "@/lib/db/schema";
import { eq, ne, asc, sql } from "drizzle-orm";

export async function GET() {
  try {
    // Fetch all active slots
    const activeSlots = await db
      .select()
      .from(slots)
      .where(eq(slots.active, true))
      .orderBy(asc(slots.position));

    if (activeSlots.length === 0) {
      return NextResponse.json({ slots: [] });
    }

    // Fetch active orders (not delivered) with vehicle and employee info
    const activeOrders = await db
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

    // Fetch order items for active orders
    const orderIds = activeOrders.map((r) => r.order.id);
    const allItems =
      orderIds.length > 0
        ? await db
            .select({ item: orderItems, service: services })
            .from(orderItems)
            .leftJoin(services, eq(orderItems.serviceId, services.id))
            .where(
              sql`${orderItems.orderId} IN (${sql.join(
                orderIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            )
        : [];

    // Build a map of slotId → order info
    const orderBySlot = new Map<
      number,
      {
        id: number;
        plate: string | null;
        vehicleType: string | null;
        service: string | null;
        employee: string | null;
        startedAt: Date | null;
        total: number;
        status: string;
      }
    >();

    for (const row of activeOrders) {
      if (!row.order.slotId) continue;

      // Get the first service name for this order
      const orderItemsForOrder = allItems.filter(
        (i) => i.item.orderId === row.order.id
      );
      const firstService =
        orderItemsForOrder[0]?.service?.name ?? null;

      orderBySlot.set(row.order.slotId, {
        id: row.order.id,
        plate: row.vehicle?.plate ?? null,
        vehicleType: row.vehicleType?.name ?? null,
        service: firstService,
        employee: row.employee?.name ?? null,
        startedAt: row.order.startedAt,
        total: row.order.total,
        status: row.order.status,
      });
    }

    // Merge slots with their active order
    const result = activeSlots.map((slot) => {
      const order = orderBySlot.get(slot.id);
      return {
        id: slot.id,
        label: slot.label,
        kind: slot.kind,
        status: slot.status,
        position: slot.position,
        ...(order ? { order } : {}),
      };
    });

    return NextResponse.json({ slots: result });
  } catch (error) {
    console.error("[GET /api/slots]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
