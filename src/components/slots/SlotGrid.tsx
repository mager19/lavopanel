"use client";

import { useState } from "react";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { SlotCard, type SlotData } from "./SlotCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

  const { data, isLoading } = useSWR<{ slots: SlotData[] }>(
    "/api/slots",
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 8000,
    }
  );

  const allSlots = data?.slots ?? [];

  const filteredSlots =
    filter === "all"
      ? allSlots
      : allSlots.filter((s) => s.kind === filter);

  return (
    <div className="flex flex-col gap-4">
      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {filterLabels.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSlots.map((slot) => (
            <SlotCard key={slot.id} slot={slot} />
          ))}
        </div>
      )}
    </div>
  );
}
