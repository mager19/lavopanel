import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-guards";
import { exitParkingOrder } from "@/lib/services/orders";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  // Registrar la salida de un parqueo es trabajo operativo: requiere sesión.
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const order = await exitParkingOrder(orderId);
    return NextResponse.json({ order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al registrar la salida";
    console.error("[POST /api/orders/[id]/exit]", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
