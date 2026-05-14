"use client";

import dynamic from "next/dynamic";
import type { SlotData } from "./SlotCard";

const FloorPlan3D = dynamic(
  () => import("./FloorPlan3D").then((m) => m.FloorPlan3D),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] rounded-2xl bg-muted animate-pulse" />
    ),
  }
);

interface Props {
  initialData?: { slots: SlotData[] };
}

export function FloorPlan3DLoader({ initialData }: Props) {
  return <FloorPlan3D initialData={initialData} />;
}
