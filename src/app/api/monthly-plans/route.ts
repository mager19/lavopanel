import { NextResponse } from "next/server";
import { createMonthlyPlan, expireOverduePlans } from "@/lib/services/monthly-plans";
import { upsertVehicle } from "@/lib/services/vehicles";
import { requireRole } from "@/lib/auth-guards";
import { z } from "zod";

const schema = z.object({
  plate: z.string().min(3).max(12),
  vehicleTypeId: z.number().int().positive(),
  ownerName: z.string().max(120).nullable().optional(),
  ownerPhone: z.string().max(30).nullable().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().int().min(0),
  notes: z.string().max(500).nullable().optional(),
});

export async function POST(req: Request) {
  const guard = await requireRole(["admin", "owner"]);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { plate, vehicleTypeId, ownerName, ownerPhone, startDate, endDate, amount, notes } = parsed.data;

  if (endDate <= startDate) {
    return NextResponse.json({ error: "La fecha final debe ser posterior a la inicial" }, { status: 400 });
  }

  await expireOverduePlans();

  const vehicle = await upsertVehicle({
    plate,
    vehicleTypeId,
    ownerName: ownerName ?? undefined,
    ownerPhone: ownerPhone ?? undefined,
  });
  const plan = await createMonthlyPlan({
    vehicleId: vehicle.id,
    startDate,
    endDate,
    amount,
    notes: notes ?? undefined,
  });

  return NextResponse.json({ plan }, { status: 201 });
}
