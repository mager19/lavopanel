import { db } from "@/lib/db/client";
import { slots } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

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
