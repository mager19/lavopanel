import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActivePlans, getExpiringSoon, expireOverduePlans } from "@/lib/services/monthly-plans";
import { getVehicleTypes } from "@/lib/services/catalog";
import { PlanList } from "./PlanList";
import { NewPlanButton } from "./NewPlanButton";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalendarRange } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MensualidadesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await expireOverduePlans();

  const [plans, expiringSoon, vehicleTypes] = await Promise.all([
    getActivePlans(),
    getExpiringSoon(7),
    getVehicleTypes(),
  ]);

  return (
    <div className="flex flex-col min-h-full">

      <PageHeader
        title="Mensualidades"
        subtitle={
          plans.length === 0
            ? "Sin planes activos"
            : `${plans.length} plan${plans.length !== 1 ? "es" : ""} activo${plans.length !== 1 ? "s" : ""}`
        }
        icon={CalendarRange}
        iconColor="#8b5cf6"
        iconBg="#f5f3ff"
        action={
          expiringSoon.length > 0 ? (
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: "#fff7ed", color: "#F97316", border: "1px solid #fed7aa" }}
            >
              {expiringSoon.length} por vencer
            </span>
          ) : undefined
        }
      />

      {/* Content */}
      <div className="flex-1 bg-background px-4 py-5 space-y-4 md:px-6">
        <NewPlanButton vehicleTypes={vehicleTypes} />
        <PlanList plans={plans} expiringSoon={expiringSoon} />
      </div>
    </div>
  );
}
