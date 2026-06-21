import { NextResponse } from "next/server";
import { getTodayKPIs } from "@/lib/services/orders";
import { requireSession } from "@/lib/auth-guards";

export async function GET() {
  const guard = await requireSession();
  if (!guard.ok) return guard.response;

  try {
    const kpis = await getTodayKPIs();
    return NextResponse.json(kpis);
  } catch (error) {
    console.error("[GET /api/dashboard]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
