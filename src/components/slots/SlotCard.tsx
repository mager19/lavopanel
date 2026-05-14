"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Car, Plus } from "lucide-react";

export type SlotOrder = {
  id: number;
  plate: string | null;
  vehicleType: string | null;
  service: string | null;
  employee: string | null;
  startedAt: string | null; // ISO string from JSON
  total: number;
  status: string;
};

export type SlotData = {
  id: number;
  label: string;
  kind: "parking" | "wash";
  status: "free" | "occupied" | "in_progress" | "ready";
  position: number | null;
  order?: SlotOrder;
};

const borderColor: Record<string, string> = {
  free: "border-l-green-400",
  occupied: "border-l-amber-400",
  in_progress: "border-l-blue-400",
  ready: "border-l-teal-400",
};

const badgeClass: Record<string, string> = {
  free: "bg-green-100 text-green-700",
  occupied: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  ready: "bg-teal-100 text-teal-700",
};

const statusLabel: Record<string, string> = {
  free: "LIBRE",
  occupied: "OCUPADO",
  in_progress: "EN LAVADO",
  ready: "LISTO",
};

function ElapsedTime({ startedAt }: { startedAt: string | null }) {
  const [minutes, setMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (!startedAt) return;

    const calc = () => {
      const diff = Date.now() - new Date(startedAt).getTime();
      setMinutes(Math.floor(diff / 60000));
    };

    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (minutes === null) return null;
  return <span>{minutes} min</span>;
}

function formatPrice(amount: number): string {
  return `$${amount.toLocaleString("es-CO")}`;
}

export function SlotCard({ slot }: { slot: SlotData }) {
  const border = borderColor[slot.status] ?? "border-l-gray-300";
  const badge = badgeClass[slot.status] ?? "bg-gray-100 text-gray-600";
  const label = statusLabel[slot.status] ?? slot.status.toUpperCase();

  const cardContent = (
    <div
      className={`bg-card shadow-sm rounded-2xl border-l-4 ${border} p-4 flex flex-col gap-2 h-full`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-sm tracking-wider text-foreground">
          {slot.label}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              slot.status === "in_progress"
                ? "bg-blue-500 animate-pulse"
                : slot.status === "free"
                ? "bg-green-500"
                : slot.status === "ready"
                ? "bg-teal-500"
                : "bg-amber-500"
            }`}
          />
          {label}
        </span>
      </div>

      {/* Body */}
      {slot.status === "free" ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Plus className="w-4 h-4" />
            Asignar
          </span>
        </div>
      ) : slot.order ? (
        <div className="flex flex-col gap-1.5 flex-1">
          {/* Plate */}
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="font-mono font-bold tracking-widest text-sm text-foreground">
              {slot.order.plate ?? "—"}
            </span>
          </div>

          {/* Service */}
          {slot.order.service && (
            <span className="text-xs text-muted-foreground leading-tight">
              {slot.order.service}
            </span>
          )}

          {/* Footer: employee · time · price */}
          <div className="flex items-center justify-between mt-auto pt-1">
            <span className="text-xs text-muted-foreground">
              {slot.order.employee ?? "Sin asignar"}
              {slot.order.startedAt && (
                <>
                  {" · "}
                  <ElapsedTime startedAt={slot.order.startedAt} />
                </>
              )}
            </span>
            <span className="text-sm font-semibold text-primary">
              {formatPrice(slot.order.total)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );

  if (slot.status === "free") {
    return (
      <Link
        href={`/ingreso?slot=${encodeURIComponent(slot.label)}`}
        className="block h-full"
      >
        {cardContent}
      </Link>
    );
  }

  if (slot.order) {
    return (
      <Link href={`/ordenes/${slot.order.id}`} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
