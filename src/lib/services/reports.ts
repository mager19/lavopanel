import { db } from "@/lib/db/client";
import { serviceOrders, orderItems, services, users } from "@/lib/db/schema";
import { and, gte, lte, eq, sql } from "drizzle-orm";

export interface ReportData {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    deliveredOrders: number;
    avgRevenue: number;
  };
  byDay: { date: string; orders: number; revenue: number }[];
  byHour: { hour: string; orders: number; revenue: number }[];
  byService: { name: string; count: number; revenue: number }[];
  byEmployee: { name: string; orders: number; revenue: number }[];
}

// Colombia (America/Bogota) es UTC-5 sin horario de verano. Ajustamos las
// fechas almacenadas en UTC para que la franja horaria sea la hora local.
const TZ_OFFSET = "-5 hours";

export async function getReportData(from: Date, to: Date): Promise<ReportData> {
  // from/to ya vienen como instantes exactos (el caller arma el rango con la
  // franja horaria elegida y el huso de Colombia). Se usan tal cual.
  const fromDate = from;
  const toDate = to;

  const [summary, byDay, byHour, byService, byEmployee] = await Promise.all([
    getSummary(fromDate, toDate),
    getByDay(fromDate, toDate),
    getByHour(fromDate, toDate),
    getByService(fromDate, toDate),
    getByEmployee(fromDate, toDate),
  ]);

  return { summary, byDay, byHour, byService, byEmployee };
}

// Consolidado por FRANJA HORARIA (hora local de Colombia). Útil para detectar
// descuadres: ver en qué franja se concentraron órdenes/ingresos.
async function getByHour(from: Date, to: Date) {
  const rows = await db
    .select({
      hour: sql<string>`strftime('%H', ${serviceOrders.createdAt}, 'unixepoch', ${TZ_OFFSET})`,
      orders: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${serviceOrders.total}), 0)`,
    })
    .from(serviceOrders)
    .where(and(gte(serviceOrders.createdAt, from), lte(serviceOrders.createdAt, to)))
    .groupBy(sql`strftime('%H', ${serviceOrders.createdAt}, 'unixepoch', ${TZ_OFFSET})`)
    .orderBy(sql`strftime('%H', ${serviceOrders.createdAt}, 'unixepoch', ${TZ_OFFSET})`);

  return rows.map((r) => ({
    hour: `${r.hour}:00`,
    orders: Number(r.orders),
    revenue: Number(r.revenue),
  }));
}

async function getSummary(from: Date, to: Date) {
  const [row] = await db
    .select({
      totalOrders: sql<number>`count(*)`,
      totalRevenue: sql<number>`coalesce(sum(${serviceOrders.total}), 0)`,
      deliveredOrders: sql<number>`sum(case when ${serviceOrders.status} = 'delivered' then 1 else 0 end)`,
    })
    .from(serviceOrders)
    .where(
      and(
        gte(serviceOrders.createdAt, from),
        lte(serviceOrders.createdAt, to)
      )
    );

  const totalOrders = Number(row?.totalOrders ?? 0);
  const totalRevenue = Number(row?.totalRevenue ?? 0);
  const deliveredOrders = Number(row?.deliveredOrders ?? 0);

  return {
    totalOrders,
    totalRevenue,
    deliveredOrders,
    avgRevenue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
  };
}

async function getByDay(from: Date, to: Date) {
  const rows = await db
    .select({
      date: sql<string>`date(${serviceOrders.createdAt}, 'unixepoch')`,
      orders: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${serviceOrders.total}), 0)`,
    })
    .from(serviceOrders)
    .where(
      and(
        gte(serviceOrders.createdAt, from),
        lte(serviceOrders.createdAt, to)
      )
    )
    .groupBy(sql`date(${serviceOrders.createdAt}, 'unixepoch')`)
    .orderBy(sql`date(${serviceOrders.createdAt}, 'unixepoch')`);

  return rows.map((r) => ({
    date: r.date,
    orders: Number(r.orders),
    revenue: Number(r.revenue),
  }));
}

async function getByService(from: Date, to: Date) {
  const rows = await db
    .select({
      name: services.name,
      count: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${orderItems.priceSnapshot}), 0)`,
    })
    .from(orderItems)
    .leftJoin(services, eq(orderItems.serviceId, services.id))
    .leftJoin(serviceOrders, eq(orderItems.orderId, serviceOrders.id))
    .where(
      and(
        gte(serviceOrders.createdAt, from),
        lte(serviceOrders.createdAt, to)
      )
    )
    .groupBy(services.id, services.name)
    .orderBy(sql`count(*) desc`);

  return rows.map((r) => ({
    name: r.name ?? "Desconocido",
    count: Number(r.count),
    revenue: Number(r.revenue),
  }));
}

async function getByEmployee(from: Date, to: Date) {
  const rows = await db
    .select({
      name: users.name,
      orders: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${serviceOrders.total}), 0)`,
    })
    .from(serviceOrders)
    .leftJoin(users, eq(serviceOrders.employeeId, users.id))
    .where(
      and(
        gte(serviceOrders.createdAt, from),
        lte(serviceOrders.createdAt, to)
      )
    )
    .groupBy(users.id, users.name)
    .orderBy(sql`count(*) desc`);

  return rows.map((r) => ({
    name: r.name ?? "Sin asignar",
    orders: Number(r.orders),
    revenue: Number(r.revenue),
  }));
}
