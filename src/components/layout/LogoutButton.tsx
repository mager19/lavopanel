"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

/**
 * Botón de cerrar sesión. `variant="full"` para el sidebar (icono + texto),
 * `variant="icon"` para headers compactos (solo icono).
 */
export function LogoutButton({ variant = "full" }: { variant?: "full" | "icon" }) {
  if (variant === "icon") {
    return (
      <form action={logoutAction}>
        <button
          type="submit"
          aria-label="Cerrar sesión"
          className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
    );
  }

  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex items-center gap-3 w-full px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        <LogOut className="w-5 h-5 shrink-0" aria-hidden="true" />
        Cerrar sesión
      </button>
    </form>
  );
}
