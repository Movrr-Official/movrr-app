import {
  Bell,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  LineChart,
  MapPinned,
  Megaphone,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ICONS = {
  bell: Bell,
  budget: CircleDollarSign,
  dashboard: LayoutDashboard,
  file: FileText,
  impressions: LineChart,
  megaphone: Megaphone,
  routes: MapPinned,
  rewards: Trophy,
  users: Users,
} satisfies Record<string, LucideIcon>;

export type StatCardIconName = keyof typeof ICONS;

export function StatCard({
  title,
  value,
  detail,
  iconName,
  badges,
  className,
}: {
  title: string;
  value: string | number;
  detail?: string;
  iconName?: StatCardIconName;
  badges?: Array<{ label: string; className?: string }>;
  className?: string;
}) {
  const Icon = iconName ? ICONS[iconName] : null;

  return (
    <Card
      className={cn(
        "glass-card group relative overflow-hidden border-0 transition-all duration-300",
        className,
      )}
    >
      <div className="from-primary/5 absolute inset-0 bg-linear-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <CardHeader className="relative z-10 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              {title}
            </CardTitle>
            <div className="text-3xl font-bold text-foreground md:text-4xl">
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
          </div>
          {Icon ? (
            <div className="rounded-xl bg-primary/10 p-3 transition-all duration-300">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          ) : null}
        </div>
      </CardHeader>
      {detail || (badges && badges.length > 0) ? (
        <CardContent className="relative z-10">
          {detail ? (
            <p className="mb-2 text-xs text-muted-foreground">{detail}</p>
          ) : null}
          {badges?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <Badge
                  key={badge.label}
                  variant="outline"
                  className={cn("text-xs font-medium", badge.className)}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
