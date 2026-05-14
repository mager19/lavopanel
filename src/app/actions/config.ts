"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createSlot, updateSlot } from "@/lib/services/slots";
import { upsertParkingRate } from "@/lib/services/config";
import { createService, updateService } from "@/lib/services/services-catalog";
import { setBusinessConfig } from "@/lib/services/config";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  const role = session.user.role as string;
  if (role !== "admin" && role !== "owner") {
    throw new Error("Sin acceso");
  }
  return session;
}

// ── Slots ──────────────────────────────────────────────────────

export async function createSlotAction(formData: FormData) {
  await requireAdmin();
  const label = formData.get("label") as string;
  const kind = formData.get("kind") as "parking" | "wash";
  await createSlot({ label, kind });
  revalidatePath("/configuracion");
}

export async function toggleSlotAction(id: number, active: boolean) {
  await requireAdmin();
  await updateSlot(id, { active });
  revalidatePath("/configuracion");
}

// ── Parking Rates ──────────────────────────────────────────────

export async function updateParkingRateAction(
  vehicleTypeId: number,
  rateType: "hour" | "day",
  amount: number
) {
  await requireAdmin();
  await upsertParkingRate(vehicleTypeId, rateType, amount);
  revalidatePath("/configuracion");
}

// ── Services ───────────────────────────────────────────────────

export async function createServiceAction(formData: FormData) {
  await requireAdmin();
  const name = formData.get("name") as string;
  const vehicleTypeId = Number(formData.get("vehicleTypeId"));
  const price = Number(formData.get("price"));
  const estimatedMinutes = formData.get("estimatedMinutes")
    ? Number(formData.get("estimatedMinutes"))
    : undefined;
  await createService({ name, vehicleTypeId, price, estimatedMinutes });
  revalidatePath("/configuracion");
}

export async function toggleServiceAction(id: number, active: boolean) {
  await requireAdmin();
  await updateService(id, { active });
  revalidatePath("/configuracion");
}

// ── Business Config ────────────────────────────────────────────

export async function saveBusinessConfigAction(formData: FormData) {
  await requireAdmin();
  const fields: Record<string, string> = {
    business_name: formData.get("business_name") as string,
    open_time: formData.get("open_time") as string,
    close_time: formData.get("close_time") as string,
    city: formData.get("city") as string,
  };
  await Promise.all(
    Object.entries(fields)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => setBusinessConfig(k, v))
  );
  revalidatePath("/configuracion");
}
