import { db, type DbOrTx } from "@/lib/db/client";
import { vehicles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getVehicleByPlate(plate: string, executor: DbOrTx = db) {
  return executor
    .select()
    .from(vehicles)
    .where(eq(vehicles.plate, plate.toUpperCase()))
    .get();
}

export async function upsertVehicle(
  {
    plate,
    vehicleTypeId,
    ownerName,
    ownerPhone,
  }: {
    plate: string;
    vehicleTypeId: number;
    ownerName?: string;
    ownerPhone?: string;
  },
  executor: DbOrTx = db
) {
  const upper = plate.toUpperCase();
  const existing = await getVehicleByPlate(upper, executor);

  if (existing) {
    await executor
      .update(vehicles)
      .set({
        vehicleTypeId,
        ownerName: ownerName || existing.ownerName,
        ownerPhone: ownerPhone || existing.ownerPhone,
      })
      .where(eq(vehicles.id, existing.id));
    return { ...existing, vehicleTypeId };
  }

  const [created] = await executor
    .insert(vehicles)
    .values({ plate: upper, vehicleTypeId, ownerName, ownerPhone })
    .returning();
  return created;
}
