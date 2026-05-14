import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cancelPlan } from "@/lib/services/monthly-plans";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

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
