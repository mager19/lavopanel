import { db } from "@/lib/db/client";
import { shifts, serviceOrders, users } from "@/lib/db/schema";
import { eq, isNull, isNotNull, desc, and, gte, sql } from "drizzle-orm";

export async function getOpenShift(userId: number) {
  const [shift] = await db
    .select({
      id: shifts.id,
      openedAt: shifts.openedAt,
      openingCash: shifts.openingCash,
      user: { id: users.id, name: users.name },
    })
    .from(shifts)
    .leftJoin(users, eq(shifts.userId, users.id))
    .where(and(eq(shifts.userId, userId), isNull(shifts.closedAt)))
    .limit(1);
  return shift ?? null;
}

export async function openShift(userId: number, openingCash: number) {
  const [shift] = await db
    .insert(shifts)
    .values({ userId, openingCash })
    .returning();
  return shift;
}

export async function closeShift(
  shiftId: number,
  closingCash: number,
  notes?: string
) {
  const [shift] = await db
    .update(shifts)
    .set({ closedAt: new Date(), closingCash, notes: notes ?? null })
    .where(and(eq(shifts.id, shiftId), isNull(shifts.closedAt)))
    .returning();
  return shift ?? null;
}

export async function getShiftSummary(shiftId: number) {
  const [row] = await db
    .select({
      orderCount: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${serviceOrders.total}), 0)`,
    })
    .from(serviceOrders)
    .where(eq(serviceOrders.shiftId, shiftId));
  return {
    orderCount: Number(row?.orderCount ?? 0),
    revenue: Number(row?.revenue ?? 0),
  };
}

export async function getShiftHistory(limit = 20) {
  const rows = await db
    .select({
      id: shifts.id,
      openedAt: shifts.openedAt,
      closedAt: shifts.closedAt,
      openingCash: shifts.openingCash,
      closingCash: shifts.closingCash,
      notes: shifts.notes,
      user: { id: users.id, name: users.name },
    })
    .from(shifts)
    .leftJoin(users, eq(shifts.userId, users.id))
    .where(isNotNull(shifts.closedAt))
    .orderBy(desc(shifts.openedAt))
    .limit(limit);
  return rows;
}

export async function getAnyOpenShift() {
  const [shift] = await db
    .select({
      id: shifts.id,
      openedAt: shifts.openedAt,
      openingCash: shifts.openingCash,
      user: { id: users.id, name: users.name },
    })
    .from(shifts)
    .leftJoin(users, eq(shifts.userId, users.id))
    .where(isNull(shifts.closedAt))
    .limit(1);
  return shift ?? null;
}
