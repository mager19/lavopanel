import { db } from "@/lib/db/client";
import {
  vehicleTypes,
  parkingRates,
  businessConfig,
  users,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

// ── Vehicle Types ──────────────────────────────────────────────

export async function getVehicleTypes() {
  return db
    .select()
    .from(vehicleTypes)
    .where(eq(vehicleTypes.active, true));
}

export async function createVehicleType(data: { name: string; icon?: string }) {
  const [created] = await db
    .insert(vehicleTypes)
    .values({ name: data.name, icon: data.icon ?? null })
    .returning();
  return created;
}

export async function updateVehicleType(
  id: number,
  data: { name?: string; icon?: string; active?: boolean }
) {
  const [updated] = await db
    .update(vehicleTypes)
    .set(data)
    .where(eq(vehicleTypes.id, id))
    .returning();
  return updated;
}

// ── Parking Rates ──────────────────────────────────────────────

export async function getParkingRates() {
  return db
    .select({
      id: parkingRates.id,
      vehicleTypeId: parkingRates.vehicleTypeId,
      rateType: parkingRates.rateType,
      amount: parkingRates.amount,
      vehicleTypeName: vehicleTypes.name,
      vehicleTypeIcon: vehicleTypes.icon,
    })
    .from(parkingRates)
    .leftJoin(vehicleTypes, eq(parkingRates.vehicleTypeId, vehicleTypes.id));
}

export async function upsertParkingRate(
  vehicleTypeId: number,
  rateType: "hour" | "day",
  amount: number
) {
  const [result] = await db
    .insert(parkingRates)
    .values({ vehicleTypeId, rateType, amount })
    .onConflictDoUpdate({
      target: [parkingRates.vehicleTypeId, parkingRates.rateType],
      set: { amount },
    })
    .returning();
  return result;
}

// ── Business Config ────────────────────────────────────────────

export async function getBusinessConfig(): Promise<
  Record<string, string>
> {
  const rows = await db.select().from(businessConfig);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getEmployees() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      commissionPercent: users.commissionPercent,
      active: users.active,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.createdAt));
}

export async function setBusinessConfig(key: string, value: string) {
  const [result] = await db
    .insert(businessConfig)
    .values({ key, value })
    .onConflictDoUpdate({
      target: businessConfig.key,
      set: { value },
    })
    .returning();
  return result;
}
