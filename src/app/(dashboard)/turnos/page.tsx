import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAnyOpenShift, getShiftSummary, getShiftHistory } from "@/lib/services/shifts";
import { ShiftActions } from "./ShiftActions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Clock } from "lucide-react";

function formatPrice(cents: number) {
  return `$${cents.toLocaleString("es-CO")}`;
}

function formatDateTime(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

function formatDuration(from: Date | null | undefined, to: Date | null | undefined) {
  if (!from || !to) return "—";
  const mins = Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export default async function TurnosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = (session.user as { role?: string }).role;
  const canClose = role === "admin" || role === "owner";

  const [openShift, history] = await Promise.all([
    getAnyOpenShift(),
    getShiftHistory(15),
  ]);

  const summary = openShift ? await getShiftSummary(openShift.id) : null;

  const historySummaries = await Promise.all(
    history.map((s) => getShiftSummary(s.id))
  );

  return (
    <div className="flex flex-col min-h-full">

      <PageHeader
        title="Turno"
        subtitle={openShift ? "Turno activo en curso" : "Sin turno activo"}
        icon={Clock}
        iconColor="#16a34a"
        iconBg="#f0fdf4"
      />

      {/* Content */}
      <div className="flex-1 bg-background px-4 py-5 space-y-5 md:px-6">

        {/* Open/close actions */}
        <ShiftActions
          openShift={openShift}
          summary={summary}
          canClose={canClose}
          openedBy={openShift?.user?.name ?? null}
        />

        {/* History */}
        {history.length > 0 && (
          <section aria-labelledby="shift-history-heading">
            <h2
              id="shift-history-heading"
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3"
              style={{ fontFamily: "var(--font-space-mono)" }}
            >
              Historial de turnos
            </h2>
            <ul className="space-y-2 list-none">
              {history.map((shift, idx) => {
                const s = historySummaries[idx];
                const diff = (shift.closingCash ?? 0) - shift.openingCash;
                return (
                  <li
                    key={shift.id}
                    className="bg-card rounded-2xl border border-border/50 shadow-sm p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                            style={{ fontFamily: "var(--font-space-mono)" }}
                          >
                            {shift.code}
                          </span>
                          <p className="text-sm font-semibold text-foreground">
                            {shift.user?.name ?? "Usuario"}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateTime(shift.openedAt)} →{" "}
                          {formatDateTime(shift.closedAt)} ·{" "}
                          {formatDuration(shift.openedAt, shift.closedAt)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className="text-base font-extrabold"
                          style={{ fontFamily: "var(--font-space-mono)", color: "var(--color-primary)" }}
                        >
                          {formatPrice(s.revenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.orderCount} órden{s.orderCount !== 1 ? "es" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Caja: {formatPrice(shift.openingCash)} → {formatPrice(shift.closingCash ?? 0)}
                      </span>
                      <span
                        className="font-bold"
                        style={{ color: diff >= 0 ? "#16a34a" : "#dc2626", fontFamily: "var(--font-space-mono)" }}
                      >
                        {diff >= 0 ? "+" : ""}{formatPrice(diff)}
                      </span>
                    </div>

                    {shift.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic border-t border-border/40 pt-2">
                        {shift.notes}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {history.length === 0 && !openShift && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <span className="text-4xl" aria-hidden="true">⏱️</span>
            <p className="text-sm text-muted-foreground text-center">
              No hay turnos registrados aún.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
