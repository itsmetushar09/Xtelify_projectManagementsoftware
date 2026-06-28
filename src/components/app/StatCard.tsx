import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accent?: string;
}

export function StatCard({ label, value, icon: Icon, trend, trendUp, accent = "primary" }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/70 transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
            {trend && (
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  trendUp ? "text-success" : "text-muted-foreground",
                )}
              >
                {trend}
              </p>
            )}
          </div>
          <div
            className={cn(
              "grid h-10 w-10 place-items-center rounded-lg",
              accent === "primary" && "bg-primary/10 text-primary",
              accent === "success" && "bg-success/15 text-success",
              accent === "warning" && "bg-warning/20 text-warning-foreground",
              accent === "info" && "bg-info/15 text-info",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
