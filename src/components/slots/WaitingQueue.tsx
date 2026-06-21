"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

export interface WaitingOrder {
  id: number;
  kind: "wash" | "parking";
  status: string;
  plate: string | null;
  vehicleType: string | null;
}

export interface FreeSlot {
  id: number;
  label: string;
  kind: "parking" | "wash" | "monthly";
}

function slotsForOrder(order: WaitingOrder, freeSlots: FreeSlot[]) {
  return order.kind === "wash"
    ? freeSlots.filter((s) => s.kind === "wash")
    : freeSlots.filter((s) => s.kind === "parking" || s.kind === "monthly");
}

function QueueRow({ order, freeSlots }: { order: WaitingOrder; freeSlots: FreeSlot[] }) {
  const router = useRouter();
  const options = slotsForOrder(order, freeSlots);
  const [slotId, setSlotId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const assign = async () => {
    if (!slotId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}/assign-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: Number(slotId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo asignar");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setLoading(false);
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-2 py-2.5">
      <span
        className="text-sm font-bold tracking-wider"
        style={{ fontFamily: "var(--font-space-mono)" }}
      >
        {order.plate ?? "—"}
      </span>
      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
        {order.kind === "wash" ? "Lavado" : "Parqueo"}
      </span>
      <span className="text-xs text-muted-foreground">{order.vehicleType}</span>

      <div className="flex items-center gap-2 ml-auto">
        {options.length === 0 ? (
          <span className="text-xs text-amber-600">Sin espacios libres</span>
        ) : (
          <>
            <select
              aria-label={`Espacio para ${order.plate ?? "vehículo"}`}
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Espacio…</option>
              {options.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={assign}
              disabled={!slotId || loading}
              className="h-9 px-3 rounded-lg text-sm font-semibold text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              style={{ background: "var(--color-primary)" }}
            >
              {loading ? "..." : "Asignar"}
            </button>
          </>
        )}
      </div>
      {error && <p role="alert" className="w-full text-[11px] text-destructive">{error}</p>}
    </li>
  );
}

export function WaitingQueue({
  orders,
  freeSlots,
}: {
  orders: WaitingOrder[];
  freeSlots: FreeSlot[];
}) {
  if (orders.length === 0) return null;

  return (
    <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-amber-600" aria-hidden="true" />
        <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground"
          style={{ fontFamily: "var(--font-space-mono)" }}>
          En espera ({orders.length})
        </h2>
      </div>
      <ul className="divide-y divide-border/40 list-none">
        {orders.map((o) => (
          <QueueRow key={o.id} order={o} freeSlots={freeSlots} />
        ))}
      </ul>
    </section>
  );
}
