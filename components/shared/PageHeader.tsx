import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    icon?: ReactNode;
    variant?: "default" | "secondary" | "outline" | "ghost" | "link";
  };
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="max-w-2xl text-muted-foreground">{description}</p> : null}
      </div>
      {action ? (
        <div className="mt-4 md:mt-0">
          <Button asChild variant={action.variant ?? "default"} className={action.variant ? undefined : "bg-primary text-primary-foreground hover:bg-primary/90"}>
            <Link href={action.href ?? "#"}>
              {action.icon ? <span className="mr-2 h-4 w-4">{action.icon}</span> : null}
              {action.label}
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
