"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  id: number;
  startDate: string;
  endDate: string;
  amount: number;
  status: string;
  notes: string | null;
  vehicle: { id: number; plate: string; ownerName: string | null; ownerPhone: string | null } | null;
  vehicleType: { name: string } | null;
}

interface Props {
  plans: Plan[];
  expiringSoon: { id: number; endDate: string; vehicle: { plate: string } | null; vehicleType: { name: string } | null }[];
}

function formatPrice(cents: number) {
  return `$${cents.toLocaleString("es-CO")}`;
}

function formatDate(s: string) {
  const [y, m, d] = s.split("-");
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

function daysLeft(endDate: string) {
  const end = new Date(endDate + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / 86400000);
}

export function PlanList({ plans, expiringSoon }: Props) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState<number | null>(null);

  const handleCancel = async (id: number) => {
    if (!confirm("¿Cancelar este plan mensual?")) return;
    setCancelling(id);
    try {
      await fetch(`/api/monthly-plans/${id}/cancel`, { method: "POST" });
      router.refresh();
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Expiring soon alert */}
      {expiringSoon.length > 0 && (
        <div
          className="rounded-2xl border p-4 space-y-2"
          style={{ background: "#fff7ed", borderColor: "#fed7aa" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#c2410c" }}>
            ⚠️ {expiringSoon.length} plan{expiringSoon.length !== 1 ? "es" : ""} por vencer
          </p>
          {expiringSoon.map((p) => {
            const days = daysLeft(p.endDate);
            return (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="font-bold" style={{ fontFamily: "var(--font-space-mono)", color: "#9a3412" }}>
                  {p.vehicle?.plate ?? "—"}
                </span>
                <span style={{ color: "#c2410c" }}>
                  {days <= 0 ? "Vence hoy" : `${days} día${days !== 1 ? "s" : ""}`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan list */}
      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <span className="text-4xl">📅</span>
          <p className="text-sm text-muted-foreground text-center">
            No hay planes mensuales activos.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => {
            const days = daysLeft(plan.endDate);
            const isExpiringSoon = days <= 7;
            return (
              <div
                key={plan.id}
                className="bg-card rounded-2xl border border-border/50 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xl font-extrabold tracking-widest"
                        style={{ fontFamily: "var(--font-space-mono)" }}
                      >
                        {plan.vehicle?.plate ?? "—"}
                      </span>
                      {plan.vehicleType && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {plan.vehicleType.name}
                        </span>
                      )}
                    </div>
                    {plan.vehicle?.ownerName && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {plan.vehicle.ownerName}
                        {plan.vehicle.ownerPhone ? ` · ${plan.vehicle.ownerPhone}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className="text-base font-extrabold"
                      style={{ fontFamily: "var(--font-space-mono)", color: "var(--color-primary)" }}
                    >
                      {formatPrice(plan.amount)}
                    </p>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: isExpiringSoon ? "#dc2626" : "#16a34a" }}
                    >
                      {days <= 0 ? "Vence hoy" : days === 1 ? "1 día" : `${days} días`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(plan.startDate)} → {formatDate(plan.endDate)}
                  </span>
                  <button
                    onClick={() => handleCancel(plan.id)}
                    disabled={cancelling === plan.id}
                    className="text-xs font-semibold text-destructive hover:opacity-70 transition-opacity"
                  >
                    {cancelling === plan.id ? "Cancelando..." : "Cancelar plan"}
                  </button>
                </div>

                {plan.notes && (
                  <p className="text-xs text-muted-foreground mt-2 italic">{plan.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
