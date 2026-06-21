import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAnyOpenShift, closeShift, getShiftSummary } from "@/lib/services/shifts";
import { z } from "zod";

const schema = z.object({
  closingCash: z.number().int().min(0),
  notes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Cerrar el turno (caja) es responsabilidad de dueño o administrador.
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "owner") {
    return NextResponse.json(
      { error: "Solo el dueño o un administrador puede cerrar el turno" },
      { status: 403 }
    );
  }

  const openShift = await getAnyOpenShift();
  if (!openShift) {
    return NextResponse.json(
      { error: "No hay un turno abierto" },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const summary = await getShiftSummary(openShift.id);
  const closed = await closeShift(
    openShift.id,
    parsed.data.closingCash,
    parsed.data.notes
  );

  return NextResponse.json({ shift: closed, summary });
}
