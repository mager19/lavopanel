import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getVehicleTypes, getAllActiveSlots } from "@/lib/services/catalog";
import { db } from "@/lib/db/client";
import { services, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { IngresoForm } from "@/components/forms/IngresoForm";
import { ChevronLeft, Plus } from "lucide-react";

async function getAllServices() {
  return db.select().from(services).where(eq(services.active, true)).orderBy(services.position);
}

async function getActiveWorkers() {
  return db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(and(eq(users.active, true)))
    .orderBy(users.name);
}

interface Props {
  searchParams: Promise<{ slot?: string }>;
}

export default async function IngresoPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const preselectedSlot = params.slot;

  const [vehicleTypes, allServices, allSlots, workers] = await Promise.all([
    getVehicleTypes(),
    getAllServices(),
    getAllActiveSlots(),
    getActiveWorkers(),
  ]);

  const freeSlots = allSlots.filter((s) => s.status === "free");

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-card border-b border-border/40 px-4 pt-5 pb-4 md:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-xl border border-border/60 text-muted-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5 flex-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#fff7ed" }}
            >
              <Plus className="w-4.5 h-4.5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <h1 className="text-[22px] font-extrabold tracking-tight text-foreground leading-tight">
                Registrar vehículo
              </h1>
              {preselectedSlot ? (
                <p className="text-xs font-semibold mt-0 text-muted-foreground">
                  Espacio{" "}
                  <span
                    className="font-extrabold"
                    style={{ color: "var(--color-primary)", fontFamily: "var(--font-space-mono)" }}
                  >
                    {preselectedSlot}
                  </span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Nuevo ingreso</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Formulario ─────────────────────────────────────── */}
      <div className="flex-1 bg-background px-4 pt-5 md:px-6">
        <IngresoForm
          vehicleTypes={vehicleTypes}
          services={allServices}
          freeSlots={freeSlots}
          workers={workers}
          preselectedSlotLabel={preselectedSlot}
        />
      </div>

    </div>
  );
}
