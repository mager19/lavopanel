import { db } from "@/lib/db/client";
import { vehicleTypes, services, slots } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getVehicleTypes() {
  return db.select().from(vehicleTypes).where(eq(vehicleTypes.active, true));
}

export async function getServicesByType(vehicleTypeId: number) {
  return db
    .select()
    .from(services)
    .where(and(eq(services.vehicleTypeId, vehicleTypeId), eq(services.active, true)))
    .orderBy(services.position);
}

export async function getFreeSlots() {
  return db
    .select()
    .from(slots)
    .where(and(eq(slots.status, "free"), eq(slots.active, true)))
    .orderBy(slots.position);
}

export async function getAllActiveSlots() {
  return db
    .select()
    .from(slots)
    .where(eq(slots.active, true))
    .orderBy(slots.position);
}
