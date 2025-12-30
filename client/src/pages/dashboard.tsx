import Layout from "@/components/layout";
import { MetricCard } from "@/components/metric-card";
import { PriceChart } from "@/components/price-chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Share2, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  DollarSign, 
  Bot, 
  Gavel, 
  Store,
  Globe,
  ArrowUpRight,
  ExternalLink
} from "lucide-react";
import { deepResearchData } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { raw_report, extracted_sales } = deepResearchData;

  // Extract Executive Summary from raw report (naive parsing)
  const executiveSummary = raw_report
    .split("## Executive Summary")[1]
    ?.split("###")[0]
    ?.trim() || "Market analysis unavailable.";

  // Extract Key Findings
  const keyFindings = raw_report
    .split("### Key Findings")[1]
    ?.split("---")[0]
    ?.split("*")
    .filter(line => line.trim().length > 0)
    .map(line => line.trim()) || [];

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="border-primary/50 text-primary uppercase tracking-widest text-[10px] flex items-center gap-1">
                <Bot className="w-3 h-3" /> AI Deep Research Active
              </Badge>
              <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">High Liquidity</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Rolex Daytona</h1>
            <p className="text-muted-foreground mt-1 text-lg">White Gold • Steel Dial • Oyster Bracelet (Ref. 126509)</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 border-border hover:bg-secondary hover:text-foreground">
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
              <Download className="w-4 h-4" /> Export Brief
            </Button>
          </div>
        </div>

        {/* Intelligence Briefing - The "Wow" Factor */}
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Bot className="w-32 h-32 rotate-12" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-display">
              <Activity className="w-5 h-5 text-primary" />
              Market Intelligence Briefing
            </CardTitle>
            <CardDescription>Synthesized from 12 global sources including Christie's, EveryWatch, and Dealer Networks.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-8 relative z-10">
            <div className="md:col-span-2 space-y-4">
              <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed">
                <p className="font-medium text-foreground text-base border-l-2 border-primary pl-4">
                  {executiveSummary.split('\n')[0]}
                </p>
                <div className="mt-4 grid gap-3">
                  {keyFindings.slice(0, 3).map((finding, i) => (
                    <div key={i} className="flex gap-3 bg-secondary/30 p-3 rounded-md border border-border/50">
                      <ArrowUpRight className="w-4 h-4 text-primary shrink-0 mt-1" />
                      <span className="text-sm">{finding.replace(/\*\*/g, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-background/50 backdrop-blur-sm rounded-lg border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">Confidence Score</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-green-500">94/100</span>
                  <span className="text-xs text-green-500">High Reliability</span>
                </div>
                <div className="mt-3 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[94%]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                   <div className="text-xs text-muted-foreground">Analyst Consensus</div>
                   <div className="text-sm font-bold mt-1 text-primary">BUY</div>
                </div>
                <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                   <div className="text-xs text-muted-foreground">Volatility</div>
                   <div className="text-sm font-bold mt-1 text-blue-400">STABLE</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Global Market Price" 
            value="$45,900" 
            change="+3.2%" 
            trend="up" 
            subtext="Weighted avg across all sources"
            icon={Globe}
          />
          <MetricCard 
            title="Recent Auction High" 
            value="$57,000" 
            subtext="Phillips (Dec 2024)" 
            icon={Gavel}
          />
          <MetricCard 
            title="Dealer Ask (Avg)" 
            value="$48,650" 
            subtext="Premium: +6.0%" 
            icon={Store}
          />
          <MetricCard 
            title="Liquidity Score" 
            value="High" 
            subtext="Avg. Time to Sale: 14 days" 
            icon={Activity}
          />
        </div>

        {/* Main Analysis Area: Chart + Consolidated Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PriceChart />
            
            {/* Detailed Source Breakdown - Replaces the old "Investment Outlook" cards */}
            <Card className="border-border/50 bg-card">
              <CardHeader>
                <CardTitle className="text-base">Source Composition</CardTitle>
                <CardDescription>Where the data is coming from</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase">Auction</span>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-[30%]" />
                  </div>
                  <div className="text-sm font-mono">15% Volume</div>
                </div>
                 <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase">Marketplace</span>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[60%]" />
                  </div>
                  <div className="text-sm font-mono">55% Volume</div>
                </div>
                 <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase">Dealer</span>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[45%]" />
                  </div>
                  <div className="text-sm font-mono">25% Volume</div>
                </div>
                 <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase">Private</span>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-500 w-[10%]" />
                  </div>
                  <div className="text-sm font-mono">5% Volume</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
             {/* Unified Market Tape */}
            <Card className="bg-card border-border/50 h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Global Market Tape
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono">LIVE</Badge>
                </div>
                <CardDescription>Real-time listings & sales from all sources</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[600px]">
                  <div className="divide-y divide-border/50">
                    {extracted_sales.map((sale, i) => (
                      <div key={i} className="p-4 hover:bg-secondary/30 transition-colors group cursor-pointer border-l-2 border-transparent hover:border-primary">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="font-bold font-mono text-foreground block">
                              ${sale.price.toLocaleString()}
                            </span>
                            <span className={cn(
                              "text-[10px] uppercase font-bold tracking-wider",
                              sale.price_type === 'Sold' ? "text-green-500" : "text-blue-400"
                            )}>
                              {sale.price_type}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[9px] bg-secondary/50 border-border/50 text-muted-foreground">
                            {sale.source}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2 my-2">
                          {sale.description.replace(/\*\*/g, '')}
                        </p>
                        
                        <div className="flex justify-between items-center mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Gavel className="w-3 h-3" />
                            {sale.condition}
                          </div>
                          <ExternalLink className="w-3 h-3 text-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
