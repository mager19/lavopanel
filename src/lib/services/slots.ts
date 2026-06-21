import { db } from "@/lib/db/client";
import { slots, serviceOrders } from "@/lib/db/schema";
import { eq, asc, and, ne } from "drizzle-orm";

export async function getSlots() {
  return db
    .select()
    .from(slots)
    .where(eq(slots.active, true))
    .orderBy(asc(slots.position));
}

export async function getAllSlots() {
  return db.select().from(slots).orderBy(asc(slots.position));
}

export async function createSlot(data: {
  label: string;
  kind: "parking" | "wash";
  position?: number;
}) {
  const [created] = await db
    .insert(slots)
    .values({
      label: data.label,
      kind: data.kind,
      position: data.position ?? null,
    })
    .returning();
  return created;
}

export async function updateSlot(
  id: number,
  data: {
    label?: string;
    kind?: "parking" | "wash";
    position?: number;
    active?: boolean;
    status?: "free" | "occupied" | "in_progress";
  }
) {
  const [updated] = await db
    .update(slots)
    .set(data)
    .where(eq(slots.id, id))
    .returning();
  return updated;
}

/**
 * Elimina un espacio. No permite eliminar uno con un vehículo activo (orden no
 * entregada). Si el espacio tiene historial de órdenes, se archiva
 * (active=false) para preservar los datos; si no, se elimina definitivamente.
 */
export async function deleteSlot(id: number) {
  const activeOrder = await db
    .select({ id: serviceOrders.id })
    .from(serviceOrders)
    .where(and(eq(serviceOrders.slotId, id), ne(serviceOrders.status, "delivered")))
    .get();
  if (activeOrder) {
    throw new Error("No se puede eliminar un espacio con un vehículo activo");
  }

  const anyOrder = await db
    .select({ id: serviceOrders.id })
    .from(serviceOrders)
    .where(eq(serviceOrders.slotId, id))
    .get();

  if (anyOrder) {
    await db.update(slots).set({ active: false }).where(eq(slots.id, id));
    return { archived: true as const };
  }

  await db.delete(slots).where(eq(slots.id, id));
  return { archived: false as const };
}

export async function setSlotStatus(
  id: number,
  status: "free" | "occupied" | "in_progress"
) {
  const [updated] = await db
    .update(slots)
    .set({ status })
    .where(eq(slots.id, id))
    .returning();
  return updated;
}
