"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSlots } from "@/lib/hooks/useSlots";
import type { SlotData } from "./SlotCard";

// ── Status palette ───────────────────────────────────────────────
const STATUS = {
  free:        { fill: "#f0fdf4", stroke: "#86efac", text: "#166534", dot: "#22c55e", label: "LIBRE"     },
  occupied:    { fill: "#fffbeb", stroke: "#fcd34d", text: "#92400e", dot: "#f59e0b", label: "OCUPADO"   },
  in_progress: { fill: "#eff6ff", stroke: "#93c5fd", text: "#1e40af", dot: "#3b82f6", label: "EN LAVADO" },
  ready:       { fill: "#f0fdfa", stroke: "#5eead4", text: "#134e4a", dot: "#14b8a6", label: "LISTO"     },
} as const;

type StatusKey = keyof typeof STATUS;

// ── SVG layout constants ─────────────────────────────────────────
const W     = 380;   // viewBox width
const PAD   = 14;    // horizontal padding
const GAP   = 8;     // gap between slots (horizontal)
const GAP_V = 8;     // gap between rows (vertical)
const P_H   = 88;    // parking slot height
const B_H   = 108;   // wash bay height
const LBL   = 20;    // section label block height
const SEP   = 20;    // vertical gap between sections
const RX    = 14;    // corner radius
const MAX_COLS = 3;  // máximo de columnas por fila (legibilidad en móvil)

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
  const s = STATUS[slot.status] ?? STATUS.free;
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
          fill={s.dot} textAnchor="middle" opacity={0.9}
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
        fontFamily={SANS} fontSize={8} fontWeight={700}
        fill={s.text} textAnchor="middle" letterSpacing={0.8} opacity={0.72}
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
        fontFamily={MONO} fontSize={9} fontWeight={700}
        fill="currentColor" opacity={0.5} letterSpacing={2}
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

  const { data, error } = useSlots(initialData);

  const useW = W - PAD * 2;

  const handleClick = (slot: SlotData) => {
    if (slot.status === "free") {
      router.push(`/ingreso?slot=${encodeURIComponent(slot.label)}`);
    } else if (slot.order?.id) {
      router.push(`/ordenes/${slot.order.id}`);
    }
  };

  // Estado de carga: aún no hay datos (ni iniciales ni de SWR).
  if (!data) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden p-4">
        <div className="h-[200px] rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  const allSlots = data.slots ?? [];

  // Estado vacío: no hay espacios configurados.
  if (allSlots.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">No hay espacios configurados</p>
        <p className="text-xs text-muted-foreground mt-1">
          Agregá plazas y bahías desde Configuración.
        </p>
        {error && (
          <p role="status" aria-live="polite" className="text-[11px] text-orange-700 mt-3">
            No se pudo actualizar
          </p>
        )}
      </div>
    );
  }

  const parking = allSlots.filter((s) => s.kind === "parking");
  const wash    = allSlots.filter((s) => s.kind === "wash");

  const occupiedCount = allSlots.filter((s) => s.status !== "free").length;
  const planSummary = `Plano del establecimiento: ${occupiedCount} de ${allSlots.length} espacios ocupados. La lista accesible de espacios está disponible debajo.`;

  // Layout en grilla que envuelve a varias filas (en vez de una sola fila que se
  // comprime). Mantiene un ancho mínimo legible por espacio en móvil.
  const layout = (list: SlotData[], yTop: number, slotH: number) => {
    const cols = Math.min(MAX_COLS, Math.max(list.length, 1));
    const w = (useW - GAP * (cols - 1)) / cols;
    const positions = list.map((slot, i) => ({
      slot,
      x: PAD + (i % cols) * (w + GAP),
      y: yTop + Math.floor(i / cols) * (slotH + GAP_V),
      w,
      h: slotH,
    }));
    const rows = Math.max(Math.ceil(list.length / cols), 1);
    return { positions, height: rows * slotH + (rows - 1) * GAP_V };
  };

  // Secciones dinámicas: se omiten las zonas vacías (sin huecos verticales).
  let cursorY = 0;
  const sections: {
    label: string;
    y: number;
    height: number;
    positions: { slot: SlotData; x: number; y: number; w: number; h: number }[];
  }[] = [];

  for (const [list, label, slotH] of [
    [parking, "PARQUEO", P_H],
    [wash, "LAVADO", B_H],
  ] as const) {
    if (list.length === 0) continue;
    cursorY += LBL;
    const lay = layout(list, cursorY, slotH);
    sections.push({ label, y: cursorY, height: lay.height, positions: lay.positions });
    cursorY += lay.height + SEP;
  }

  const totalH = Math.max(cursorY - SEP + PAD, 60);

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      {/* SVG */}
      <div className="p-4 pb-2">
        {/*
          El SVG es una representación puramente visual: se expone como una sola
          imagen con resumen (role="img" + aria-label) y sus grupos clicables se
          ocultan del árbol de accesibilidad (aria-hidden). El camino accesible y
          operable por teclado/lector de pantalla es la lista sr-only de abajo,
          que ofrece los mismos destinos que los clicks del plano.
        */}
        <svg
          viewBox={`0 0 ${W} ${totalH}`}
          className="w-full"
          style={{ height: "auto" }}
          role="img"
          aria-label={planSummary}
        >
          {sections.map((sec) => (
            <g key={sec.label}>
              <Zone x={PAD} y={sec.y} w={useW} h={sec.height} label={sec.label} />
              {sec.positions.map(({ slot, x, y, w, h }) => (
                <g
                  key={slot.id}
                  onClick={() => handleClick(slot)}
                  className="cursor-pointer transition-opacity hover:opacity-90 active:opacity-70"
                  aria-hidden="true"
                >
                  <SlotShape x={x} y={y} w={w} h={h} slot={slot} />
                </g>
              ))}
            </g>
          ))}
        </svg>
      </div>

      {/* Alternativa accesible al plano (visible solo para lectores de pantalla
          y navegable por teclado). Mismos destinos que los clicks del SVG. */}
      <div className="sr-only">
        <p>{planSummary}</p>
        <ul>
          {allSlots.map((slot) => {
            const statusLabel = (STATUS[slot.status] ?? STATUS.free).label.toLowerCase();
            const kindLabel = slot.kind === "wash" ? "lavado" : "parqueo";
            if (slot.status === "free") {
              return (
                <li key={slot.id}>
                  <Link href={`/ingreso?slot=${encodeURIComponent(slot.label)}`}>
                    Espacio {slot.label}, {kindLabel}, libre. Registrar vehículo.
                  </Link>
                </li>
              );
            }
            const desc = [
              `Espacio ${slot.label}`,
              kindLabel,
              statusLabel,
              slot.order?.plate ? `placa ${slot.order.plate}` : null,
            ]
              .filter(Boolean)
              .join(", ");
            return (
              <li key={slot.id}>
                {slot.order?.id ? (
                  <Link href={`/ordenes/${slot.order.id}`}>{desc}. Ver orden.</Link>
                ) : (
                  <span>{desc}.</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Legend strip */}
      <div className="px-4 py-3 border-t border-border/40 bg-muted/20 flex flex-wrap items-center gap-x-4 gap-y-1">
        {(Object.entries(STATUS) as [StatusKey, (typeof STATUS)[StatusKey]][]).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
            <span className="text-[11px] text-muted-foreground font-medium">{cfg.label}</span>
          </div>
        ))}
        {error && (
          <span role="status" aria-live="polite" className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
            No se pudo actualizar
          </span>
        )}
      </div>
    </div>
  );
}
