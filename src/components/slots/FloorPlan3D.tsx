"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import * as THREE from "three";
import type { SlotData } from "./SlotCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── Paleta de estados ────────────────────────────────────────────
const STATUS = {
  free:        { floor: "#e8f5e9", car: "#4caf50", dot: "#22c55e", label: "Libre"     },
  occupied:    { floor: "#fff8e1", car: "#ff9800", dot: "#f59e0b", label: "Ocupado"   },
  in_progress: { floor: "#e3f2fd", car: "#2196f3", dot: "#3b82f6", label: "En lavado" },
  ready:       { floor: "#e0f2f1", car: "#009688", dot: "#14b8a6", label: "Listo"     },
} as const;

type StatusKey = keyof typeof STATUS;

// Slot dimensions — iguales para todos los tipos
const SLOT_W = 1.9;
const SLOT_D = 3.15;
const SPACING = 2.35;

// ── Cámara adaptiva según ancho de pantalla ──────────────────────
function CameraAdaptive() {
  const { camera, size } = useThree();

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const isMobile = size.width < 640;
    if (isMobile) {
      cam.fov = 58;
      camera.position.set(0, 12, 9);
    } else {
      cam.fov = 35;
      camera.position.set(0, 22, 2.5);
    }
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width]);

  useFrame(() => {
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ── Silueta top-down de carro (estilo Parking Manager) ──────────
function CarTopView({ color }: { color: string }) {
  const cW = 1.28;
  const cD = 2.5;

  const wheels: [number, number][] = [
    [ cW * 0.45,  cD * 0.31],
    [-cW * 0.45,  cD * 0.31],
    [ cW * 0.45, -cD * 0.31],
    [-cW * 0.45, -cD * 0.31],
  ];

  const headlights: number[] = [-cW * 0.26, cW * 0.26];

  return (
    <group position={[0, 0.008, -0.05]}>
      {/* Carrocería principal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[cW, cD]} />
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.04} />
      </mesh>

      {/* Techo / cabina — brillo suave */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[cW * 0.68, cD * 0.3]} />
        <meshStandardMaterial color="#fff" transparent opacity={0.14} roughness={0.1} />
      </mesh>

      {/* Parabrisas delantero */}
      <mesh position={[0, 0.005, cD * 0.19]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[cW * 0.6, cD * 0.12]} />
        <meshStandardMaterial color="#a8d8f0" transparent opacity={0.72} roughness={0.05} />
      </mesh>

      {/* Ventana trasera */}
      <mesh position={[0, 0.005, -cD * 0.22]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[cW * 0.54, cD * 0.09]} />
        <meshStandardMaterial color="#a8d8f0" transparent opacity={0.55} roughness={0.05} />
      </mesh>

      {/* Ruedas — círculos oscuros */}
      {wheels.map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.006, wz]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[cW * 0.115, 12]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
        </mesh>
      ))}

      {/* Faros delanteros */}
      {headlights.map((lx, i) => (
        <mesh key={i} position={[lx, 0.007, cD * 0.46]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[cW * 0.07, 8]} />
          <meshStandardMaterial
            color="#fffde7"
            emissive="#ffee88"
            emissiveIntensity={0.45}
            roughness={0}
          />
        </mesh>
      ))}

      {/* Luces traseras (rojo tenue) */}
      {headlights.map((lx, i) => (
        <mesh key={i} position={[lx, 0.007, -cD * 0.46]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[cW * 0.063, 8]} />
          <meshStandardMaterial
            color="#ff5252"
            emissive="#ff3030"
            emissiveIntensity={0.35}
            roughness={0}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Anillo pulsante para "en lavado" ─────────────────────────────
function PulseRing({ color }: { color: string }) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.elapsedTime * 2.4;
    mesh.current.scale.setScalar(1 + Math.sin(t) * 0.07);
    (mesh.current.material as THREE.MeshBasicMaterial).opacity =
      0.2 + Math.sin(t) * 0.1;
  });
  return (
    <mesh ref={mesh} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.82, 1.06, 36]} />
      <meshBasicMaterial color={color} transparent opacity={0.22} />
    </mesh>
  );
}

// ── Slot individual ──────────────────────────────────────────────
function Slot({
  slot,
  position,
}: {
  slot: SlotData;
  position: [number, number, number];
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const s = STATUS[(slot.status as StatusKey)] ?? STATUS.free;
  const isFree = slot.status === "free";

  const handleClick = () => {
    if (isFree) {
      router.push(`/ingreso?slot=${encodeURIComponent(slot.label)}`);
    } else if (slot.order?.id) {
      router.push(`/ordenes/${slot.order.id}`);
    }
  };

  return (
    <group
      position={position}
      onClick={handleClick}
      onPointerEnter={() => {
        setHovered(true);
        document.body.style.cursor = isFree ? "pointer" : slot.order?.id ? "pointer" : "default";
      }}
      onPointerLeave={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      {/* Suelo del slot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[SLOT_W - 0.1, SLOT_D - 0.1]} />
        <meshStandardMaterial
          color={hovered ? "#e0e0e0" : s.floor}
          roughness={0.88}
          metalness={0}
        />
      </mesh>

      {/* Líneas blancas de borde */}
      <mesh position={[-(SLOT_W / 2) + 0.03, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.055, SLOT_D]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
      </mesh>
      <mesh position={[SLOT_W / 2 - 0.03, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.055, SLOT_D]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
      </mesh>

      {/* Carro (si no libre) */}
      {!isFree && <CarTopView color={s.car} />}

      {/* Indicador "+" para libre */}
      {isFree && (
        <group position={[0, 0.007, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.52, 0.1]} />
            <meshBasicMaterial color={s.dot} transparent opacity={0.48} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.1, 0.52]} />
            <meshBasicMaterial color={s.dot} transparent opacity={0.48} />
          </mesh>
        </group>
      )}

      {/* Anillo pulsante */}
      {slot.status === "in_progress" && <PulseRing color={s.dot} />}

      {/* Label flotante */}
      <Html
        position={[0, 1.8, 0]}
        center
        distanceFactor={9}
        occlude={false}
        zIndexRange={[10, 0]}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-space-mono, monospace)",
              fontSize: "11px",
              fontWeight: 700,
              color: "#111",
              background: "rgba(255,255,255,0.97)",
              border: `1.5px solid ${s.dot}`,
              padding: "2px 9px",
              borderRadius: "999px",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.13)",
            }}
          >
            {slot.label}
          </div>
          {slot.order?.plate && (
            <div
              style={{
                fontFamily: "var(--font-space-mono, monospace)",
                fontSize: "10px",
                fontWeight: 700,
                color: "#fff",
                background: "#111",
                padding: "1px 8px",
                borderRadius: "4px",
                letterSpacing: "2px",
                whiteSpace: "nowrap",
              }}
            >
              {slot.order.plate}
            </div>
          )}
          {isFree && hovered && (
            <div
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#fff",
                background: "#F97316",
                padding: "2px 8px",
                borderRadius: "999px",
                whiteSpace: "nowrap",
                marginTop: "2px",
              }}
            >
              + Registrar vehículo
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// ── Calle de acceso ──────────────────────────────────────────────
function Street({ width }: { width: number }) {
  const laneZ = 2.05;
  const laneDepth = 1.95;
  const dashCount = Math.ceil((width + 6) / 1.5);
  const startX = -(dashCount * 1.5) / 2;

  return (
    <group>
      <mesh position={[0, 0.002, laneZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width + 8, laneDepth]} />
        <meshStandardMaterial color="#3a3835" roughness={0.97} />
      </mesh>
      {Array.from({ length: dashCount }).map((_, i) => (
        <mesh key={i} position={[startX + i * 1.5, 0.01, laneZ]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.72, 0.09]} />
          <meshBasicMaterial color="#f0d060" transparent opacity={0.85} />
        </mesh>
      ))}
      {/* Stop line */}
      <mesh position={[0, 0.008, laneZ - laneDepth / 2 + 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + 8, 0.1]} />
        <meshBasicMaterial color="#f0d060" transparent opacity={0.68} />
      </mesh>
    </group>
  );
}

// ── Suelo general ────────────────────────────────────────────────
function Ground({ width }: { width: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0.4]} receiveShadow>
      <planeGeometry args={[width + 14, 13]} />
      <meshStandardMaterial color="#d4cec7" roughness={0.94} />
    </mesh>
  );
}

// ── Escena completa ──────────────────────────────────────────────
function Scene({ slots }: { slots: SlotData[] }) {
  const count = Math.max(slots.length, 1);
  const totalW = (count - 1) * SPACING;

  return (
    <>
      <CameraAdaptive />
      <color attach="background" args={["#f5f0eb"]} />

      <ambientLight intensity={1.05} />
      <directionalLight
        position={[3, 20, 5]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <directionalLight position={[-4, 10, -3]} intensity={0.18} color="#ffe8cc" />

      <Ground width={totalW} />
      <Street width={totalW} />

      {slots.map((slot, i) => (
        <Slot
          key={slot.id}
          slot={slot}
          position={[i * SPACING - totalW / 2, 0, 0]}
        />
      ))}

      {/* Divisores entre slots */}
      {slots.slice(0, -1).map((_, i) => {
        const x = i * SPACING - totalW / 2 + SPACING / 2;
        return (
          <mesh key={i} position={[x, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.065, SLOT_D + 0.15]} />
            <meshBasicMaterial color="#a8a09a" transparent opacity={0.75} />
          </mesh>
        );
      })}
    </>
  );
}

// ── Leyenda ──────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="px-4 py-3 border-t border-border/40 bg-muted/20 flex flex-wrap gap-x-4 gap-y-1">
      {(Object.entries(STATUS) as [StatusKey, (typeof STATUS)[StatusKey]][]).map(
        ([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: cfg.dot }}
            />
            <span className="text-[11px] text-muted-foreground font-medium">
              {cfg.label}
            </span>
          </div>
        )
      )}
    </div>
  );
}

// ── Export principal ─────────────────────────────────────────────
interface FloorPlan3DProps {
  initialData?: { slots: SlotData[] };
}

export function FloorPlan3D({ initialData }: FloorPlan3DProps) {
  const { data } = useSWR<{ slots: SlotData[] }>("/api/slots", fetcher, {
    fallbackData: initialData,
    refreshInterval: 8000,
  });

  const slots = data?.slots ?? [];

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      <div style={{ height: 340 }}>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ fov: 35, position: [0, 22, 2.5], near: 0.1, far: 500 }}
          gl={{ antialias: true, alpha: false }}
        >
          <Scene slots={slots} />
        </Canvas>
      </div>
      <Legend />
    </div>
  );
}
