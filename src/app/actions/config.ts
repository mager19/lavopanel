"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createSlot, updateSlot } from "@/lib/services/slots";
import { upsertParkingRate } from "@/lib/services/config";
import { createService, updateService } from "@/lib/services/services-catalog";
import { setBusinessConfig } from "@/lib/services/config";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  const role = session.user.role as string;
  if (role !== "admin" && role !== "owner") {
    throw new Error("Sin acceso");
  }
  return session;
}

// Solo un admin puede crear o asignar el rol "admin"; un owner no puede escalar privilegios.
function assertCanAssignRole(actorRole: string, targetRole: string) {
  if (targetRole === "admin" && actorRole !== "admin") {
    throw new Error("Solo un admin puede crear o asignar el rol admin");
  }
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

// ── Employees ─────────────────────────────────────────────────

export async function createEmployeeAction(formData: FormData) {
  const session = await requireAdmin();
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string).toLowerCase().trim();
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "worker";

  if (!name || !email || !password) throw new Error("Datos requeridos");
  if (!["admin", "owner", "worker"].includes(role)) throw new Error("Rol inválido");
  assertCanAssignRole(session.user.role as string, role);

  const passwordHash = await hash(password, 12);
  await db.insert(users).values({ name, email, passwordHash, role: role as "admin" | "owner" | "worker" });
  revalidatePath("/configuracion");
}

export async function toggleEmployeeAction(id: number, active: boolean) {
  await requireAdmin();
  await db.update(users).set({ active }).where(eq(users.id, id));
  revalidatePath("/configuracion");
}

export async function updateEmployeeRoleAction(id: number, role: "admin" | "owner" | "worker") {
  const session = await requireAdmin();
  assertCanAssignRole(session.user.role as string, role);
  await db.update(users).set({ role }).where(eq(users.id, id));
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
