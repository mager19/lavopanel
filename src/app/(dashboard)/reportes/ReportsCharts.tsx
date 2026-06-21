"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import type { ReportData } from "@/lib/services/reports";

// Brand accent. Recharts passes `fill`/`color` straight into SVG attributes and
// does not reliably resolve CSS `var(--…)` in all chart primitives, so we keep
// the hex here and centralize it in a single const instead of scattering it.
const BRAND = "#F97316";
const COLORS = [BRAND, "#3b82f6", "#14b8a6", "#8b5cf6", "#ec4899", "#f59e0b"];

function formatCOP(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toLocaleString("es-CO")}`;
}

function formatDate(d: string) {
  const [, m, day] = d.split("-");
  const months = ["", "ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${parseInt(day)} ${months[parseInt(m)]}`;
}

interface Props {
  data: ReportData;
}

export function ReportsCharts({ data }: Props) {
  const { byDay, byHour, byService, byEmployee } = data;

  const dayData = byDay.map((d) => ({
    date: formatDate(d.date),
    Ingresos: d.revenue,
    Órdenes: d.orders,
  }));

  const hourData = byHour.map((h) => ({
    hour: h.hour,
    Ingresos: h.revenue,
    Órdenes: h.orders,
  }));

  return (
    <div className="space-y-6">
      {/* Revenue by day */}
      {dayData.length > 0 ? (
        <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-4"
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            Ingresos por día
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dayData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCOP(v)} />
              <Tooltip
                formatter={(value) => formatCOP(Number(value))}
                labelStyle={{ fontWeight: "bold" }}
              />
              <Bar dataKey="Ingresos" fill={BRAND} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      ) : (
        <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
          <p className="text-sm text-muted-foreground text-center py-8">
            Sin datos de ingresos para el período seleccionado.
          </p>
        </section>
      )}

      {/* Revenue by hour — para detectar descuadres por franja */}
      {hourData.length > 0 && (
        <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1"
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            Ingresos por franja horaria
          </p>
          <p className="text-[11px] text-muted-foreground mb-4">
            Hora local. Útil para revisar qué pasó en una franja con descuadre.
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={42} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCOP(v)} />
              <Tooltip
                formatter={(value, name) =>
                  name === "Ingresos" ? formatCOP(Number(value)) : `${Number(value)} órd.`
                }
                labelStyle={{ fontWeight: "bold" }}
              />
              <Bar dataKey="Ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Service breakdown */}
        {byService.length > 0 && (
          <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-4"
              style={{ fontFamily: "var(--font-space-mono)" }}
            >
              Por servicio
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={byService}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                  labelLine={false}
                >
                  {byService.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${Number(v)} órdenes`} />
              </PieChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* Employee breakdown */}
        {byEmployee.length > 0 && (
          <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3"
              style={{ fontFamily: "var(--font-space-mono)" }}
            >
              Por empleado
            </p>
            <div className="space-y-2">
              {byEmployee.map((emp, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-sm py-2 border-b border-border/30 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.orders} orden{emp.orders !== 1 ? "es" : ""}</p>
                  </div>
                  <span
                    className="font-extrabold shrink-0"
                    style={{ fontFamily: "var(--font-space-mono)", color: BRAND }}
                  >
                    {formatCOP(emp.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
