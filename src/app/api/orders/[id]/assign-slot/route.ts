import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-guards";
import { assignSlotToOrder } from "@/lib/services/orders";
import { z } from "zod";

const schema = z.object({ slotId: z.number().int().positive() });

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Params) {
  // Asignar un espacio es trabajo operativo: requiere sesión.
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 422 });
  }

  try {
    await assignSlotToOrder(orderId, parsed.data.slotId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al asignar el espacio";
    console.error("[POST /api/orders/[id]/assign-slot]", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
