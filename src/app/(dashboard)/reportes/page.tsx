import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getReportData } from "@/lib/services/reports";
import { ReportsCharts } from "./ReportsCharts";
import { DateFilter } from "./DateFilter";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { BarChart3 } from "lucide-react";

function formatPrice(cents: number) {
  return `$${cents.toLocaleString("es-CO")}`;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

interface Props {
  searchParams: Promise<{ from?: string; to?: string; fromHour?: string; toHour?: string }>;
}

export default async function ReportesPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdminOrOwner = ["admin", "owner"].includes(
    (session.user as { role?: string }).role ?? ""
  );
  if (!isAdminOrOwner) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-muted-foreground">Sin acceso</h1>
          <p className="text-sm text-muted-foreground">Solo administradores y propietarios.</p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const from = params.from ?? daysAgoStr(30);
  const to = params.to ?? todayStr();

  // Franja horaria (hora local de Colombia). Por defecto: todo el día.
  const clampHour = (h: string | undefined, def: number) => {
    const n = Number(h);
    return Number.isInteger(n) && n >= 0 && n <= 23 ? n : def;
  };
  const fromHour = clampHour(params.fromHour, 0);
  const toHour = clampHour(params.toHour, 23);
  const pad = (n: number) => String(n).padStart(2, "0");

  // -05:00 fija el huso de Colombia, así el rango es correcto sin importar el
  // huso del servidor.
  const fromDate = new Date(`${from}T${pad(fromHour)}:00:00-05:00`);
  const toDate = new Date(`${to}T${pad(toHour)}:59:59-05:00`);
  const data = await getReportData(fromDate, toDate);

  const hourLabel =
    fromHour === 0 && toHour === 23 ? "" : ` · ${pad(fromHour)}:00–${pad(toHour)}:59`;

  return (
    <div className="flex flex-col min-h-full">

      <PageHeader
        title="Reportes"
        subtitle={`${from} → ${to}${hourLabel}`}
        icon={BarChart3}
        iconColor="#3b82f6"
        iconBg="#eff6ff"
      />

      {/* Content */}
      <div className="flex-1 bg-background px-4 py-5 space-y-4 md:px-6">

        {/* Date filter */}
        <Suspense>
          <DateFilter from={from} to={to} fromHour={fromHour} toHour={toHour} />
        </Suspense>

        {/* KPI summary */}
        <section aria-label="Resumen de indicadores" className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Órdenes", value: data.summary.totalOrders.toString(), color: "var(--color-foreground)" },
            { label: "Entregadas", value: data.summary.deliveredOrders.toString(), color: "#22c55e" },
            { label: "Ingresos", value: formatPrice(data.summary.totalRevenue), color: "var(--color-primary)" },
            { label: "Promedio", value: formatPrice(data.summary.avgRevenue), color: "#3b82f6" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-card rounded-2xl border border-border/50 shadow-sm p-4"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
              <p
                className="text-xl font-extrabold"
                style={{ fontFamily: "var(--font-space-mono)", color }}
              >
                {value}
              </p>
            </div>
          ))}
        </section>

        {/* Export */}
        <div className="flex justify-end">
          <a
            href={`/api/reports/export?from=${from}&to=${to}`}
            download
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar CSV
          </a>
        </div>

        {/* Charts */}
        <ReportsCharts data={data} />
      </div>
    </div>
  );
}
