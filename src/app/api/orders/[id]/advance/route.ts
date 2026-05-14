import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrderById, advanceOrderStatus } from "@/lib/services/orders";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

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

  const isAdmin = ["admin", "owner"].includes(
    (session.user as { role?: string }).role ?? ""
  );

  try {
    const updated = await advanceOrderStatus(
      orderId,
      order.status as "received" | "in_progress" | "ready",
      isAdmin
    );
    return NextResponse.json({ order: updated });
  } catch (err) {
    console.error("[POST /api/orders/[id]/advance]", err);
    return NextResponse.json({ error: "Error al avanzar la orden" }, { status: 500 });
  }
}
