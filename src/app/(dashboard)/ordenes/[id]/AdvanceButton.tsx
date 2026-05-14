"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const NEXT_LABEL: Record<string, string> = {
  received:    "Iniciar lavado",
  in_progress: "Marcar como listo",
  ready:       "Registrar entrega",
};

const NEXT_COLOR: Record<string, string> = {
  received:    "#3b82f6",
  in_progress: "#14b8a6",
  ready:       "#22c55e",
};

interface Props {
  orderId: number;
  currentStatus: "received" | "in_progress" | "ready";
  isAdmin: boolean;
}

export function AdvanceButton({ orderId, currentStatus, isAdmin: _isAdmin }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const label = NEXT_LABEL[currentStatus];
  const color = NEXT_COLOR[currentStatus];

  const handleAdvance = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/advance`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al avanzar la orden");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-4">
      {error && (
        <p className="text-sm text-destructive font-medium mb-2 text-center">{error}</p>
      )}
      <button
        onClick={handleAdvance}
        disabled={loading}
        className="w-full h-14 rounded-2xl text-base font-bold text-white transition-all active:scale-[0.98]"
        style={{
          background: loading ? "var(--color-muted)" : color,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Actualizando..." : label}
      </button>
    </div>
  );
}
