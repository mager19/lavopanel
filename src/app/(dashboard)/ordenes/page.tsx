import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getActiveOrders } from "@/lib/services/orders";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClipboardList } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  received:    "Recibido",
  in_progress: "En lavado",
  ready:       "Listo",
  delivered:   "Entregado",
};

const STATUS_COLOR: Record<string, string> = {
  received:    "#f59e0b",
  in_progress: "#3b82f6",
  ready:       "#14b8a6",
  delivered:   "#9ca3af",
};

function formatPrice(cents: number) {
  return `$${cents.toLocaleString("es-CO")}`;
}

function timeAgo(date: Date | null | undefined) {
  if (!date) return null;
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export default async function OrdenesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orders = await getActiveOrders();

  return (
    <div className="flex flex-col min-h-full">

      <PageHeader
        title="Órdenes activas"
        subtitle={
          orders.length === 0
            ? "Sin órdenes en este momento"
            : `${orders.length} orden${orders.length !== 1 ? "es" : ""} en curso`
        }
        icon={ClipboardList}
        iconColor="var(--color-primary)"
        iconBg="#fff7ed"
      />

      {/* ── Lista ───────────────────────────────────────────── */}
      <section aria-label="Lista de órdenes activas" className="flex-1 bg-background px-4 py-5 space-y-3 md:px-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-4xl" aria-hidden="true">🚗</span>
            <p className="text-muted-foreground text-sm text-center">
              No hay órdenes activas.{" "}
              <Link href="/ingreso" className="text-primary font-semibold">
                Registrar ingreso →
              </Link>
            </p>
          </div>
        ) : (
          <ul className="space-y-3 list-none">
          {orders.map((order) => {
            const statusColor = STATUS_COLOR[order.status] ?? "#9ca3af";
            const label = STATUS_LABEL[order.status] ?? order.status;
            const elapsed = timeAgo(order.createdAt);

            return (
              <li key={order.id}>
              <Link
                href={`/ordenes/${order.id}`}
                aria-label={`Orden ${order.vehicle?.plate ?? ""}, estado ${label}`}
                className="block bg-card rounded-2xl border border-border/50 shadow-sm p-4 transition-all active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Placa + tipo */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xl font-extrabold tracking-widest"
                        style={{ fontFamily: "var(--font-space-mono)" }}
                      >
                        {order.vehicle?.plate ?? "—"}
                      </span>
                      {order.vehicleType && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {order.vehicleType.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {order.items.map((i) => i.service?.name).filter(Boolean).join(" + ")}
                    </p>
                  </div>

                  {/* Badge estado */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        background: `${statusColor}20`,
                        color: statusColor,
                        border: `1px solid ${statusColor}40`,
                      }}
                    >
                      {label}
                    </span>
                    {elapsed && (
                      <span
                        className="text-[10px] text-muted-foreground"
                        style={{ fontFamily: "var(--font-space-mono)" }}
                      >
                        {elapsed}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                  <span className="text-xs text-muted-foreground">
                    {order.employee ? (
                      <>
                        <span aria-hidden="true">👷</span> {order.employee.name}
                      </>
                    ) : (
                      "Sin empleado"
                    )}
                    {order.slotId ? ` · Espacio ${order.slotId}` : ""}
                  </span>
                  <span
                    className="text-base font-extrabold"
                    style={{ fontFamily: "var(--font-space-mono)", color: "var(--color-primary)" }}
                  >
                    {formatPrice(order.total)}
                  </span>
                </div>
              </Link>
              </li>
            );
          })}
          </ul>
        )}
      </section>

      {/* ── FAB nuevo ingreso ───────────────────────────────── */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-20">
        <Link
          href="/ingreso"
          aria-label="Registrar nuevo ingreso"
          className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform active:scale-95"
          style={{ background: "var(--color-primary)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
