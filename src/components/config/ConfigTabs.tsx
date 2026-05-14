"use client";

import { useState, useTransition } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createSlotAction,
  toggleSlotAction,
  updateParkingRateAction,
  createServiceAction,
  toggleServiceAction,
  saveBusinessConfigAction,
} from "@/app/actions/config";
import type { Slot, VehicleType } from "@/lib/db/schema";

// ─── Types ────────────────────────────────────────────────────

type ParkingRateRow = {
  id: number;
  vehicleTypeId: number;
  rateType: "hour" | "day";
  amount: number;
  vehicleTypeName: string | null;
  vehicleTypeIcon: string | null;
};

type ServiceRow = {
  id: number;
  name: string;
  vehicleTypeId: number | null;
  price: number;
  estimatedMinutes: number | null;
  position: number | null;
  active: boolean | null;
  vehicleTypeName: string | null;
  vehicleTypeIcon: string | null;
};

interface ConfigTabsProps {
  slots: Slot[];
  services: ServiceRow[];
  vehicleTypes: VehicleType[];
  parkingRates: ParkingRateRow[];
  businessConfig: Record<string, string>;
}

// ─── Helpers ──────────────────────────────────────────────────

const formatCOP = (amount: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(amount);

// ─── Sub-components ───────────────────────────────────────────

function SlotBadge({ kind }: { kind: "parking" | "wash" }) {
  if (kind === "parking") {
    return (
      <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs font-medium">
        Parqueo
      </span>
    );
  }
  return (
    <span className="bg-teal-100 text-teal-700 rounded-full px-2 py-0.5 text-xs font-medium">
      Lavado
    </span>
  );
}

// ─── Tab: Plazas ──────────────────────────────────────────────

function PlazasTab({ slots }: { slots: Slot[] }) {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<"parking" | "wash">("parking");
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: number, checked: boolean) => {
    startTransition(async () => {
      await toggleSlotAction(id, checked);
    });
  };

  const handleCreate = () => {
    if (!label.trim()) return;
    const fd = new FormData();
    fd.set("label", label.trim());
    fd.set("kind", kind);
    startTransition(async () => {
      await createSlotAction(fd);
      setLabel("");
      setKind("parking");
      setShowForm(false);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {slots.length} plaza{slots.length !== 1 ? "s" : ""} registrada
          {slots.length !== 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          className="h-8 rounded-xl"
        >
          {showForm ? "Cancelar" : "Agregar plaza"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-card shadow-sm rounded-2xl p-4 space-y-3 border border-border">
          <p className="text-sm font-medium">Nueva plaza</p>
          <div className="flex gap-3">
            <Input
              placeholder="Etiqueta (ej: A1)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-10 rounded-xl flex-1"
            />
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as "parking" | "wash")}
              className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
            >
              <option value="parking">Parqueo</option>
              <option value="wash">Lavado</option>
            </select>
          </div>
          <Button
            onClick={handleCreate}
            disabled={isPending || !label.trim()}
            className="h-10 rounded-xl w-full"
          >
            {isPending ? "Guardando..." : "Crear plaza"}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="bg-card shadow-sm rounded-2xl px-4 py-3 flex items-center justify-between border border-border"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-semibold">
                {slot.label}
              </span>
              <SlotBadge kind={slot.kind} />
            </div>
            <Switch
              checked={slot.active ?? true}
              onCheckedChange={(checked: boolean) =>
                handleToggle(slot.id, checked)
              }
              disabled={isPending}
            />
          </div>
        ))}
        {slots.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay plazas registradas aún.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Tarifas ─────────────────────────────────────────────

function TarifasTab({
  vehicleTypes,
  parkingRates,
}: {
  vehicleTypes: VehicleType[];
  parkingRates: ParkingRateRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [localRates, setLocalRates] = useState<
    Record<string, string>
  >(() => {
    const map: Record<string, string> = {};
    parkingRates.forEach((r) => {
      map[`${r.vehicleTypeId}-${r.rateType}`] = String(r.amount);
    });
    return map;
  });

  const getRate = (vtId: number, rateType: "hour" | "day") =>
    localRates[`${vtId}-${rateType}`] ?? "";

  const setRate = (vtId: number, rateType: "hour" | "day", value: string) => {
    setLocalRates((prev) => ({
      ...prev,
      [`${vtId}-${rateType}`]: value,
    }));
  };

  const handleSave = (vehicleTypeId: number) => {
    const hourAmount = Number(localRates[`${vehicleTypeId}-hour`] ?? 0);
    const dayAmount = Number(localRates[`${vehicleTypeId}-day`] ?? 0);
    startTransition(async () => {
      await updateParkingRateAction(vehicleTypeId, "hour", hourAmount);
      await updateParkingRateAction(vehicleTypeId, "day", dayAmount);
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {vehicleTypes.map((vt) => (
        <div
          key={vt.id}
          className="bg-card shadow-sm rounded-2xl p-4 space-y-3 border border-border"
        >
          <div className="flex items-center gap-2">
            {vt.icon && <span className="text-xl">{vt.icon}</span>}
            <p className="font-semibold text-sm">{vt.name}</p>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Por hora ($COP)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={getRate(vt.id, "hour")}
                onChange={(e) => setRate(vt.id, "hour", e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Por día ($COP)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={getRate(vt.id, "day")}
                onChange={(e) => setRate(vt.id, "day", e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Hora: {formatCOP(Number(getRate(vt.id, "hour")) || 0)} · Día:{" "}
              {formatCOP(Number(getRate(vt.id, "day")) || 0)}
            </p>
            <Button
              size="sm"
              onClick={() => handleSave(vt.id)}
              disabled={isPending}
              className="h-8 rounded-xl"
            >
              {isPending ? "..." : "Guardar"}
            </Button>
          </div>
        </div>
      ))}
      {vehicleTypes.length === 0 && (
        <p className="text-sm text-muted-foreground py-8">
          No hay tipos de vehículo registrados.
        </p>
      )}
    </div>
  );
}

// ─── Tab: Servicios ───────────────────────────────────────────

function ServiciosTab({
  services,
  vehicleTypes,
}: {
  services: ServiceRow[];
  vehicleTypes: VehicleType[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formVehicleTypeId, setFormVehicleTypeId] = useState<string>("");
  const [formPrice, setFormPrice] = useState("");
  const [formMinutes, setFormMinutes] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: number, checked: boolean) => {
    startTransition(async () => {
      await toggleServiceAction(id, checked);
    });
  };

  const handleCreate = () => {
    if (!formName.trim() || !formVehicleTypeId || !formPrice) return;
    const fd = new FormData();
    fd.set("name", formName.trim());
    fd.set("vehicleTypeId", formVehicleTypeId);
    fd.set("price", formPrice);
    if (formMinutes) fd.set("estimatedMinutes", formMinutes);
    startTransition(async () => {
      await createServiceAction(fd);
      setFormName("");
      setFormVehicleTypeId("");
      setFormPrice("");
      setFormMinutes("");
      setShowForm(false);
    });
  };

  // Group services by vehicle type
  const grouped = vehicleTypes.map((vt) => ({
    vehicleType: vt,
    services: services.filter((s) => s.vehicleTypeId === vt.id),
  }));
  const unassigned = services.filter((s) => s.vehicleTypeId === null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {services.length} servicio{services.length !== 1 ? "s" : ""}{" "}
          registrado{services.length !== 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          className="h-8 rounded-xl"
        >
          {showForm ? "Cancelar" : "Agregar servicio"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-card shadow-sm rounded-2xl p-4 space-y-3 border border-border">
          <p className="text-sm font-medium">Nuevo servicio</p>
          <Input
            placeholder="Nombre del servicio"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="h-10 rounded-xl"
          />
          <select
            value={formVehicleTypeId}
            onChange={(e) => setFormVehicleTypeId(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none focus:border-ring"
          >
            <option value="">Tipo de vehículo</option>
            {vehicleTypes.map((vt) => (
              <option key={vt.id} value={String(vt.id)}>
                {vt.icon ? `${vt.icon} ` : ""}
                {vt.name}
              </option>
            ))}
          </select>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Precio ($COP)"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Minutos estimados"
                value={formMinutes}
                onChange={(e) => setFormMinutes(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <Button
            onClick={handleCreate}
            disabled={
              isPending || !formName.trim() || !formVehicleTypeId || !formPrice
            }
            className="h-10 rounded-xl w-full"
          >
            {isPending ? "Guardando..." : "Crear servicio"}
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(({ vehicleType, services: vtServices }) =>
          vtServices.length > 0 ? (
            <div key={vehicleType.id}>
              <div className="flex items-center gap-2 mb-2">
                {vehicleType.icon && (
                  <span className="text-base">{vehicleType.icon}</span>
                )}
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {vehicleType.name}
                </p>
              </div>
              <div className="space-y-2">
                {vtServices.map((svc) => (
                  <div
                    key={svc.id}
                    className="bg-card shadow-sm rounded-2xl px-4 py-3 flex items-center justify-between border border-border"
                  >
                    <div>
                      <p className="text-sm font-medium">{svc.name}</p>
                      <p className="text-xs text-primary font-semibold">
                        {formatCOP(svc.price)}
                        {svc.estimatedMinutes
                          ? ` · ${svc.estimatedMinutes} min`
                          : ""}
                      </p>
                    </div>
                    <Switch
                      checked={svc.active ?? true}
                      onCheckedChange={(checked: boolean) =>
                        handleToggle(svc.id, checked)
                      }
                      disabled={isPending}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null
        )}
        {unassigned.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Sin tipo
            </p>
            <div className="space-y-2">
              {unassigned.map((svc) => (
                <div
                  key={svc.id}
                  className="bg-card shadow-sm rounded-2xl px-4 py-3 flex items-center justify-between border border-border"
                >
                  <div>
                    <p className="text-sm font-medium">{svc.name}</p>
                    <p className="text-xs text-primary font-semibold">
                      {formatCOP(svc.price)}
                    </p>
                  </div>
                  <Switch
                    checked={svc.active ?? true}
                    onCheckedChange={(checked: boolean) =>
                      handleToggle(svc.id, checked)
                    }
                    disabled={isPending}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        {services.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay servicios registrados aún.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Negocio ─────────────────────────────────────────────

function NegocioTab({
  businessConfig,
}: {
  businessConfig: Record<string, string>;
}) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await saveBusinessConfigAction(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="bg-card shadow-sm rounded-2xl p-5 border border-border max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1">
            Nombre del local
          </label>
          <Input
            name="business_name"
            defaultValue={businessConfig.business_name ?? ""}
            placeholder="Mi Lavadero"
            className="h-12 rounded-xl"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium block mb-1">
              Hora apertura
            </label>
            <Input
              name="open_time"
              type="time"
              defaultValue={businessConfig.open_time ?? "07:00"}
              className="h-12 rounded-xl"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium block mb-1">
              Hora cierre
            </label>
            <Input
              name="close_time"
              type="time"
              defaultValue={businessConfig.close_time ?? "18:00"}
              className="h-12 rounded-xl"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Ciudad</label>
          <Input
            name="city"
            defaultValue={businessConfig.city ?? ""}
            placeholder="Bogotá"
            className="h-12 rounded-xl"
          />
        </div>
        <Button
          type="submit"
          disabled={isPending}
          className="h-12 rounded-xl w-full"
        >
          {saved ? "¡Guardado!" : isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </form>
    </div>
  );
}

// ─── Main ConfigTabs ──────────────────────────────────────────

export function ConfigTabs({
  slots,
  services,
  vehicleTypes,
  parkingRates,
  businessConfig,
}: ConfigTabsProps) {
  return (
    <Tabs defaultValue="plazas">
      <TabsList className="mb-4 flex flex-wrap gap-1 h-auto w-full">
        <TabsTrigger value="plazas">Plazas</TabsTrigger>
        <TabsTrigger value="tarifas">Tarifas</TabsTrigger>
        <TabsTrigger value="servicios">Servicios</TabsTrigger>
        <TabsTrigger value="negocio">Negocio</TabsTrigger>
        <TabsTrigger value="vehiculos" disabled>
          Vehículos
          <span className="ml-1 text-[10px] text-muted-foreground">soon</span>
        </TabsTrigger>
        <TabsTrigger value="empleados" disabled>
          Empleados
          <span className="ml-1 text-[10px] text-muted-foreground">soon</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="plazas">
        <PlazasTab slots={slots} />
      </TabsContent>

      <TabsContent value="tarifas">
        <TarifasTab vehicleTypes={vehicleTypes} parkingRates={parkingRates} />
      </TabsContent>

      <TabsContent value="servicios">
        <ServiciosTab services={services} vehicleTypes={vehicleTypes} />
      </TabsContent>

      <TabsContent value="negocio">
        <NegocioTab businessConfig={businessConfig} />
      </TabsContent>
    </Tabs>
  );
}
