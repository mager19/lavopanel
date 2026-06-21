"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface VehicleType {
  id: number;
  name: string;
  icon: string | null;
}

interface Service {
  id: number;
  name: string;
  price: number;
  estimatedMinutes: number | null;
  vehicleTypeId: number | null;
}

interface SlotOption {
  id: number;
  label: string;
  kind: string;
}

interface Worker {
  id: number;
  name: string;
  role: string;
}

interface IngresoFormProps {
  vehicleTypes: VehicleType[];
  services: Service[];
  freeSlots: SlotOption[];
  workers: Worker[];
  preselectedSlotLabel?: string;
}

function formatPrice(cents: number) {
  return `$${(cents / 1).toLocaleString("es-CO")}`;
}

export function IngresoForm({
  vehicleTypes,
  services,
  freeSlots,
  workers,
  preselectedSlotLabel,
}: IngresoFormProps) {
  const router = useRouter();
  const defaultSlot = freeSlots.find((s) => s.label === preselectedSlotLabel) ?? null;

  const [plate, setPlate] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState<number | null>(null);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [slotId, setSlotId] = useState<number | null>(defaultSlot?.id ?? null);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [showClient, setShowClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredServices = vehicleTypeId
    ? services.filter((s) => s.vehicleTypeId === vehicleTypeId)
    : [];

  const total = selectedServices.reduce((sum, id) => {
    const s = services.find((sv) => sv.id === id);
    return sum + (s?.price ?? 0);
  }, 0);

  const toggleService = (id: number) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleTypeChange = (id: number) => {
    setVehicleTypeId(id);
    setSelectedServices([]);
  };

  const canSubmit =
    plate.trim().length >= 3 &&
    vehicleTypeId !== null &&
    selectedServices.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setError("Completa la placa, tipo de vehículo y al menos un servicio.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plate: plate.trim().toUpperCase(),
          vehicleTypeId,
          serviceIds: selectedServices,
          slotId: slotId ?? null,
          employeeId: employeeId ?? null,
          ownerName: ownerName.trim() || null,
          ownerPhone: ownerPhone.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear la orden");
      router.push(`/ordenes/${data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setLoading(false);
    }
  };

  const selectedSlot = freeSlots.find((s) => s.id === slotId);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-8">

      {/* ── Placa ──────────────────────────────────────────────── */}
      <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
        <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2"
          style={{ fontFamily: "var(--font-space-mono)" }}>
          Placa del vehículo
        </label>
        <input
          type="text"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          placeholder="ABC 123"
          maxLength={10}
          className="w-full text-center text-3xl font-bold tracking-[0.25em] uppercase bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/30"
          style={{ fontFamily: "var(--font-space-mono)" }}
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
        />
        <div className="mt-2 h-px bg-border/60 rounded-full" />
      </section>

      {/* ── Tipo de vehículo ────────────────────────────────── */}
      <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3"
          style={{ fontFamily: "var(--font-space-mono)" }}>
          Tipo
        </p>
        <div className="grid grid-cols-2 gap-2">
          {vehicleTypes.map((vt) => {
            const active = vehicleTypeId === vt.id;
            return (
              <button
                key={vt.id}
                type="button"
                onClick={() => handleTypeChange(vt.id)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: active ? "var(--color-primary)" : "var(--color-muted)",
                  color: active ? "#fff" : "var(--color-muted-foreground)",
                  border: active ? "none" : "1px solid var(--color-border)",
                }}
              >
                <span className="text-xl">{vt.icon ?? (vt.name === "Moto" ? "🏍️" : "🚗")}</span>
                {vt.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Servicios ──────────────────────────────────────── */}
      {vehicleTypeId !== null && (
        <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3"
            style={{ fontFamily: "var(--font-space-mono)" }}>
            Servicios
          </p>
          {filteredServices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin servicios configurados para este tipo
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filteredServices.map((svc) => {
                const active = selectedServices.includes(svc.id);
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => toggleService(svc.id)}
                    className="flex items-center justify-between px-3 py-3 rounded-xl transition-all text-left"
                    style={{
                      background: active ? "rgba(249,115,22,0.08)" : "var(--color-muted)/30",
                      border: active
                        ? "1.5px solid var(--color-primary)"
                        : "1.5px solid transparent",
                      outline: "1px solid var(--color-border)",
                      outlineOffset: active ? "-1px" : "0",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                        style={{
                          background: active ? "var(--color-primary)" : "var(--color-border)",
                        }}
                      >
                        {active && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{svc.name}</p>
                        {svc.estimatedMinutes && (
                          <p className="text-[10px] text-muted-foreground">~{svc.estimatedMinutes} min</p>
                        )}
                      </div>
                    </div>
                    <span
                      className="text-sm font-bold shrink-0"
                      style={{ fontFamily: "var(--font-space-mono)", color: active ? "var(--color-primary)" : "var(--color-muted-foreground)" }}
                    >
                      {formatPrice(svc.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Slot ────────────────────────────────────────────── */}
      <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3"
          style={{ fontFamily: "var(--font-space-mono)" }}>
          Espacio asignado
        </p>
        {freeSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            Sin espacios libres disponibles
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSlotId(null)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: slotId === null ? "var(--color-muted)" : "transparent",
                border: slotId === null ? "1.5px solid var(--color-border)" : "1.5px solid var(--color-border)/40",
                color: "var(--color-muted-foreground)",
              }}
            >
              Sin espacio
            </button>
            {freeSlots.map((s) => {
              const active = slotId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSlotId(s.id)}
                  className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    background: active ? "var(--color-primary)" : "var(--color-muted)",
                    color: active ? "#fff" : "var(--color-muted-foreground)",
                    border: active ? "none" : "1.5px solid var(--color-border)",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
        {selectedSlot && (
          <p className="mt-2 text-xs text-muted-foreground">
            Espacio {selectedSlot.kind === "wash" ? "de lavado" : "de parqueo"} seleccionado
          </p>
        )}
      </section>

      {/* ── Empleado asignado ──────────────────────────────── */}
      {workers.length > 0 && (
        <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3"
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            Empleado asignado
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEmployeeId(null)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: employeeId === null ? "var(--color-muted)" : "transparent",
                border: "1.5px solid var(--color-border)",
                color: "var(--color-muted-foreground)",
              }}
            >
              Sin asignar
            </button>
            {workers.map((w) => {
              const active = employeeId === w.id;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setEmployeeId(w.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: active ? "var(--color-primary)" : "var(--color-muted)",
                    color: active ? "#fff" : "var(--color-foreground)",
                    border: active ? "none" : "1.5px solid var(--color-border)",
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{
                      background: active ? "rgba(255,255,255,0.25)" : "var(--color-border)",
                      color: active ? "#fff" : "var(--color-muted-foreground)",
                    }}
                  >
                    {w.name.charAt(0).toUpperCase()}
                  </span>
                  {w.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Cliente (opcional) ──────────────────────────────── */}
      <section className="bg-card rounded-2xl border border-border/50 shadow-sm">
        <button
          type="button"
          onClick={() => setShowClient(!showClient)}
          className="w-full flex items-center justify-between px-4 py-3.5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground"
            style={{ fontFamily: "var(--font-space-mono)" }}>
            Datos del cliente (opcional)
          </p>
          <span className="text-muted-foreground text-sm">{showClient ? "▲" : "▼"}</span>
        </button>

        {showClient && (
          <div className="px-4 pb-4 flex flex-col gap-3">
            <div className="h-px bg-border/40" />
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Nombre</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Nombre del propietario"
                className="w-full h-11 px-3 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Teléfono</label>
              <input
                type="tel"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="300 000 0000"
                className="w-full h-11 px-3 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Total + Submit ──────────────────────────────────── */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm pt-3 pb-4 -mx-4 px-4 border-t border-border/40">
        {error && (
          <p className="text-sm text-destructive font-medium mb-2 text-center">{error}</p>
        )}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Total</span>
          <span
            className="text-2xl font-extrabold"
            style={{
              fontFamily: "var(--font-space-mono)",
              color: total > 0 ? "var(--color-primary)" : "var(--color-muted-foreground)",
            }}
          >
            {formatPrice(total)}
          </span>
        </div>
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="w-full h-14 rounded-2xl text-base font-bold transition-all"
          style={{
            background: canSubmit ? "var(--color-primary)" : "var(--color-muted)",
            color: canSubmit ? "#fff" : "var(--color-muted-foreground)",
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "Creando orden..." : "Registrar ingreso"}
        </button>
      </div>
    </form>
  );
}
