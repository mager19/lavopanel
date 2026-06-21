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

interface ParkingRate {
  vehicleTypeId: number;
  rateType: "hour" | "day";
  amount: number;
}

interface IngresoFormProps {
  vehicleTypes: VehicleType[];
  services: Service[];
  freeSlots: SlotOption[];
  workers: Worker[];
  parkingRates: ParkingRate[];
  preselectedSlotLabel?: string;
}

type Mode = "wash" | "parking";
type RateType = "hour" | "day";

function formatPrice(amount: number) {
  return `$${amount.toLocaleString("es-CO")}`;
}

export function IngresoForm({
  vehicleTypes,
  services,
  freeSlots,
  workers,
  parkingRates,
  preselectedSlotLabel,
}: IngresoFormProps) {
  const router = useRouter();
  const defaultSlot = freeSlots.find((s) => s.label === preselectedSlotLabel) ?? null;

  const [mode, setMode] = useState<Mode>("wash");
  const [plate, setPlate] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState<number | null>(null);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [parkingRateType, setParkingRateType] = useState<RateType>("hour");
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

  // Espacios disponibles según la modalidad: lavado usa bahías; parqueo usa
  // plazas de parqueo o de mensualidad.
  const availableSlots = freeSlots.filter((s) =>
    mode === "wash" ? s.kind === "wash" : s.kind === "parking" || s.kind === "monthly"
  );

  // Tarifa de parqueo vigente para el tipo de vehículo + hora/día seleccionados.
  const parkingRate =
    mode === "parking" && vehicleTypeId !== null
      ? parkingRates.find(
          (r) => r.vehicleTypeId === vehicleTypeId && r.rateType === parkingRateType
        )?.amount ?? 0
      : 0;

  const washTotal = selectedServices.reduce((sum, id) => {
    const s = services.find((sv) => sv.id === id);
    return sum + (s?.price ?? 0);
  }, 0);

  // Monto a mostrar: lavado = suma de servicios; parqueo día = tarifa fija;
  // parqueo hora = tarifa por hora (el total real se calcula a la salida).
  const total = mode === "wash" ? washTotal : parkingRate;

  const toggleService = (id: number) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleTypeChange = (id: number) => {
    setVehicleTypeId(id);
    setSelectedServices([]);
  };

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setSelectedServices([]);
    setSlotId(null);
    if (m === "parking") setEmployeeId(null);
  };

  const canSubmit =
    plate.trim().length >= 3 &&
    vehicleTypeId !== null &&
    (mode === "wash" ? selectedServices.length > 0 : true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setError(
        mode === "wash"
          ? "Completa la placa, tipo de vehículo y al menos un servicio."
          : "Completa la placa y el tipo de vehículo."
      );
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
          kind: mode,
          serviceIds: mode === "wash" ? selectedServices : [],
          parkingRateType: mode === "parking" ? parkingRateType : null,
          slotId: slotId ?? null,
          employeeId: mode === "wash" ? employeeId ?? null : null,
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

  const selectedSlot = availableSlots.find((s) => s.id === slotId);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-8">

      {/* ── Placa ──────────────────────────────────────────────── */}
      <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
        <label htmlFor="ingreso-plate" className="block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2"
          style={{ fontFamily: "var(--font-space-mono)" }}>
          Placa del vehículo
        </label>
        <input
          id="ingreso-plate"
          type="text"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          placeholder="ABC 123"
          maxLength={10}
          className="w-full text-center text-3xl font-bold tracking-[0.25em] uppercase bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-lg"
          style={{ fontFamily: "var(--font-space-mono)" }}
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          aria-describedby={error ? "ingreso-error" : undefined}
        />
        <div className="mt-2 h-px bg-border/60 rounded-full" />
      </section>

      {/* ── Modalidad ──────────────────────────────────────────── */}
      <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
        <p id="ingreso-mode-label" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3"
          style={{ fontFamily: "var(--font-space-mono)" }}>
          Modalidad
        </p>
        <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="ingreso-mode-label">
          {([
            { value: "wash", label: "Lavado", icon: "🧽" },
            { value: "parking", label: "Parqueo", icon: "🅿️" },
          ] as const).map((m) => {
            const active = mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => handleModeChange(m.value)}
                aria-pressed={active}
                className="flex items-center justify-center gap-2 min-h-[44px] py-3 rounded-xl font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                style={{
                  background: active ? "var(--color-primary)" : "var(--color-muted)",
                  color: active ? "#fff" : "var(--color-muted-foreground)",
                  border: active ? "none" : "1px solid var(--color-border)",
                }}
              >
                <span aria-hidden="true" className="text-lg">{m.icon}</span>
                {m.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Tipo de vehículo ────────────────────────────────── */}
      <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
        <p id="ingreso-type-label" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3"
          style={{ fontFamily: "var(--font-space-mono)" }}>
          Tipo
        </p>
        <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="ingreso-type-label">
          {vehicleTypes.map((vt) => {
            const active = vehicleTypeId === vt.id;
            return (
              <button
                key={vt.id}
                type="button"
                onClick={() => handleTypeChange(vt.id)}
                aria-pressed={active}
                className="flex items-center justify-center gap-2 min-h-[44px] py-3 rounded-xl font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
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

      {/* ── Tarifa de parqueo (solo parqueo) ─────────────────── */}
      {mode === "parking" && vehicleTypeId !== null && (
        <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
          <p id="ingreso-rate-label" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3"
            style={{ fontFamily: "var(--font-space-mono)" }}>
            Cobro del parqueo
          </p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="ingreso-rate-label">
            {([
              { value: "hour", label: "Por hora" },
              { value: "day", label: "Día completo" },
            ] as const).map((rt) => {
              const active = parkingRateType === rt.value;
              const amount =
                parkingRates.find(
                  (r) => r.vehicleTypeId === vehicleTypeId && r.rateType === rt.value
                )?.amount ?? 0;
              return (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => setParkingRateType(rt.value)}
                  aria-pressed={active}
                  className="flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-2 rounded-xl font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                  style={{
                    background: active ? "var(--color-primary)" : "var(--color-muted)",
                    color: active ? "#fff" : "var(--color-muted-foreground)",
                    border: active ? "none" : "1px solid var(--color-border)",
                  }}
                >
                  {rt.label}
                  <span className="text-[11px] font-bold" style={{ fontFamily: "var(--font-space-mono)" }}>
                    {formatPrice(amount)}{rt.value === "hour" ? "/h" : ""}
                  </span>
                </button>
              );
            })}
          </div>
          {parkingRate === 0 && (
            <p className="mt-2 text-[11px] text-amber-600">
              No hay tarifa configurada para este tipo de vehículo. Configúrala en Configuración → Tarifas.
            </p>
          )}
          {parkingRateType === "hour" && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              El total se calcula al registrar la salida (horas × tarifa).
            </p>
          )}
        </section>
      )}

      {/* ── Servicios (solo lavado) ──────────────────────────── */}
      {mode === "wash" && vehicleTypeId !== null && (
        <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
          <p id="ingreso-services-label" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3"
            style={{ fontFamily: "var(--font-space-mono)" }}>
            Servicios
          </p>
          {filteredServices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin servicios configurados para este tipo
            </p>
          ) : (
            <div className="flex flex-col gap-1.5" role="group" aria-labelledby="ingreso-services-label">
              {filteredServices.map((svc) => {
                const active = selectedServices.includes(svc.id);
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => toggleService(svc.id)}
                    aria-pressed={active}
                    className="flex items-center justify-between min-h-[44px] px-3 py-3 rounded-xl transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
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
                        aria-hidden="true"
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
        <p id="ingreso-slot-label" className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3"
          style={{ fontFamily: "var(--font-space-mono)" }}>
          Espacio asignado
        </p>
        {availableSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            {mode === "wash" ? "Sin bahías de lavado libres" : "Sin plazas de parqueo libres"}.
            <br />
            <span className="text-xs">Quedará <b>en espera</b>; le asignás un espacio cuando se libere uno.</span>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="ingreso-slot-label">
            <button
              type="button"
              onClick={() => setSlotId(null)}
              aria-pressed={slotId === null}
              className="min-h-[44px] px-3 py-1.5 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              style={{
                background: slotId === null ? "var(--color-muted)" : "transparent",
                border: slotId === null ? "1.5px solid var(--color-border)" : "1.5px solid var(--color-border)/40",
                color: "var(--color-muted-foreground)",
              }}
            >
              Sin espacio
            </button>
            {availableSlots.map((s) => {
              const active = slotId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSlotId(s.id)}
                  aria-pressed={active}
                  aria-label={`Espacio ${s.label}`}
                  className="min-h-[44px] px-3 py-1.5 rounded-lg text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
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
            Espacio {selectedSlot.kind === "wash" ? "de lavado" : selectedSlot.kind === "monthly" ? "de mensualidad" : "de parqueo"} seleccionado
          </p>
        )}
      </section>

      {/* ── Empleado asignado (solo lavado) ──────────────────── */}
      {mode === "wash" && workers.length > 0 && (
        <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
          <p
            id="ingreso-employee-label"
            className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3"
            style={{ fontFamily: "var(--font-space-mono)" }}
          >
            Empleado asignado
          </p>
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby="ingreso-employee-label">
            <button
              type="button"
              onClick={() => setEmployeeId(null)}
              aria-pressed={employeeId === null}
              className="min-h-[44px] px-3 py-1.5 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
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
                  aria-pressed={active}
                  className="flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  style={{
                    background: active ? "var(--color-primary)" : "var(--color-muted)",
                    color: active ? "#fff" : "var(--color-foreground)",
                    border: active ? "none" : "1.5px solid var(--color-border)",
                  }}
                >
                  <span
                    aria-hidden="true"
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
          aria-expanded={showClient}
          aria-controls="ingreso-client-panel"
          className="w-full flex items-center justify-between min-h-[44px] px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-2xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground"
            style={{ fontFamily: "var(--font-space-mono)" }}>
            Datos del cliente (opcional)
          </p>
          <span aria-hidden="true" className="text-muted-foreground text-sm">{showClient ? "▲" : "▼"}</span>
        </button>

        {showClient && (
          <div id="ingreso-client-panel" className="px-4 pb-4 flex flex-col gap-3">
            <div className="h-px bg-border/40" />
            <div>
              <label htmlFor="ingreso-owner-name" className="text-xs text-muted-foreground font-medium mb-1 block">Nombre</label>
              <input
                id="ingreso-owner-name"
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Nombre del propietario"
                autoComplete="name"
                className="w-full h-11 px-3 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-colors"
              />
            </div>
            <div>
              <label htmlFor="ingreso-owner-phone" className="text-xs text-muted-foreground font-medium mb-1 block">Teléfono</label>
              <input
                id="ingreso-owner-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="300 000 0000"
                className="w-full h-11 px-3 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-colors"
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Total + Submit ──────────────────────────────────── */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm pt-3 pb-4 -mx-4 px-4 border-t border-border/40">
        {error && (
          <p id="ingreso-error" role="alert" className="text-sm text-destructive font-medium mb-2 text-center">{error}</p>
        )}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">
            {mode === "parking" && parkingRateType === "hour" ? "Tarifa" : "Total"}
          </span>
          <span
            className="text-2xl font-extrabold"
            style={{
              fontFamily: "var(--font-space-mono)",
              color: total > 0 ? "var(--color-primary)" : "var(--color-muted-foreground)",
            }}
          >
            {formatPrice(total)}
            {mode === "parking" && parkingRateType === "hour" && (
              <span className="text-sm font-semibold text-muted-foreground">/h</span>
            )}
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
          {loading
            ? "Creando orden..."
            : mode === "parking"
              ? "Registrar parqueo"
              : "Registrar lavado"}
        </button>
      </div>
    </form>
  );
}
