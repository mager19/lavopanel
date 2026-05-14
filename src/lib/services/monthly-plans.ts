import { db } from "@/lib/db/client";
import { monthlyPlans, vehicles, vehicleTypes } from "@/lib/db/schema";
import { eq, and, lte, gte, sql, desc } from "drizzle-orm";

function today() {
  return new Date().toISOString().split("T")[0];
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export async function getActivePlans() {
  return db
    .select({
      id: monthlyPlans.id,
      startDate: monthlyPlans.startDate,
      endDate: monthlyPlans.endDate,
      amount: monthlyPlans.amount,
      status: monthlyPlans.status,
      notes: monthlyPlans.notes,
      vehicle: {
        id: vehicles.id,
        plate: vehicles.plate,
        ownerName: vehicles.ownerName,
        ownerPhone: vehicles.ownerPhone,
      },
      vehicleType: { name: vehicleTypes.name },
    })
    .from(monthlyPlans)
    .leftJoin(vehicles, eq(monthlyPlans.vehicleId, vehicles.id))
    .leftJoin(vehicleTypes, eq(vehicles.vehicleTypeId, vehicleTypes.id))
    .where(eq(monthlyPlans.status, "active"))
    .orderBy(desc(monthlyPlans.endDate));
}

export async function getExpiringSoon(days = 7) {
  const t = today();
  const limit = daysFromNow(days);
  return db
    .select({
      id: monthlyPlans.id,
      endDate: monthlyPlans.endDate,
      vehicle: { plate: vehicles.plate },
      vehicleType: { name: vehicleTypes.name },
    })
    .from(monthlyPlans)
    .leftJoin(vehicles, eq(monthlyPlans.vehicleId, vehicles.id))
    .leftJoin(vehicleTypes, eq(vehicles.vehicleTypeId, vehicleTypes.id))
    .where(
      and(
        eq(monthlyPlans.status, "active"),
        gte(monthlyPlans.endDate, t),
        lte(monthlyPlans.endDate, limit)
      )
    )
    .orderBy(monthlyPlans.endDate);
}

export async function getActivePlanByPlate(plate: string) {
  const t = today();
  const [row] = await db
    .select({
      id: monthlyPlans.id,
      endDate: monthlyPlans.endDate,
      amount: monthlyPlans.amount,
      vehicle: { id: vehicles.id, plate: vehicles.plate },
    })
    .from(monthlyPlans)
    .leftJoin(vehicles, eq(monthlyPlans.vehicleId, vehicles.id))
    .where(
      and(
        eq(vehicles.plate, plate.toUpperCase()),
        eq(monthlyPlans.status, "active"),
        gte(monthlyPlans.endDate, t)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function createMonthlyPlan(data: {
  vehicleId: number;
  startDate: string;
  endDate: string;
  amount: number;
  notes?: string;
}) {
  const [plan] = await db
    .insert(monthlyPlans)
    .values({
      vehicleId: data.vehicleId,
      startDate: data.startDate,
      endDate: data.endDate,
      amount: data.amount,
      status: "active",
      notes: data.notes ?? null,
    })
    .returning();
  return plan;
}

export async function cancelPlan(id: number) {
  const [plan] = await db
    .update(monthlyPlans)
    .set({ status: "cancelled" })
    .where(eq(monthlyPlans.id, id))
    .returning();
  return plan ?? null;
}

export async function expireOverduePlans() {
  const t = today();
  return db
    .update(monthlyPlans)
    .set({ status: "expired" })
    .where(
      and(
        eq(monthlyPlans.status, "active"),
        sql`${monthlyPlans.endDate} < ${t}`
      )
    );
}
