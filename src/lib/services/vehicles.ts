import { db } from "@/lib/db/client";
import { vehicles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getVehicleByPlate(plate: string) {
  return db
    .select()
    .from(vehicles)
    .where(eq(vehicles.plate, plate.toUpperCase()))
    .get();
}

export async function upsertVehicle({
  plate,
  vehicleTypeId,
  ownerName,
  ownerPhone,
}: {
  plate: string;
  vehicleTypeId: number;
  ownerName?: string;
  ownerPhone?: string;
}) {
  const upper = plate.toUpperCase();
  const existing = await getVehicleByPlate(upper);

  if (existing) {
    await db
      .update(vehicles)
      .set({
        vehicleTypeId,
        ownerName: ownerName || existing.ownerName,
        ownerPhone: ownerPhone || existing.ownerPhone,
      })
      .where(eq(vehicles.id, existing.id));
    return { ...existing, vehicleTypeId };
  }

  const [created] = await db
    .insert(vehicles)
    .values({ plate: upper, vehicleTypeId, ownerName, ownerPhone })
    .returning();
  return created;
}
