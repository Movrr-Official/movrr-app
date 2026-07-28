import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatsCardAccent =
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "muted";

export interface StatBadge {
  label: string;
  variant?: "default" | "outline" | "secondary" | "destructive";
  className?: string;
}

export interface StatTrend {
  value: number;
  type: "increase" | "decrease";
  label?: string;
  icon?: LucideIcon;
}

export interface StatMetric {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: StatsCardAccent;
}

export interface StatProgress {
  value: number; // 0-100
  label?: string;
  showLabel?: boolean;
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  iconColor?: StatsCardAccent;
  iconBgColor?: StatsCardAccent;
  trend?: StatTrend;
  badges?: StatBadge[];
  metrics?: StatMetric[];
  progress?: StatProgress;
  className?: string;
  animationDelay?: string;
  valueSize?: "xs" | "sm" | "md" | "lg" | "xl";
  size?: "mini" | "compact" | "default" | "large";
  variant?: "default" | "linear";
  formatValue?: (value: string | number) => string;
  onClick?: () => void;
}

const iconColorClasses = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
} as const;

const iconBgClasses = {
  primary: "bg-primary/10",
  success: "bg-success/10",
  warning: "bg-warning/15",
  destructive: "bg-destructive/10",
  muted: "bg-muted",
} as const;

const valueSizeClasses = {
  xs: "text-lg md:text-xl",
  sm: "text-xl md:text-2xl",
  md: "text-2xl md:text-3xl",
  lg: "text-3xl md:text-4xl",
  xl: "text-4xl md:text-5xl",
};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "primary",
  iconBgColor = "primary",
  trend,
  badges,
  metrics,
  progress,
  className,
  animationDelay,
  valueSize,
  size = "default",
  variant = "default",
  formatValue,
  onClick,
}: StatsCardProps) {
  const isGradient = variant === "linear";
  const formattedValue = formatValue
    ? formatValue(value)
    : typeof value === "number"
      ? value.toLocaleString()
      : value;
  const effectiveValueSize =
    valueSize ||
    (size === "mini"
      ? "sm"
      : size === "compact"
        ? "sm"
        : size === "large"
          ? "xl"
          : "lg");

  const hasContent = Boolean(
    description ||
    progress ||
    (metrics && metrics.length > 0) ||
    (badges && badges.length > 0),
  );

  const cardSizeClasses = {
    mini: "py-4 gap-4",
    compact: "",
    default: "",
    large: "",
  };

  const headerSizeClasses = {
    mini: "pb-0 px-4",
    compact: "pb-2",
    default: "pb-3",
    large: "pb-4",
  };

  const titleSizeClasses = {
    mini: "text-[14px]",
    compact: "text-xs",
    default: "text-sm",
    large: "text-sm",
  };

  const iconWrapperSizeClasses = {
    mini: "p-2.5 rounded-lg",
    compact: "p-2 rounded-lg",
    default: "p-3 rounded-[14px]",
    large: "p-4 rounded-2xl",
  };

  const iconSizeClasses = {
    mini: "h-5 w-5",
    compact: "h-4 w-4",
    default: "h-5 w-5",
    large: "h-6 w-6",
  };

  const contentPaddingClasses = {
    mini: "px-4 pb-5",
    compact: "",
    default: "",
    large: "",
  };

  return (
    <Card
      className={cn(
        "transition-all duration-300 group animate-slide-up overflow-hidden relative",
        isGradient
          ? "border-0 bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-md"
          : "border border-border bg-card",
        onClick && "cursor-pointer hover:shadow-lg",
        cardSizeClasses[size],
        className,
      )}
      style={animationDelay ? { animationDelay } : undefined}
      onClick={onClick}
    >
      <CardHeader className={cn("relative z-10", headerSizeClasses[size])}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle
              className={cn(
                isGradient
                  ? "font-semibold text-primary-foreground/80"
                  : "font-semibold text-muted-foreground",
                titleSizeClasses[size],
              )}
            >
              {title}
            </CardTitle>
            <div className="flex items-baseline gap-2">
              <div
                className={cn(
                  isGradient
                    ? "font-bold text-primary-foreground"
                    : "font-bold text-foreground",
                  valueSizeClasses[effectiveValueSize],
                )}
              >
                {formattedValue}
              </div>
              {trend && (
                <span
                  className={cn(
                    "text-xs font-semibold",
                    trend.type === "increase"
                      ? "text-success"
                      : "text-destructive",
                  )}
                >
                  {trend.type === "increase" ? "+" : "-"}
                  {trend.value}%
                </span>
              )}
            </div>
          </div>
          {Icon && (
            <div
              className={cn(
                "transition-all duration-300",
                isGradient
                  ? "bg-primary-foreground/15"
                  : iconBgClasses[iconBgColor],
                iconWrapperSizeClasses[size],
              )}
            >
              <Icon
                className={cn(
                  iconSizeClasses[size],
                  isGradient
                    ? "text-primary-foreground"
                    : iconColorClasses[iconColor],
                )}
              />
            </div>
          )}
        </div>
      </CardHeader>
      {hasContent && (
        <CardContent
          className={cn("relative z-10", contentPaddingClasses[size])}
        >
          {description && (
            <p
              className={cn(
                "text-xs mb-1",
                isGradient
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground",
              )}
            >
              {description}
            </p>
          )}

          {progress && (
            <div className="mb-2">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-2">
                <div
                  className="bg-linear-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(0, progress.value))}%`,
                  }}
                />
              </div>
              {progress.showLabel && progress.label && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary font-semibold">
                    {progress.label}
                  </span>
                </div>
              )}
            </div>
          )}

          {metrics && metrics.length > 0 && (
            <div className="space-y-3 mb-2">
              {metrics.map((metric, index) => {
                const MetricIcon = metric.icon;
                const metricAccent = metric.iconColor ?? "primary";
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {MetricIcon && (
                        <MetricIcon
                          className={cn(
                            "h-4 w-4",
                            iconColorClasses[metricAccent],
                          )}
                        />
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {metric.label}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-foreground">
                      {typeof metric.value === "number"
                        ? metric.value.toLocaleString()
                        : metric.value}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {badges && badges.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {badges.map((badge, index) => (
                <Badge
                  key={index}
                  variant={badge.variant || "outline"}
                  className={cn(
                    "text-xs font-medium",
                    isGradient &&
                      "bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20",
                    badge.className,
                  )}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
