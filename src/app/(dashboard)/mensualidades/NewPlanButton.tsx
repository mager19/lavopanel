"use client";

import { useState } from "react";
import { NewPlanForm } from "./NewPlanForm";

interface VehicleType {
  id: number;
  name: string;
}

export function NewPlanButton({ vehicleTypes }: { vehicleTypes: VehicleType[] }) {
  const [open, setOpen] = useState(false);

  if (open) {
    return <NewPlanForm vehicleTypes={vehicleTypes} onCancel={() => setOpen(false)} />;
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="w-full h-12 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98]"
      style={{ background: "#F97316" }}
    >
      + Nueva mensualidad
    </button>
  );
}
