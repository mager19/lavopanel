import { NextResponse } from "next/server";
import { cancelPlan } from "@/lib/services/monthly-plans";
import { requireRole } from "@/lib/auth-guards";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  const guard = await requireRole(["admin", "owner"]);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const planId = Number(id);
  if (isNaN(planId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const plan = await cancelPlan(planId);
  if (!plan) {
    return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ plan });
}
