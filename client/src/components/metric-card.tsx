import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: any;
  subtext?: string;
}

export function MetricCard({ title, value, change, trend, icon: Icon, subtext }: MetricCardProps) {
  return (
    <Card className="bg-card border-border/50 hover:border-primary/50 transition-colors duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-primary" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-display text-foreground">{value}</div>
        {(change || subtext) && (
          <div className="flex items-center mt-1 space-x-2">
            {change && (
              <span
                className={cn(
                  "text-xs font-medium flex items-center",
                  trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"
                )}
              >
                {trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {change}
              </span>
            )}
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
