import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const vehicleTypes = sqliteTable("vehicle_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  icon: text("icon"),
  active: integer("active", { mode: "boolean" }).default(true),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "owner", "worker"] }).notNull(),
  // % de comisión del trabajador sobre el servicio de lavado (0-100). Editable;
  // se congela (snapshot) en cada orden al crearla.
  commissionPercent: integer("commission_percent").notNull().default(0),
  active: integer("active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const vehicles = sqliteTable("vehicles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  plate: text("plate").notNull().unique(),
  vehicleTypeId: integer("vehicle_type_id").references(() => vehicleTypes.id),
  ownerName: text("owner_name"),
  ownerPhone: text("owner_phone"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  vehicleTypeId: integer("vehicle_type_id").references(() => vehicleTypes.id),
  price: integer("price").notNull(),
  estimatedMinutes: integer("estimated_minutes"),
  position: integer("position"),
  active: integer("active", { mode: "boolean" }).default(true),
});

export const parkingRates = sqliteTable(
  "parking_rates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    vehicleTypeId: integer("vehicle_type_id")
      .notNull()
      .references(() => vehicleTypes.id),
    rateType: text("rate_type", { enum: ["hour", "day"] }).notNull(),
    amount: integer("amount").notNull(),
  },
  (t) => [
    // Una sola tarifa por (tipo de vehículo, hora/día) — requerido por el
    // onConflictDoUpdate de upsertParkingRate.
    uniqueIndex("parking_rates_type_unique").on(t.vehicleTypeId, t.rateType),
  ]
);

export const slots = sqliteTable("slots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  kind: text("kind", { enum: ["parking", "wash", "monthly"] }).notNull(),
  status: text("status", { enum: ["free", "occupied", "in_progress"] })
    .notNull()
    .default("free"),
  position: integer("position"),
  active: integer("active", { mode: "boolean" }).default(true),
});

export const shifts = sqliteTable("shifts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  openedAt: integer("opened_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  openingCash: integer("opening_cash").notNull(),
  closedAt: integer("closed_at", { mode: "timestamp" }),
  closingCash: integer("closing_cash"),
  notes: text("notes"),
});

export const serviceOrders = sqliteTable("service_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id),
  slotId: integer("slot_id").references(() => slots.id),
  employeeId: integer("employee_id").references(() => users.id),
  shiftId: integer("shift_id").references(() => shifts.id),
  // Modalidad del ingreso: "wash" (lavado, con servicios) o "parking" (parqueo,
  // cobrado por tiempo a la salida).
  kind: text("kind", { enum: ["wash", "parking"] }).notNull().default("wash"),
  // Solo para parqueo: si se cobra por hora o tarifa plana de día.
  parkingRateType: text("parking_rate_type", { enum: ["hour", "day"] }),
  // Solo para parqueo: snapshot de la tarifa (por hora o por día) al ingresar.
  parkingRate: integer("parking_rate"),
  status: text("status", {
    enum: ["received", "in_progress", "ready", "delivered"],
  })
    .notNull()
    .default("received"),
  total: integer("total").notNull(),
  // Snapshot del % de comisión del empleado al crear la orden (lavado).
  commissionPercent: integer("commission_percent").notNull().default(0),
  // Marca de liquidación: cuándo se le pagó esta orden al trabajador.
  liquidatedAt: integer("liquidated_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  startedAt: integer("started_at", { mode: "timestamp" }),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => serviceOrders.id),
  serviceId: integer("service_id")
    .notNull()
    .references(() => services.id),
  priceSnapshot: integer("price_snapshot").notNull(),
  qty: integer("qty").notNull().default(1),
});

export const monthlyPlans = sqliteTable("monthly_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  amount: integer("amount").notNull(),
  status: text("status", { enum: ["active", "expired", "cancelled"] })
    .notNull()
    .default("active"),
  notes: text("notes"),
});

export const businessConfig = sqliteTable("business_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export type VehicleType = typeof vehicleTypes.$inferSelect;
export type User = typeof users.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Service = typeof services.$inferSelect;
export type ParkingRate = typeof parkingRates.$inferSelect;
export type Slot = typeof slots.$inferSelect;
export type Shift = typeof shifts.$inferSelect;
export type ServiceOrder = typeof serviceOrders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type MonthlyPlan = typeof monthlyPlans.$inferSelect;
export type BusinessConfig = typeof businessConfig.$inferSelect;
