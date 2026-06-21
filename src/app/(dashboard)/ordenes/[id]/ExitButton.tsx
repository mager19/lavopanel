"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ExitButton({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleExit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/exit`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al registrar la salida");
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
        <p role="alert" className="text-sm text-destructive font-medium mb-2 text-center">{error}</p>
      )}
      <button
        onClick={handleExit}
        disabled={loading}
        aria-busy={loading}
        className="w-full h-14 rounded-2xl text-base font-bold text-white transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        style={{
          background: loading ? "var(--color-muted)" : "#16a34a",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Registrando..." : "Registrar salida y cobrar"}
      </button>
    </div>
  );
}
