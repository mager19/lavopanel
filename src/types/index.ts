export type UserRole = "admin" | "owner" | "worker";
export type SlotKind = "parking" | "wash";
export type SlotStatus = "free" | "occupied" | "in_progress";
export type OrderStatus = "received" | "in_progress" | "ready" | "delivered";
export type PlanStatus = "active" | "expired" | "cancelled";
export type RateType = "hour" | "day";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Recibido",
  in_progress: "En lavado",
  ready: "Listo",
  delivered: "Entregado",
};

export const ORDER_STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  received: "in_progress",
  in_progress: "ready",
  ready: "delivered",
};

export const SLOT_KIND_LABELS: Record<SlotKind, string> = {
  parking: "Parqueo",
  wash: "Lavado",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  owner: "Dueño",
  worker: "Trabajador",
};

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
