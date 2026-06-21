"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface Props {
  from: string;
  to: string;
  fromHour: number;
  toHour: number;
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const pad = (n: number | string) => String(n).padStart(2, "0");

export function DateFilter({ from, to, fromHour, toHour }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fromVal, setFromVal] = useState(from);
  const [toVal, setToVal] = useState(to);
  const [fromH, setFromH] = useState(String(fromHour));
  const [toH, setToH] = useState(String(toHour));

  const push = (f: string, t: string, fh: string, th: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", f);
    params.set("to", t);
    params.set("fromHour", fh);
    params.set("toHour", th);
    router.push(`/reportes?${params.toString()}`);
  };

  const apply = () => push(fromVal, toVal, fromH, toH);

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
    setFromH("0");
    setToH("23");
    push(f, t, "0", "23");
  };

  const allDay = () => {
    setFromH("0");
    setToH("23");
    push(fromVal, toVal, "0", "23");
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
      </div>

      {/* Franja horaria */}
      <div className="flex items-center gap-2 flex-wrap mt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
          Franja
        </span>
        <select
          aria-label="Hora desde"
          value={fromH}
          onChange={(e) => setFromH(e.target.value)}
          className="h-11 rounded-xl border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>{pad(h)}:00</option>
          ))}
        </select>
        <span aria-hidden="true" className="text-sm text-muted-foreground">→</span>
        <select
          aria-label="Hora hasta"
          value={toH}
          onChange={(e) => setToH(e.target.value)}
          className="h-11 rounded-xl border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>{pad(h)}:59</option>
          ))}
        </select>
        <button
          type="button"
          onClick={allDay}
          className="text-xs font-medium min-h-[44px] px-3 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          Todo el día
        </button>
        <button
          type="button"
          onClick={apply}
          className="h-11 px-4 rounded-xl text-sm font-semibold text-white ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          style={{ background: "var(--color-primary)" }}
        >
          Aplicar
        </button>
      </div>
    </section>
  );
}
