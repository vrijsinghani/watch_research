import { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { MarketDataPoint } from "@shared/schema";

interface PriceChartProps {
  data: MarketDataPoint[];
  isLoading?: boolean;
}

export function PriceChart({ data, isLoading }: PriceChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const grouped = new Map<string, { sold: number[]; asking: number[] }>();

    data.forEach((point) => {
      if (!point.saleDate) return;
      
      const date = new Date(point.saleDate);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      if (!grouped.has(monthYear)) {
        grouped.set(monthYear, { sold: [], asking: [] });
      }
      
      const group = grouped.get(monthYear)!;
      if (point.priceType === 'Sold') {
        group.sold.push(point.price);
      } else {
        group.asking.push(point.price);
      }
    });

    const chartPoints = Array.from(grouped.entries()).map(([date, prices]) => {
      const avgSold = prices.sold.length > 0 
        ? Math.round(prices.sold.reduce((a, b) => a + b, 0) / prices.sold.length)
        : null;
      const avgAsking = prices.asking.length > 0
        ? Math.round(prices.asking.reduce((a, b) => a + b, 0) / prices.asking.length)
        : null;
      
      return {
        date,
        soldPrice: avgSold,
        askingPrice: avgAsking,
        soldCount: prices.sold.length,
        askingCount: prices.asking.length,
      };
    });

    chartPoints.sort((a, b) => {
      const parseDate = (d: string) => {
        const [month, year] = d.split(" ");
        const monthNum = new Date(Date.parse(month + " 1, 2000")).getMonth();
        return parseInt("20" + year) * 12 + monthNum;
      };
      return parseDate(a.date) - parseDate(b.date);
    });

    return chartPoints;
  }, [data]);

  const hasData = chartData.length > 0;
  const hasSoldData = chartData.some(d => d.soldPrice !== null);
  const hasAskingData = chartData.some(d => d.askingPrice !== null);

  return (
    <Card className="col-span-4 bg-card border-border/50" data-testid="price-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-display tracking-wide">Price Trend</CardTitle>
            <CardDescription>
              {hasData 
                ? `${chartData.length} month${chartData.length !== 1 ? 's' : ''} of market data`
                : "Historical market value analysis"
              }
            </CardDescription>
          </div>
          {hasData && (
            <div className="flex items-center gap-4 text-xs">
              {hasSoldData && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Sold</span>
                </div>
              )}
              {hasAskingData && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-400" />
                  <span className="text-muted-foreground">Asking</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pl-0">
        <div className="h-[300px] w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading chart data...
            </div>
          ) : !hasData ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No price data available yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAsking" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
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
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  domain={['dataMin - 1000', 'dataMax + 1000']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value, name) => {
                    if (value === null || value === undefined) return ['-', String(name)];
                    const label = name === 'soldPrice' ? 'Avg Sold' : 'Avg Asking';
                    return [`$${Number(value).toLocaleString()}`, label];
                  }}
                  labelFormatter={(label) => String(label)}
                />
                {hasSoldData && (
                  <Area
                    type="monotone"
                    dataKey="soldPrice"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSold)"
                    connectNulls
                    name="soldPrice"
                  />
                )}
                {hasAskingData && (
                  <Area
                    type="monotone"
                    dataKey="askingPrice"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAsking)"
                    connectNulls
                    name="askingPrice"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
