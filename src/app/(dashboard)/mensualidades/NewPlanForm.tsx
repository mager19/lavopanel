"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface VehicleType {
  id: number;
  name: string;
}

interface Props {
  vehicleTypes: VehicleType[];
  onCancel: () => void;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export function NewPlanForm({ vehicleTypes, onCancel }: Props) {
  const router = useRouter();
  const today = todayStr();

  const [plate, setPlate] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState(vehicleTypes[0]?.id ?? 0);
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, 30));
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(amount.replace(/\D/g, "") || "0");
    if (!plate.trim() || !vehicleTypeId || !startDate || !endDate) {
      setError("Completa los campos requeridos");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/monthly-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate: plate.toUpperCase().trim(),
          vehicleTypeId,
          ownerName: ownerName || null,
          ownerPhone: ownerPhone || null,
          startDate,
          endDate,
          amount: amt,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al crear mensualidad");
      router.refresh();
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card rounded-2xl border border-border/50 shadow-sm p-4 space-y-4"
    >
      <p className="text-sm font-semibold text-foreground">Nueva mensualidad</p>

      {/* Plate + type */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Placa *</label>
          <input
            type="text"
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="ABC123"
            required
            maxLength={12}
            className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
            style={{ fontFamily: "var(--font-space-mono)", letterSpacing: "0.1em" }}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tipo *</label>
          <select
            value={vehicleTypeId}
            onChange={(e) => setVehicleTypeId(Number(e.target.value))}
            className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {vehicleTypes.map((vt) => (
              <option key={vt.id} value={vt.id}>{vt.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dates + amount */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Inicio *</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Fin *</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            required
            className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Valor *</label>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="$150.000"
            className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
            style={{ fontFamily: "var(--font-space-mono)" }}
          />
        </div>
      </div>

      {/* Owner info (optional) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Nombre dueño</label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="Carlos Pérez"
            className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Teléfono</label>
          <input
            type="tel"
            value={ownerPhone}
            onChange={(e) => setOwnerPhone(e.target.value)}
            placeholder="3001234567"
            className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Notas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones..."
          rows={2}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
      </div>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-11 rounded-xl text-sm font-semibold border border-border text-muted-foreground"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !plate || !vehicleTypeId}
          className="flex-1 h-11 rounded-xl text-sm font-bold text-white transition-all"
          style={{
            background: loading || !plate ? "var(--color-muted)" : "var(--color-primary)",
            color: loading || !plate ? "var(--color-muted-foreground)" : "white",
          }}
        >
          {loading ? "Guardando..." : "Registrar plan"}
        </button>
      </div>
    </form>
  );
}
