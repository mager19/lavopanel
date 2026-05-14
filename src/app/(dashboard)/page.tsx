import { auth } from "@/lib/auth";
import Link from "next/link";
import { FloorPlan } from "@/components/slots/FloorPlan";
import { getTodayKPIs } from "@/lib/services/orders";
import { getSlots } from "@/lib/services/slots";

function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(0)}k`;
  return `$${amount.toLocaleString("es-CO")}`;
}

function getDateLabel(): string {
  const d = new Date();
  const week  = ["dom","lun","mar","mié","jue","vie","sáb"];
  const month = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${week[d.getDay()]} ${d.getDate()} · ${month[d.getMonth()]}`;
}

async function getInitialSlots() {
  try {
    const data = await getSlots();
    return {
      slots: data.map((s) => ({
        id:       s.id,
        label:    s.label,
        kind:     s.kind   as "parking" | "wash",
        status:   s.status as "free" | "occupied" | "in_progress" | "ready",
        position: s.position,
      })),
    };
  } catch {
    return undefined;
  }
}

export default async function DashboardPage() {
  const [session, kpis, initialSlots] = await Promise.all([
    auth(),
    getTodayKPIs(),
    getInitialSlots(),
  ]);

  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div className="flex flex-col min-h-full">

      {/* ── DARK CONTROL BAND ──────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "#100E0C" }}
      >
        {/* Ambient orange glow — top right */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #F97316 0%, transparent 70%)" }}
        />
        {/* Subtle dot grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative px-4 pt-6 pb-5 md:px-6">

          {/* Top bar: brand + date */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-0.5 rounded-full bg-primary" />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-space-mono)" }}
              >
                Lavadero la 55
              </span>
            </div>
            <span
              className="text-[10px]"
              style={{ color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-space-mono)" }}
            >
              {getDateLabel()}
            </span>
          </div>

          {/* Greeting */}
          <h1
            className="text-[28px] font-extrabold leading-none tracking-tight"
            style={{ color: "#ffffff" }}
          >
            Hola, {firstName} 👋
          </h1>

          {/* Turno CTA */}
          <Link
            href="/turnos"
            className="mt-1.5 mb-5 inline-flex items-center gap-1.5 group"
          >
            <span
              className="text-xs"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              Sin turno activo
            </span>
            <span className="text-xs font-semibold text-primary transition-opacity group-hover:opacity-80">
              → Abrir turno
            </span>
          </Link>

          {/* KPI cards — glass morphism */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: kpis.todayCount,               color: "#ffffff",  label: "Autos hoy" },
              { value: kpis.readyCount,               color: "#2dd4bf",  label: "Listos"    },
              { value: formatRevenue(kpis.todayRevenue), color: "#F97316", label: "Ingresos" },
            ].map(({ value, color, label }) => (
              <div
                key={label}
                className="rounded-2xl px-3 py-3"
                style={{
                  background: "rgba(255,255,255,0.055)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="text-[26px] font-extrabold tabular-nums leading-none"
                  style={{ color }}
                >
                  {value}
                </div>
                <div
                  className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-space-mono)" }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom shadow bleed into workspace */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-6"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.08))" }}
        />
      </div>

      {/* ── LIGHT WORKSPACE ────────────────────────────────────────── */}
      <div className="flex-1 bg-background px-4 py-5 space-y-4 md:px-6">
        <div className="flex items-center justify-between">
          <h2
            className="text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            Planta del local
          </h2>
          <span
            className="text-[10px]"
            style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-space-mono)" }}
          >
            ↻ en vivo
          </span>
        </div>
        <FloorPlan initialData={initialSlots} />
      </div>

    </div>
  );
}
