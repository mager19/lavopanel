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
          <Droplets className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-foreground text-lg">LavoPanel</span>
      </div>

      <nav className="flex flex-col gap-1 p-3 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
