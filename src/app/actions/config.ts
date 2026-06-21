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
import { z } from "zod";

// ── Schemas de validación ──────────────────────────────────────
// Lanzan un Error con mensaje claro en español cuando los datos no son válidos.

const roleSchema = z.enum(["admin", "owner", "worker"]);

const createSlotSchema = z.object({
  label: z.string().trim().min(1, "El nombre es obligatorio").max(40, "El nombre no puede superar los 40 caracteres"),
  kind: z.enum(["parking", "wash"]),
});

const toggleSchema = z.object({
  id: z.number().int().positive("ID inválido"),
  active: z.boolean(),
});

const updateParkingRateSchema = z.object({
  vehicleTypeId: z.number().int().positive("Tipo de vehículo inválido"),
  rateType: z.enum(["hour", "day"]),
  amount: z.number().int().min(0, "El monto no puede ser negativo"),
});

const createServiceSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  vehicleTypeId: z.number().int().positive("Tipo de vehículo inválido"),
  price: z.number().int().min(0, "El precio no puede ser negativo"),
  estimatedMinutes: z.number().int().positive("Los minutos estimados deben ser positivos").optional(),
});

const createEmployeeSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z.email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: roleSchema,
});

const updateEmployeeRoleSchema = z.object({
  id: z.number().int().positive("ID inválido"),
  role: roleSchema,
});

const businessConfigSchema = z.record(
  z.string().min(1, "La clave no puede estar vacía"),
  z.string()
);

// Valida con un schema y, si falla, lanza un Error con el primer mensaje claro.
function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  return parsed.data;
}

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
  const { label, kind } = validate(createSlotSchema, {
    label: formData.get("label"),
    kind: formData.get("kind"),
  });
  await createSlot({ label, kind });
  revalidatePath("/configuracion");
}

export async function toggleSlotAction(id: number, active: boolean) {
  await requireAdmin();
  validate(toggleSchema, { id, active });
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
  const v = validate(updateParkingRateSchema, { vehicleTypeId, rateType, amount });
  await upsertParkingRate(v.vehicleTypeId, v.rateType, v.amount);
  revalidatePath("/configuracion");
}

// ── Services ───────────────────────────────────────────────────

export async function createServiceAction(formData: FormData) {
  await requireAdmin();
  const rawEstimated = formData.get("estimatedMinutes");
  const { name, vehicleTypeId, price, estimatedMinutes } = validate(createServiceSchema, {
    name: formData.get("name"),
    vehicleTypeId: Number(formData.get("vehicleTypeId")),
    price: Number(formData.get("price")),
    estimatedMinutes: rawEstimated ? Number(rawEstimated) : undefined,
  });
  await createService({ name, vehicleTypeId, price, estimatedMinutes });
  revalidatePath("/configuracion");
}

export async function toggleServiceAction(id: number, active: boolean) {
  await requireAdmin();
  validate(toggleSchema, { id, active });
  await updateService(id, { active });
  revalidatePath("/configuracion");
}

// ── Employees ─────────────────────────────────────────────────

export async function createEmployeeAction(formData: FormData) {
  const session = await requireAdmin();
  const rawEmail = formData.get("email");
  const { name, email, password, role } = validate(createEmployeeSchema, {
    name: formData.get("name"),
    email: typeof rawEmail === "string" ? rawEmail.toLowerCase().trim() : rawEmail,
    password: formData.get("password"),
    role: (formData.get("role") as string) || "worker",
  });

  assertCanAssignRole(session.user.role as string, role);

  const passwordHash = await hash(password, 12);
  await db.insert(users).values({ name, email, passwordHash, role });
  revalidatePath("/configuracion");
}

export async function toggleEmployeeAction(id: number, active: boolean) {
  await requireAdmin();
  validate(toggleSchema, { id, active });
  await db.update(users).set({ active }).where(eq(users.id, id));
  revalidatePath("/configuracion");
}

export async function updateEmployeeRoleAction(id: number, role: "admin" | "owner" | "worker") {
  const session = await requireAdmin();
  const v = validate(updateEmployeeRoleSchema, { id, role });
  assertCanAssignRole(session.user.role as string, v.role);
  await db.update(users).set({ role: v.role }).where(eq(users.id, v.id));
  revalidatePath("/configuracion");
}

// ── Business Config ────────────────────────────────────────────

export async function saveBusinessConfigAction(formData: FormData) {
  await requireAdmin();
  const raw: Record<string, FormDataEntryValue | null> = {
    business_name: formData.get("business_name"),
    open_time: formData.get("open_time"),
    close_time: formData.get("close_time"),
    city: formData.get("city"),
  };
  // Solo conservamos los campos efectivamente enviados (no null/undefined).
  const present = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== null && v !== undefined)
  );
  const fields = validate(businessConfigSchema, present);
  await Promise.all(
    Object.entries(fields).map(([k, v]) => setBusinessConfig(k, v))
  );
  revalidatePath("/configuracion");
}
