import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOpenShift, getShiftSummary } from "@/lib/services/shifts";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userId = Number((session.user as { id?: string | number }).id ?? NaN);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }

  const shift = await getOpenShift(userId);
  if (!shift) {
    return NextResponse.json({ shift: null, summary: null });
  }

  const summary = await getShiftSummary(shift.id);
  return NextResponse.json({ shift, summary });
}
