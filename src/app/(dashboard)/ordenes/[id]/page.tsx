import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getOrderById } from "@/lib/services/orders";
import { AdvanceButton } from "./AdvanceButton";
import { ChevronLeft } from "lucide-react";

const STATUS_STEPS = ["received", "in_progress", "ready", "delivered"] as const;

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  received:    { label: "Recibido",   color: "#f59e0b", icon: "📥" },
  in_progress: { label: "En lavado",  color: "#3b82f6", icon: "🫧" },
  ready:       { label: "Listo",      color: "#14b8a6", icon: "✅" },
  delivered:   { label: "Entregado",  color: "#22c55e", icon: "🎉" },
};

function formatPrice(cents: number) {
  return `$${cents.toLocaleString("es-CO")}`;
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(d));
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const orderId = Number(id);
  if (isNaN(orderId)) notFound();

  const order = await getOrderById(orderId);
  if (!order) notFound();

  const meta = STATUS_META[order.status] ?? STATUS_META.received;
  const currentStep = STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]);
  const isDelivered = order.status === "delivered";

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-card border-b border-border/40 px-4 pt-5 pb-4 md:px-6">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/ordenes"
            className="flex items-center justify-center w-8 h-8 rounded-xl border border-border/60 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Volver a órdenes"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </Link>
          <span
            className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider"
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            Orden #{order.id}
          </span>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <h1
              className="text-[30px] font-extrabold leading-none tracking-widest text-foreground"
              style={{ fontFamily: "var(--font-space-mono)" }}
            >
              {order.vehicle?.plate ?? "—"}
            </h1>
            <p className="text-sm mt-1 text-muted-foreground">
              {order.vehicleType?.name} · {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-[26px] font-extrabold leading-none"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--color-primary)" }}
            >
              {formatPrice(order.total)}
            </p>
            <div
              className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                background: `${meta.color}18`,
                color: meta.color,
                border: `1px solid ${meta.color}30`,
              }}
            >
              <span aria-hidden="true">{meta.icon}</span> {meta.label}
            </div>
          </div>
        </div>
      </div>

      {/* ── Contenido ───────────────────────────────────────── */}
      <div className="flex-1 bg-background px-4 py-5 space-y-4 md:px-6">

        {/* Estado actual + stepper */}
        <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl" aria-hidden="true">{meta.icon}</span>
            <div>
              <h2 className="font-semibold text-foreground">{meta.label}</h2>
              <p className="text-xs text-muted-foreground">Estado actual</p>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1">
            {STATUS_STEPS.map((step, idx) => {
              const done = idx <= currentStep;
              const stepMeta = STATUS_META[step];
              return (
                <div key={step} className="flex items-center gap-1 flex-1 min-w-0">
                  <div
                    className="flex flex-col items-center gap-1 flex-1 min-w-0"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                      style={{
                        background: done ? stepMeta.color : "var(--color-muted)",
                        color: done ? "#fff" : "var(--color-muted-foreground)",
                      }}
                    >
                      {idx < currentStep ? "✓" : idx + 1}
                    </div>
                    <span className="text-[9px] text-center text-muted-foreground leading-tight truncate w-full text-center">
                      {stepMeta.label}
                    </span>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className="h-0.5 flex-1 mb-4"
                      style={{
                        background: idx < currentStep ? meta.color : "var(--color-border)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Servicios */}
        <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
          <h2
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3"
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            Servicios
          </h2>
          <ul className="flex flex-col divide-y divide-border/40 list-none">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between items-center py-2.5">
                <span className="text-sm font-medium text-foreground">
                  {item.service?.name ?? "Servicio"}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ fontFamily: "var(--font-space-mono)", color: "var(--color-primary)" }}
                >
                  {formatPrice(item.priceSnapshot)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-center pt-3 mt-1 border-t border-border/60">
            <span className="text-sm font-bold text-foreground">Total</span>
            <span
              className="text-xl font-extrabold"
              style={{ fontFamily: "var(--font-space-mono)", color: "var(--color-primary)" }}
            >
              {formatPrice(order.total)}
            </span>
          </div>
        </section>

        {/* Info */}
        <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
          <h2
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3"
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            Detalles
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            {[
              ["Empleado",    order.employee?.name ?? "—"],
              ["Tipo",        order.vehicleType?.name ?? "—"],
              ["Recibido",    formatDate(order.createdAt)],
              ["Inicio lav.", formatDate(order.startedAt)],
              ["Listo",       formatDate(order.finishedAt)],
              ["Entregado",   formatDate(order.deliveredAt)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="font-medium text-foreground mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Acción */}
        {!isDelivered && (
          <AdvanceButton
            orderId={order.id}
            currentStatus={order.status as "received" | "in_progress" | "ready"}
          />
        )}

        {isDelivered && (
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="text-3xl" aria-hidden="true">🎉</span>
            <p className="text-sm text-muted-foreground font-medium">Orden completada y entregada</p>
            <Link
              href="/ordenes"
              className="text-sm font-semibold text-primary"
            >
              Ver todas las órdenes →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
