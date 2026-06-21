import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAnyOpenShift, openShift } from "@/lib/services/shifts";
import { z } from "zod";

const schema = z.object({
  openingCash: z.number().int().min(0),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userId = Number((session.user as { id?: string | number }).id ?? NaN);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }

  // Caja única: no se puede abrir si ya hay un turno abierto (de cualquiera).
  const existing = await getAnyOpenShift();
  if (existing) {
    return NextResponse.json(
      { error: "Ya hay un turno abierto" },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const shift = await openShift(userId, parsed.data.openingCash);
  return NextResponse.json({ shift }, { status: 201 });
}
