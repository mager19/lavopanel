"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { SlotData } from "./SlotCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── Status palette ───────────────────────────────────────────────
const STATUS = {
  free:        { fill: "#f0fdf4", stroke: "#86efac", text: "#166534", dot: "#22c55e", label: "LIBRE"     },
  occupied:    { fill: "#fffbeb", stroke: "#fcd34d", text: "#92400e", dot: "#f59e0b", label: "OCUPADO"   },
  in_progress: { fill: "#eff6ff", stroke: "#93c5fd", text: "#1e40af", dot: "#3b82f6", label: "EN LAVADO" },
  ready:       { fill: "#f0fdfa", stroke: "#5eead4", text: "#134e4a", dot: "#14b8a6", label: "LISTO"     },
} as const;

type StatusKey = keyof typeof STATUS;

// ── SVG layout constants ─────────────────────────────────────────
const W   = 380;   // viewBox width
const PAD = 14;    // horizontal padding
const GAP = 8;     // gap between slots
const P_H = 88;    // parking slot height
const B_H = 108;   // wash bay height
const LBL = 20;    // section label block height
const SEP = 20;    // vertical gap between sections
const RX  = 14;    // corner radius

const MONO = "var(--font-space-mono), ui-monospace, monospace";
const SANS = "var(--font-jakarta), system-ui, sans-serif";

function trunc(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

// ── Individual slot shape ────────────────────────────────────────
function SlotShape({
  x, y, w, h, slot,
}: {
  x: number; y: number; w: number; h: number; slot: SlotData;
}) {
  const s = STATUS[(slot.status as StatusKey)] ?? STATUS.free;
  const cx = x + w / 2;
  const cy = y + h / 2;

  return (
    <>
      {/* Background */}
      <rect x={x} y={y} width={w} height={h} rx={RX} fill={s.fill} stroke={s.stroke} strokeWidth={1.5} />

      {/* Slot code — top left */}
      <text
        x={x + 10} y={y + 17}
        fontFamily={MONO} fontSize={11} fontWeight={700}
        fill={s.text} letterSpacing={1}
      >
        {slot.label}
      </text>

      {/* Status dot — top right (with pulse ring for in_progress) */}
      {slot.status === "in_progress" && (
        <circle cx={x + w - 14} cy={y + 13} r={8} fill={s.dot} opacity={0.25} className="animate-pulse" />
      )}
      <circle cx={x + w - 14} cy={y + 13} r={4.5} fill={s.dot} />

      {/* Center content */}
      {slot.status === "free" ? (
        <text
          x={cx} y={cy + 9}
          fontFamily={SANS} fontSize={26} fontWeight={300}
          fill={s.stroke} textAnchor="middle" opacity={0.75}
        >
          +
        </text>
      ) : slot.order ? (
        <>
          <text
            x={cx}
            y={slot.order.service ? cy - 4 : cy + 5}
            fontFamily={MONO} fontSize={14} fontWeight={700}
            fill={s.text} textAnchor="middle" letterSpacing={2}
          >
            {slot.order.plate ?? "—"}
          </text>
          {slot.order.service && (
            <text
              x={cx} y={cy + 13}
              fontFamily={SANS} fontSize={9}
              fill={s.text} textAnchor="middle" opacity={0.65}
            >
              {trunc(slot.order.service, w > 150 ? 24 : 14)}
            </text>
          )}
        </>
      ) : null}

      {/* Status label — bottom */}
      <text
        x={cx} y={y + h - 9}
        fontFamily={SANS} fontSize={8} fontWeight={600}
        fill={s.text} textAnchor="middle" letterSpacing={0.8} opacity={0.5}
      >
        {s.label}
      </text>
    </>
  );
}

// ── Section zone (background area + label) ───────────────────────
function Zone({
  x, y, w, h, label,
}: {
  x: number; y: number; w: number; h: number; label: string;
}) {
  return (
    <>
      <text
        x={x} y={y - 5}
        fontFamily={MONO} fontSize={9} fontWeight={600}
        fill="currentColor" opacity={0.35} letterSpacing={2}
      >
        {label}
      </text>
      <rect
        x={x - 4} y={y}
        width={w + 8} height={h + 8}
        rx={RX + 2} fill="rgba(0,0,0,0.025)"
      />
    </>
  );
}

// ── Main component ───────────────────────────────────────────────
interface FloorPlanProps {
  initialData?: { slots: SlotData[] };
}

export function FloorPlan({ initialData }: FloorPlanProps) {
  const router = useRouter();

  const { data } = useSWR<{ slots: SlotData[] }>("/api/slots", fetcher, {
    fallbackData: initialData,
    refreshInterval: 8000,
  });

  const allSlots = data?.slots ?? [];
  const parking  = allSlots.filter((s) => s.kind === "parking");
  const wash     = allSlots.filter((s) => s.kind === "wash");

  const useW = W - PAD * 2;

  // Parking row geometry
  const pCount = Math.max(parking.length, 1);
  const pW     = (useW - GAP * (pCount - 1)) / pCount;
  const pY     = LBL;

  // Wash row geometry
  const wCount = Math.max(wash.length, 1);
  const wW     = (useW - GAP * (wCount - 1)) / wCount;
  const wY     = LBL + P_H + SEP + LBL;

  const totalH = wY + B_H + PAD;

  const handleClick = (slot: SlotData) => {
    if (slot.status === "free") {
      router.push(`/ingreso?slot=${encodeURIComponent(slot.label)}`);
    } else if (slot.order?.id) {
      router.push(`/ordenes/${slot.order.id}`);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      {/* SVG */}
      <div className="p-4 pb-2">
        <svg
          viewBox={`0 0 ${W} ${totalH}`}
          className="w-full"
          style={{ height: "auto" }}
          aria-label="Planta del local"
        >
          {/* Parking zone */}
          {parking.length > 0 && (
            <Zone x={PAD} y={pY} w={useW} h={P_H} label="PARQUEO" />
          )}
          {parking.map((slot, i) => (
            <g key={slot.id} onClick={() => handleClick(slot)} style={{ cursor: "pointer" }}>
              <SlotShape x={PAD + i * (pW + GAP)} y={pY} w={pW} h={P_H} slot={slot} />
            </g>
          ))}

          {/* Wash zone */}
          {wash.length > 0 && (
            <Zone x={PAD} y={wY} w={useW} h={B_H} label="LAVADO" />
          )}
          {wash.map((slot, i) => (
            <g key={slot.id} onClick={() => handleClick(slot)} style={{ cursor: "pointer" }}>
              <SlotShape x={PAD + i * (wW + GAP)} y={wY} w={wW} h={B_H} slot={slot} />
            </g>
          ))}
        </svg>
      </div>

      {/* Legend strip */}
      <div className="px-4 py-3 border-t border-border/40 bg-muted/20 flex flex-wrap gap-x-4 gap-y-1">
        {(Object.entries(STATUS) as [StatusKey, (typeof STATUS)[StatusKey]][]).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
            <span className="text-[11px] text-muted-foreground font-medium">{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
