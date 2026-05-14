"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Plus, ClipboardList, Clock, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: LayoutGrid, label: "Inicio" },
  { href: "/ordenes", icon: ClipboardList, label: "Órdenes" },
  { href: "/ingreso", icon: Plus, label: "Ingreso", isFab: true },
  { href: "/turnos", icon: Clock, label: "Turno" },
  { href: "/configuracion", icon: MoreHorizontal, label: "Más" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-2px_12px_rgba(0,0,0,0.08)] md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label, isFab }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

          if (isFab) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <span className="bg-primary text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-md">
                  <Icon className="w-6 h-6" />
                </span>
                <span className="text-[10px] mt-1 text-muted-foreground font-medium">
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2"
            >
              <span
                className={cn(
                  "rounded-xl px-3 py-1.5 transition-colors",
                  isActive ? "bg-primary/10" : "bg-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
