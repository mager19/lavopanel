import { db } from "@/lib/db/client";
import { services, vehicleTypes } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function getServices(vehicleTypeId?: number) {
  const query = db
    .select()
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.position));

  if (vehicleTypeId !== undefined) {
    return db
      .select()
      .from(services)
      .where(eq(services.vehicleTypeId, vehicleTypeId))
      .orderBy(asc(services.position));
  }

  return query;
}

export async function getAllServices() {
  return db
    .select({
      id: services.id,
      name: services.name,
      vehicleTypeId: services.vehicleTypeId,
      price: services.price,
      estimatedMinutes: services.estimatedMinutes,
      position: services.position,
      active: services.active,
      vehicleTypeName: vehicleTypes.name,
      vehicleTypeIcon: vehicleTypes.icon,
    })
    .from(services)
    .leftJoin(vehicleTypes, eq(services.vehicleTypeId, vehicleTypes.id))
    .orderBy(asc(services.vehicleTypeId), asc(services.position));
}

export async function createService(data: {
  name: string;
  vehicleTypeId: number;
  price: number;
  estimatedMinutes?: number;
  position?: number;
}) {
  const [created] = await db
    .insert(services)
    .values({
      name: data.name,
      vehicleTypeId: data.vehicleTypeId,
      price: data.price,
      estimatedMinutes: data.estimatedMinutes ?? null,
      position: data.position ?? null,
    })
    .returning();
  return created;
}

export async function updateService(
  id: number,
  data: {
    name?: string;
    price?: number;
    estimatedMinutes?: number;
    active?: boolean;
    position?: number;
  }
) {
  const [updated] = await db
    .update(services)
    .set(data)
    .where(eq(services.id, id))
    .returning();
  return updated;
}
