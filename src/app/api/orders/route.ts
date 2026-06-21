import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOrder } from "@/lib/services/orders";
import { z } from "zod";

const schema = z
  .object({
    plate: z.string().min(3).max(12),
    vehicleTypeId: z.number().int().positive(),
    serviceIds: z.array(z.number().int().positive()).default([]),
    slotId: z.number().int().positive().nullable().optional(),
    ownerName: z.string().max(120).nullable().optional(),
    ownerPhone: z.string().max(30).nullable().optional(),
    employeeId: z.number().int().positive().nullable().optional(),
    kind: z.enum(["wash", "parking"]).default("wash"),
    parkingRateType: z.enum(["hour", "day"]).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "parking") {
      // El parqueo exige elegir cómo se cobra (hora o día) y no lleva servicios.
      if (!data.parkingRateType) {
        ctx.addIssue({ code: "custom", message: "Falta el tipo de tarifa del parqueo", path: ["parkingRateType"] });
      }
    } else if (data.serviceIds.length < 1) {
      // El lavado exige al menos un servicio.
      ctx.addIssue({ code: "custom", message: "Selecciona al menos un servicio", path: ["serviceIds"] });
    }
  });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 422 });
  }

  const userId = Number((session.user as { id?: string | number }).id ?? NaN);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }

  try {
    const order = await createOrder({
      ...parsed.data,
      userId,
      employeeId: parsed.data.employeeId ?? null,
      parkingRateType: parsed.data.parkingRateType ?? null,
    });
    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json({ error: "Error al crear la orden" }, { status: 500 });
  }
}
