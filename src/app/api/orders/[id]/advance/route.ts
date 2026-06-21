import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-guards";
import { getOrderById, advanceOrderStatus } from "@/lib/services/orders";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  // Solo exige sesión autenticada: avanzar órdenes por el workflow
  // (received→in_progress→ready→delivered) es trabajo legítimo del worker,
  // por eso no se aplica gate de rol.
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const orderId = Number(id);
  if (isNaN(orderId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  if (order.status === "delivered") {
    return NextResponse.json({ error: "La orden ya fue entregada" }, { status: 400 });
  }

  try {
    const updated = await advanceOrderStatus(
      orderId,
      order.status as "received" | "in_progress" | "ready"
    );
    return NextResponse.json({ order: updated });
  } catch (err) {
    console.error("[POST /api/orders/[id]/advance]", err);
    return NextResponse.json({ error: "Error al avanzar la orden" }, { status: 500 });
  }
}
