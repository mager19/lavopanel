import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { serviceOrders, orderItems, services, users, vehicles, vehicleTypes } from "@/lib/db/schema";
import { and, gte, lte, eq } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role ?? "";
  if (!["admin", "owner"].includes(role)) {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "Se requieren fechas" }, { status: 400 });
  }

  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T23:59:59");

  const orders = await db
    .select({
      id: serviceOrders.id,
      status: serviceOrders.status,
      total: serviceOrders.total,
      createdAt: serviceOrders.createdAt,
      plate: vehicles.plate,
      vehicleType: vehicleTypes.name,
      employee: users.name,
    })
    .from(serviceOrders)
    .leftJoin(vehicles, eq(serviceOrders.vehicleId, vehicles.id))
    .leftJoin(vehicleTypes, eq(vehicles.vehicleTypeId, vehicleTypes.id))
    .leftJoin(users, eq(serviceOrders.employeeId, users.id))
    .where(
      and(
        gte(serviceOrders.createdAt, fromDate),
        lte(serviceOrders.createdAt, toDate)
      )
    )
    .orderBy(serviceOrders.createdAt);

  const header = ["ID", "Placa", "Tipo vehículo", "Estado", "Total", "Empleado", "Fecha"].join(",");
  const rows = orders.map((o) => {
    const fecha = o.createdAt ? new Date(o.createdAt).toLocaleString("es-CO") : "";
    return [
      o.id,
      o.plate ?? "",
      o.vehicleType ?? "",
      o.status,
      o.total,
      o.employee ?? "",
      `"${fecha}"`,
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reporte_${from}_${to}.csv"`,
    },
  });
}
