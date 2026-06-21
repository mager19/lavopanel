"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ShiftSummary {
  orderCount: number;
  revenue: number;
}

interface OpenShift {
  id: number;
  code: string;
  openedAt: Date | null;
  openingCash: number;
}

interface Props {
  openShift: OpenShift | null;
  summary: ShiftSummary | null;
  canClose: boolean;
  openedBy?: string | null;
}

function formatPrice(cents: number) {
  return `$${cents.toLocaleString("es-CO")}`;
}

function formatDuration(from: Date | null) {
  if (!from) return "—";
  const mins = Math.floor((Date.now() - new Date(from).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

function formatTime(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

export function ShiftActions({ openShift, summary, canClose, openedBy }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Open shift state
  const [openingCash, setOpeningCash] = useState("");

  // Close shift state
  const [closingCash, setClosingCash] = useState("");
  const [notes, setNotes] = useState("");
  const [showClose, setShowClose] = useState(false);

  const handleOpen = async () => {
    const cash = parseInt(openingCash.replace(/\D/g, "") || "0");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/shifts/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingCash: cash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al abrir turno");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    const cash = parseInt(closingCash.replace(/\D/g, "") || "0");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/shifts/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closingCash: cash, notes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cerrar turno");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  if (openShift) {
    const diff =
      closingCash
        ? parseInt(closingCash.replace(/\D/g, "") || "0") - openShift.openingCash
        : null;

    return (
      <div className="space-y-4">
        {/* Active shift card */}
        <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#22c55e" }}
            />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Turno en curso</p>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  style={{ fontFamily: "var(--font-space-mono)" }}
                >
                  {openShift.code}
                </span>
              </div>
              {openedBy && (
                <p className="text-[11px] text-muted-foreground">Abierto por {openedBy}</p>
              )}
            </div>
            <span className="ml-auto text-xs text-muted-foreground font-mono">
              {formatDuration(openShift.openedAt)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Apertura</p>
              <p className="text-sm font-bold" style={{ fontFamily: "var(--font-space-mono)" }}>
                {formatTime(openShift.openedAt)}
              </p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Órdenes</p>
              <p className="text-sm font-bold" style={{ fontFamily: "var(--font-space-mono)" }}>
                {summary?.orderCount ?? 0}
              </p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Ingresos</p>
              <p className="text-sm font-bold" style={{ color: "var(--color-primary)", fontFamily: "var(--font-space-mono)" }}>
                {formatPrice(summary?.revenue ?? 0)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-muted-foreground">Caja inicial</span>
            <span className="font-bold" style={{ fontFamily: "var(--font-space-mono)" }}>
              {formatPrice(openShift.openingCash)}
            </span>
          </div>

          {!canClose ? (
            <p className="text-xs text-muted-foreground text-center py-1">
              Solo el dueño o un administrador puede cerrar el turno.
            </p>
          ) : !showClose ? (
            <button
              onClick={() => setShowClose(true)}
              className="w-full h-12 rounded-xl text-sm font-bold border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              style={{
                borderColor: "#ef4444",
                color: "#ef4444",
                background: "transparent",
              }}
            >
              Cerrar turno
            </button>
          ) : (
            <div className="space-y-3 border-t border-border/40 pt-4">
              <p className="text-sm font-semibold text-foreground">Cerrar turno</p>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Caja final</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="$0"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ fontFamily: "var(--font-space-mono)" }}
                />
              </div>

              {closingCash && diff !== null && (
                <div
                  className="flex items-center justify-between text-sm px-3 py-2 rounded-xl"
                  style={{
                    background: diff >= 0 ? "#dcfce7" : "#fee2e2",
                    color: diff >= 0 ? "#15803d" : "#dc2626",
                  }}
                >
                  <span>Diferencia</span>
                  <span className="font-bold" style={{ fontFamily: "var(--font-space-mono)" }}>
                    {diff >= 0 ? "+" : ""}{formatPrice(diff)}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Notas (opcional)</label>
                <textarea
                  placeholder="Observaciones del turno..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive font-medium">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowClose(false); setError(""); }}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold border border-border text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClose}
                  disabled={loading || !closingCash}
                  aria-busy={loading}
                  className="flex-1 h-11 rounded-xl text-sm font-bold text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                  style={{
                    background: loading || !closingCash ? "var(--color-muted)" : "#ef4444",
                    color: loading || !closingCash ? "var(--color-muted-foreground)" : "white",
                  }}
                >
                  {loading ? "Cerrando..." : "Confirmar cierre"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }

  // No open shift — show open form
  return (
    <div className="space-y-4">
      <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
        <p className="text-sm font-semibold text-foreground mb-1">Abrir turno</p>
        <p className="text-xs text-muted-foreground mb-4">
          Ingresa el monto de caja inicial para comenzar el turno.
        </p>

        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1 block">Caja inicial</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="$50.000"
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-background px-4 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
            style={{ fontFamily: "var(--font-space-mono)" }}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive font-medium mb-3">{error}</p>
        )}

        <button
          onClick={handleOpen}
          disabled={loading}
          aria-busy={loading}
          className="w-full h-12 rounded-xl text-sm font-bold text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          style={{
            background: loading ? "var(--color-muted)" : "#22c55e",
            color: loading ? "var(--color-muted-foreground)" : "white",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Abriendo..." : "Abrir turno"}
        </button>
      </section>
    </div>
  );
}
