"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSlots } from "@/lib/hooks/useSlots";
import { SlotCard, type SlotData } from "./SlotCard";

type FilterKind = "all" | "parking" | "wash";

const filterLabels: { value: FilterKind; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "parking", label: "Parqueo" },
  { value: "wash", label: "Lavado" },
];

interface SlotGridProps {
  initialData?: { slots: SlotData[] };
}

export function SlotGrid({ initialData }: SlotGridProps) {
  const [filter, setFilter] = useState<FilterKind>("all");

  const { data, isLoading, error } = useSlots(initialData);

  const allSlots = data?.slots ?? [];

  const filteredSlots =
    filter === "all"
      ? allSlots
      : allSlots.filter((s) => s.kind === filter);

  const occupiedCount = allSlots.filter((s) => s.status !== "free").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Filter chips */}
      <div
        className="flex gap-2 flex-wrap"
        role="group"
        aria-label="Filtrar espacios por tipo"
      >
        {filterLabels.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`inline-flex items-center justify-center min-h-[44px] px-4 py-1.5 rounded-full text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              filter === value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error discreto: el polling falló (mostramos los últimos datos si los hay) */}
      {error && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2"
        >
          <span aria-hidden="true" className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
          <span className="font-medium">No se pudo actualizar.</span>
          <span className="text-orange-600/80">Reintentando…</span>
        </div>
      )}

      {/* Grid */}
      {isLoading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : filteredSlots.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No hay slots{filter !== "all" ? ` de tipo ${filterLabels.find((f) => f.value === filter)?.label.toLowerCase()}` : ""} configurados.
        </div>
      ) : (
        <>
          {/* Resumen accesible del estado actual (anunciado por lectores de pantalla) */}
          <p className="sr-only" role="status" aria-live="polite">
            {`Mostrando ${filteredSlots.length} ${
              filteredSlots.length === 1 ? "espacio" : "espacios"
            }, ${occupiedCount} de ${allSlots.length} ocupados.`}
          </p>
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0 m-0"
            aria-label="Lista de espacios del establecimiento"
          >
            {filteredSlots.map((slot) => (
              <li key={slot.id}>
                <SlotCard slot={slot} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
