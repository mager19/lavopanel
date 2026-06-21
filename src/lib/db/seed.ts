import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { hash } from "bcryptjs";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

async function seed() {
  console.log("🌱 Iniciando seed — Lavadero la 55...\n");

  // ── Tipos de vehículo ──────────────────────────────────────────────────────
  const [carro, moto] = await db
    .insert(schema.vehicleTypes)
    .values([
      { name: "Carro", icon: "Car" },
      { name: "Moto", icon: "Bike" },
    ])
    .returning();

  console.log("✓ Tipos de vehículo creados");

  // ── Slots — 4 parqueo + 2 lavado ──────────────────────────────────────────
  await db.insert(schema.slots).values([
    { label: "P-01", kind: "parking", position: 1 },
    { label: "P-02", kind: "parking", position: 2 },
    { label: "P-03", kind: "parking", position: 3 },
    { label: "P-04", kind: "parking", position: 4 },
    { label: "L-01", kind: "wash", position: 5 },
    { label: "L-02", kind: "wash", position: 6 },
  ]);

  console.log("✓ Slots creados (P-01..P-04, L-01..L-02)");

  // ── Tarifas de parqueo ─────────────────────────────────────────────────────
  await db.insert(schema.parkingRates).values([
    { vehicleTypeId: carro.id, rateType: "hour", amount: 3000 },
    { vehicleTypeId: carro.id, rateType: "day", amount: 15000 },
    { vehicleTypeId: moto.id, rateType: "hour", amount: 2000 },
    { vehicleTypeId: moto.id, rateType: "day", amount: 10000 },
  ]);

  console.log("✓ Tarifas de parqueo creadas");

  // ── Servicios de lavado ────────────────────────────────────────────────────
  await db.insert(schema.services).values([
    // Carro
    { name: "Lavado sencillo",   vehicleTypeId: carro.id, price: 15000, estimatedMinutes: 20, position: 1 },
    { name: "Lavado completo",   vehicleTypeId: carro.id, price: 25000, estimatedMinutes: 40, position: 2 },
    { name: "Lavado de motor",   vehicleTypeId: carro.id, price: 35000, estimatedMinutes: 30, position: 3 },
    { name: "Cojinería",         vehicleTypeId: carro.id, price: 45000, estimatedMinutes: 60, position: 4 },
    { name: "Lavado + Motor",    vehicleTypeId: carro.id, price: 45000, estimatedMinutes: 60, position: 5 },
    // Moto
    { name: "Lavado sencillo",   vehicleTypeId: moto.id,  price: 10000, estimatedMinutes: 15, position: 1 },
    { name: "Lavado completo",   vehicleTypeId: moto.id,  price: 18000, estimatedMinutes: 25, position: 2 },
    { name: "Lavado de motor",   vehicleTypeId: moto.id,  price: 20000, estimatedMinutes: 20, position: 3 },
  ]);

  console.log("✓ Servicios creados (5 para carro, 3 para moto)");

  // ── Configuración del negocio ──────────────────────────────────────────────
  await db.insert(schema.businessConfig).values([
    { key: "business_name", value: "Lavadero la 55" },
    { key: "open_time",     value: "07:00" },
    { key: "close_time",    value: "18:00" },
    { key: "city",          value: "Colombia" },
  ]);

  console.log("✓ Configuración del negocio guardada");

  // ── Usuarios ───────────────────────────────────────────────────────────────
  const adminHash  = await hash("admin123",  12);
  const ownerHash  = await hash("owner123",  12);
  const workerHash = await hash("worker123", 12);

  await db.insert(schema.users).values([
    {
      name: "Administrador",
      email: "admin@lavadero55.com",
      passwordHash: adminHash,
      role: "admin",
    },
    {
      name: "Dueño",
      email: "dueno@lavadero55.com",
      passwordHash: ownerHash,
      role: "owner",
    },
    {
      name: "Juan Operario",
      email: "juan@lavadero55.com",
      passwordHash: workerHash,
      role: "worker",
    },
  ]);

  console.log("✓ Usuarios creados");
  console.log("\n── Credenciales de acceso ──────────────────────");
  console.log("  Admin   → admin@lavadero55.com   / admin123");
  console.log("  Dueño   → dueno@lavadero55.com   / owner123");
  console.log("  Operario→ juan@lavadero55.com    / worker123");
  console.log("────────────────────────────────────────────────");
  console.log("\n✅ Seed completado — Lavadero la 55 listo para usar\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
