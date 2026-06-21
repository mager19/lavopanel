"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface Props {
  from: string;
  to: string;
}

export function DateFilter({ from, to }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fromVal, setFromVal] = useState(from);
  const [toVal, setToVal] = useState(to);

  const apply = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", fromVal);
    params.set("to", toVal);
    router.push(`/reportes?${params.toString()}`);
  };

  const presets = [
    { label: "Hoy", days: 0 },
    { label: "7 días", days: 7 },
    { label: "30 días", days: 30 },
  ];

  const setPreset = (days: number) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - days);
    const f = start.toISOString().split("T")[0];
    const t = now.toISOString().split("T")[0];
    setFromVal(f);
    setToVal(t);
    const params = new URLSearchParams();
    params.set("from", f);
    params.set("to", t);
    router.push(`/reportes?${params.toString()}`);
  };

  return (
    <section className="bg-card rounded-2xl border border-border/50 shadow-sm p-4">
      <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Rangos rápidos de fecha">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setPreset(p.days)}
            className="text-xs font-semibold min-h-[44px] px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="date"
          aria-label="Fecha desde"
          value={fromVal}
          onChange={(e) => setFromVal(e.target.value)}
          className="h-11 rounded-xl border border-border bg-background px-3 text-sm flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <span aria-hidden="true" className="text-sm text-muted-foreground">→</span>
        <input
          type="date"
          aria-label="Fecha hasta"
          value={toVal}
          onChange={(e) => setToVal(e.target.value)}
          min={fromVal}
          className="h-11 rounded-xl border border-border bg-background px-3 text-sm flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={apply}
          className="h-11 px-4 rounded-xl text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          style={{ background: "var(--color-primary)" }}
        >
          Aplicar
        </button>
      </div>
    </section>
  );
}
