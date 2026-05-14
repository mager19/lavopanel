import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  action?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = "#F97316",
  iconBg = "#fff7ed",
  action,
}: PageHeaderProps) {
  return (
    <div className="bg-card border-b border-border/40 px-4 pt-5 pb-4 md:px-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {Icon && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: iconBg }}
            >
              <Icon className="w-5 h-5" style={{ color: iconColor }} />
            </div>
          )}
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-foreground leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
