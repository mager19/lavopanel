import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOrder } from "@/lib/services/orders";
import { z } from "zod";

const schema = z.object({
  plate: z.string().min(3).max(12),
  vehicleTypeId: z.number().int().positive(),
  serviceIds: z.array(z.number().int().positive()).min(1),
  slotId: z.number().int().positive().nullable().optional(),
  ownerName: z.string().max(120).nullable().optional(),
  ownerPhone: z.string().max(30).nullable().optional(),
  employeeId: z.number().int().positive().nullable().optional(),
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
    });
    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json({ error: "Error al crear la orden" }, { status: 500 });
  }
}
