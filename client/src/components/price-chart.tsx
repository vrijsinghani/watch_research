import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const data = [
  { date: "Jul", price: 42000 },
  { date: "Aug", price: 41500 },
  { date: "Sep", price: 43200 },
  { date: "Oct", price: 42800 },
  { date: "Nov", price: 44500 },
  { date: "Dec", price: 45900 },
];

export function PriceChart() {
  return (
    <Card className="col-span-4 bg-card border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="text-lg font-display tracking-wide">6-Month Price Trend</CardTitle>
                <CardDescription>Historical market value analysis</CardDescription>
            </div>
            <div className="flex space-x-2">
                <div className="px-3 py-1 rounded bg-primary/10 text-primary text-xs font-medium border border-primary/20">6M</div>
                <div className="px-3 py-1 rounded bg-secondary text-muted-foreground text-xs font-medium hover:bg-secondary/80 cursor-pointer transition-colors">1Y</div>
                <div className="px-3 py-1 rounded bg-secondary text-muted-foreground text-xs font-medium hover:bg-secondary/80 cursor-pointer transition-colors">ALL</div>
            </div>
        </div>
      </CardHeader>
      <CardContent className="pl-0">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Price"]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
