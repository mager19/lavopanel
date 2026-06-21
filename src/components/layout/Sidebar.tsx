"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Plus,
  ClipboardList,
  Clock,
  CalendarRange,
  BarChart3,
  Settings2,
  Droplets,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: LayoutGrid, label: "Dashboard" },
  { href: "/ingreso", icon: Plus, label: "Nuevo ingreso" },
  { href: "/ordenes", icon: ClipboardList, label: "Órdenes" },
  { href: "/turnos", icon: Clock, label: "Turno" },
  { href: "/mensualidades", icon: CalendarRange, label: "Mensualidades" },
  { href: "/reportes", icon: BarChart3, label: "Reportes" },
  { href: "/configuracion", icon: Settings2, label: "Configuración" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-card border-r border-border shrink-0">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="bg-primary rounded-xl p-1.5">
          <Droplets className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
        </div>
        <span className="font-bold text-foreground text-lg">LavoPanel</span>
      </div>

      <nav aria-label="Navegación principal" className="flex flex-col gap-1 p-3 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
