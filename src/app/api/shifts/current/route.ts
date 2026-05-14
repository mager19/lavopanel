import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOpenShift, getShiftSummary } from "@/lib/services/shifts";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userId = Number((session.user as { id?: string | number }).id ?? 0);
  if (!userId) {
    return NextResponse.json({ shift: null, summary: null });
  }

  const shift = await getOpenShift(userId);
  if (!shift) {
    return NextResponse.json({ shift: null, summary: null });
  }

  const summary = await getShiftSummary(shift.id);
  return NextResponse.json({ shift, summary });
}
