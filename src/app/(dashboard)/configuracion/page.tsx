import { auth } from "@/lib/auth";
import { getAllSlots } from "@/lib/services/slots";
import { getAllServices } from "@/lib/services/services-catalog";
import {
  getVehicleTypes,
  getParkingRates,
  getBusinessConfig,
} from "@/lib/services/config";
import { ConfigTabs } from "@/components/config/ConfigTabs";

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

  const [slots, services, vehicleTypes, parkingRates, businessConfig] =
    await Promise.all([
      getAllSlots(),
      getAllServices(),
      getVehicleTypes(),
      getParkingRates(),
      getBusinessConfig(),
    ]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona las plazas, tarifas, servicios y datos del negocio.
        </p>
      </div>
      <ConfigTabs
        slots={slots}
        services={services}
        vehicleTypes={vehicleTypes}
        parkingRates={parkingRates}
        businessConfig={businessConfig}
      />
    </div>
  );
}
