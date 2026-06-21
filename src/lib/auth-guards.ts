import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

export type Role = "admin" | "owner" | "worker";

type GuardResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

/**
 * Exige una sesión autenticada. Devuelve la sesión o una respuesta 401 lista
 * para retornar desde un route handler.
 *
 *   const guard = await requireSession();
 *   if (!guard.ok) return guard.response;
 *   // guard.session disponible
 */
export async function requireSession(): Promise<GuardResult> {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }
  return { ok: true, session };
}

/**
 * Exige una sesión con uno de los roles indicados. Devuelve 401 si no hay
 * sesión, 403 si el rol no está autorizado.
 */
export async function requireRole(roles: Role[]): Promise<GuardResult> {
  const guard = await requireSession();
  if (!guard.ok) return guard;

  const role = (guard.session.user as { role?: Role }).role;
  if (!role || !roles.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }),
    };
  }
  return guard;
}
