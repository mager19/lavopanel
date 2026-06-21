import { auth } from "@/lib/auth";
import Link from "next/link";
import { FloorPlan } from "@/components/slots/FloorPlan";
import { WaitingQueue } from "@/components/slots/WaitingQueue";
import { getTodayKPIs, getWaitingOrders } from "@/lib/services/orders";
import { getSlots } from "@/lib/services/slots";
import { getAnyOpenShift } from "@/lib/services/shifts";
import type { SlotDisplayStatus, SlotKind } from "@/types";
import { Car, CheckCheck, Banknote, Clock, ChevronRight, Zap } from "lucide-react";
import { LogoutButton } from "@/components/layout/LogoutButton";

function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(0)}k`;
  return `$${amount.toLocaleString("es-CO")}`;
}

function getDateLabel(): string {
  const d = new Date();
  const week  = ["dom","lun","mar","mié","jue","vie","sáb"];
  const month = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${week[d.getDay()]} ${d.getDate()} ${month[d.getMonth()]}`;
}

async function getSlotsData() {
  try {
    const data = await getSlots();
    return {
      slots: data.map((s) => ({
        id:       s.id,
        label:    s.label,
        // El estado de la DB (3 valores) es un subconjunto válido del estado
        // de display, por eso widena sin necesidad de castear.
        kind:     s.kind satisfies SlotKind,
        status:   s.status satisfies SlotDisplayStatus,
        position: s.position,
      })),
      freeSlots: data
        .filter((s) => s.status === "free")
        .map((s) => ({ id: s.id, label: s.label, kind: s.kind })),
    };
  } catch {
    return { slots: [], freeSlots: [] };
  }
}

export default async function DashboardPage() {
  const [session, kpis, slotsData, waiting] = await Promise.all([
    auth(),
    getTodayKPIs(),
    getSlotsData(),
    getWaitingOrders().catch(() => []),
  ]);

  const initialSlots = { slots: slotsData.slots };
  const freeSlots = slotsData.freeSlots;

  const openShift = await getAnyOpenShift();
  const firstName = session?.user?.name?.split(" ")[0];

  const kpiCards = [
    {
      icon: Car,
      iconBg: "#fff7ed",
      iconColor: "var(--color-primary)",
      value: kpis.todayCount.toString(),
      valueColor: "#111827",
      label: "Autos hoy",
    },
    {
      icon: CheckCheck,
      iconBg: "#f0fdf4",
      iconColor: "#16a34a",
      value: kpis.readyCount.toString(),
      valueColor: "#16a34a",
      label: "Listos",
    },
    {
      icon: Banknote,
      iconBg: "#fff7ed",
      iconColor: "var(--color-primary)",
      value: formatRevenue(kpis.todayRevenue),
      valueColor: "var(--color-primary)",
      label: "Ingresos",
    },
  ];

  return (
    <div className="flex flex-col min-h-full bg-background">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border/40 px-4 pt-5 pb-4 md:px-6">

        {/* Brand row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--color-primary)" }}
            >
              <Zap className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            </div>
            <span
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground"
              style={{ fontFamily: "var(--font-space-mono)" }}
            >
              Lavadero la 55
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="text-[11px] text-muted-foreground"
              style={{ fontFamily: "var(--font-space-mono)" }}
            >
              {getDateLabel()}
            </span>
            {/* Logout accesible en móvil (en desktop está en el sidebar) */}
            <span className="md:hidden">
              <LogoutButton variant="icon" />
            </span>
          </div>
        </div>

        {/* Greeting */}
        <h1 className="mt-4 text-[26px] font-extrabold tracking-tight text-foreground leading-none">
          Hola, {firstName}
        </h1>

        {/* Turno pill */}
        <Link
          href="/turnos"
          className="mt-2 inline-flex items-center gap-2 rounded-full py-1.5 px-3 transition-opacity hover:opacity-80"
          style={{
            background: openShift ? "#f0fdf4" : "#f5f5f5",
            border: `1px solid ${openShift ? "#bbf7d0" : "#e5e7eb"}`,
          }}
        >
          <Clock
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: openShift ? "#16a34a" : "#9ca3af" }}
            aria-hidden="true"
          />
          {openShift ? (
            <>
              <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>
                Turno activo
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                style={{ background: "#16a34a" }}
                aria-hidden="true"
              />
            </>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">
              Sin turno activo · abrir
            </span>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" aria-hidden="true" />
        </Link>
      </div>

      {/* ── KPI STRIP ───────────────────────────────────────────────── */}
      <section aria-label="Resumen del día" className="px-4 pt-4 pb-1 md:px-6">
        <div className="grid grid-cols-3 gap-2.5">
          {kpiCards.map(({ icon: Icon, iconBg, iconColor, value, valueColor, label }) => (
            <div
              key={label}
              className="bg-card rounded-2xl p-3.5 shadow-sm"
              style={{ border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                style={{ background: iconBg }}
              >
                <Icon className="w-4 h-4" style={{ color: iconColor }} aria-hidden="true" />
              </div>
              <div
                className="text-[22px] font-extrabold leading-none tabular-nums"
                style={{ color: valueColor, fontFamily: "var(--font-space-mono)" }}
              >
                {value}
              </div>
              <div
                className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FLOOR PLAN ──────────────────────────────────────────────── */}
      <section aria-labelledby="floor-plan-heading" className="flex-1 px-4 py-4 space-y-3 md:px-6">
        <div className="flex items-center justify-between">
          <h2
            id="floor-plan-heading"
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground"
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            Planta del local
          </h2>
          <span
            className="text-[10px] text-muted-foreground flex items-center gap-1"
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#22c55e" }}
              aria-hidden="true"
            />
            en vivo
          </span>
        </div>
        <WaitingQueue orders={waiting} freeSlots={freeSlots} />
        <FloorPlan initialData={initialSlots} />
      </section>

    </div>
  );
}
