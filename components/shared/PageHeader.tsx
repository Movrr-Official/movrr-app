import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PageHeaderAction {
  method?: "get" | "post";
  fields?: Record<string, string | number>;
  type?: "button" | "select";
  label: string;
  href?: string;
  icon?: ReactNode;
  onClick?: () => void;
  asChild?: boolean;
  variant?: "default" | "secondary" | "outline" | "ghost" | "link";
  options?: Array<{ label: string; value: string }>;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}

interface PageHeaderProps {
  title?: string;
  description?: string;
  action?: PageHeaderAction;
  actions?: PageHeaderAction[];
}

export function PageHeader({
  title,
  description,
  action,
  actions,
}: PageHeaderProps) {
  const resolvedActions = actions ?? (action ? [action] : []);

  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {resolvedActions.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
          {resolvedActions.map((item) => {
            if (item.type === "select") {
              return (
                <Select
                  key={item.label}
                  value={item.value}
                  onValueChange={item.onValueChange}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={item.placeholder ?? item.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {(item.options ?? []).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }

            const buttonClassName = item.variant
              ? undefined
              : "bg-primary text-primary-foreground hover:bg-primary/90";

            if (item.href && item.method === "post") {
              return (
                <form key={item.label} action={item.href} method="post">
                  {Object.entries(item.fields ?? {}).map(([key, value]) => (
                    <input
                      key={key}
                      type="hidden"
                      name={key}
                      value={String(value)}
                    />
                  ))}
                  <Button type="submit" variant={item.variant ?? "default"} className={buttonClassName}>
                    {item.icon ? <span className="mr-2 h-4 w-4">{item.icon}</span> : null}
                    {item.label}
                  </Button>
                </form>
              );
            }

            return (
              <Button
                key={item.label}
                asChild={item.asChild || Boolean(item.href)}
                onClick={item.onClick}
                variant={item.variant ?? "default"}
                className={buttonClassName}
              >
                {item.href ? (
                  <Link href={item.href}>
                    {item.icon ? <span className="mr-2 h-4 w-4">{item.icon}</span> : null}
                    {item.label}
                  </Link>
                ) : (
                  <>
                    {item.icon ? <span className="mr-2 h-4 w-4">{item.icon}</span> : null}
                    {item.label}
                  </>
                )}
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
