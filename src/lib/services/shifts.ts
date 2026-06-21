import { db } from "@/lib/db/client";
import { shifts, serviceOrders, users } from "@/lib/db/schema";
import { eq, isNull, isNotNull, desc, and, sql } from "drizzle-orm";

// Código legible del turno: fecha local (Colombia, -5h) + "-N", donde N es el
// número de turno de ese día (1, 2, ...). Se calcula con una subconsulta que
// cuenta los turnos del mismo día abiertos hasta este inclusive.
const shiftCode = sql<string>`
  date(${shifts.openedAt}, 'unixepoch', '-5 hours') || '-' || (
    select count(*) from shifts s2
    where date(s2.opened_at, 'unixepoch', '-5 hours')
        = date(${shifts.openedAt}, 'unixepoch', '-5 hours')
      and s2.opened_at <= ${shifts.openedAt}
  )
`;

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
      code: shiftCode,
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
      code: shiftCode,
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
