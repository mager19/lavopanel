import { NextResponse } from "next/server";
import { getTodayKPIs } from "@/lib/services/orders";

export async function GET() {
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
