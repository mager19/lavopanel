import { auth } from "@/lib/auth";
import { getAllSlots } from "@/lib/services/slots";
import { getAllServices } from "@/lib/services/services-catalog";
import {
  getVehicleTypes,
  getParkingRates,
  getBusinessConfig,
  getEmployees,
} from "@/lib/services/config";
import { ConfigTabs } from "@/components/config/ConfigTabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Settings2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const session = await auth();
  const role = session?.user?.role as string | undefined;

  if (role !== "admin" && role !== "owner") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold text-muted-foreground">
            Sin acceso
          </p>
          <p className="text-sm text-muted-foreground">
            Solo administradores y propietarios pueden ver esta sección.
          </p>
        </div>
      </div>
    );
  }

  const [slots, services, vehicleTypes, parkingRates, businessConfig, employees] =
    await Promise.all([
      getAllSlots(),
      getAllServices(),
      getVehicleTypes(),
      getParkingRates(),
      getBusinessConfig(),
      getEmployees(),
    ]);

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="Configuración"
        subtitle="Plazas, tarifas, servicios y datos del negocio"
        icon={Settings2}
        iconColor="#6b7280"
        iconBg="#f9fafb"
      />
      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        <ConfigTabs
          slots={slots}
          services={services}
          vehicleTypes={vehicleTypes}
          parkingRates={parkingRates}
          businessConfig={businessConfig}
          employees={employees}
        />
      </div>
    </div>
  );
}
