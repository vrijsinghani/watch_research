import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import Layout from "@/components/layout";
import { MetricCard } from "@/components/metric-card";
import { PriceChart } from "@/components/price-chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Download, 
  Share2, 
  Activity, 
  Gavel, 
  Store,
  Globe,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAnalysis, getAnalyses, getMarketDataPoints, getResearchProgress, type ResearchProgress } from "@/lib/api";
import ReactMarkdown from "react-markdown";

export default function Dashboard() {
  const [, params] = useRoute("/dashboard/:id");
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const analysisId = params?.id;

  // If no ID provided, get the first analysis
  const { data: analyses } = useQuery({
    queryKey: ["analyses"],
    queryFn: getAnalyses,
    enabled: !analysisId,
  });

  // Get specific analysis if ID provided
  const { data: analysis, isLoading: analysisLoading, error: analysisError } = useQuery({
    queryKey: ["analysis", analysisId || analyses?.[0]?.id],
    queryFn: () => getAnalysis(analysisId || analyses![0].id),
    enabled: !!(analysisId || analyses?.[0]?.id),
  });

  const effectiveId = analysisId || analysis?.id;

  // Poll for research progress
  const { data: progress } = useQuery({
    queryKey: ["researchProgress", effectiveId],
    queryFn: () => getResearchProgress(effectiveId!),
    enabled: !!effectiveId,
    refetchInterval: (data) => {
      // Stop polling when research is complete or failed
      if (data?.state?.data?.status === "completed" || data?.state?.data?.status === "failed") {
        return false;
      }
      return 3000; // Poll every 3 seconds
    },
  });

  // Refresh data when research completes
  useEffect(() => {
    if (progress?.status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["analysis", effectiveId] });
      queryClient.invalidateQueries({ queryKey: ["marketData", effectiveId] });
    }
  }, [progress?.status, effectiveId, queryClient]);

  // Get market data points
  const { data: marketData, isLoading: marketDataLoading } = useQuery({
    queryKey: ["marketData", effectiveId],
    queryFn: () => getMarketDataPoints(effectiveId!),
    enabled: !!effectiveId && progress?.status !== "researching",
  });

  const isResearching = progress?.status && !["completed", "failed", "not_started"].includes(progress.status);

  if (analysisLoading || (!analysisId && !analyses)) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (analysisError || (!analysisId && analyses?.length === 0)) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen gap-6 max-w-md mx-auto text-center p-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">No Analysis Found</h2>
            <p className="text-muted-foreground">
              Start by searching for a watch to analyze its market value.
            </p>
          </div>
          <Button onClick={() => setLocation("/")} className="gap-2">
            <Search className="w-4 h-4" /> Search Watches
          </Button>
        </div>
      </Layout>
    );
  }

  if (!analysis) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Research in progress view
  if (isResearching) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-8 max-w-lg mx-auto text-center p-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Activity className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-primary animate-spin" />
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              Researching {analysis.brand} {analysis.model}
            </h2>
            <p className="text-muted-foreground">
              {analysis.reference !== "N/A" && `Ref. ${analysis.reference} • `}
              Chronos is gathering market intelligence
            </p>
          </div>

          <div className="w-full space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{progress?.message || "Initializing..."}</span>
              <span className="text-primary font-mono">{progress?.progress || 0}%</span>
            </div>
            <Progress value={progress?.progress || 0} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="p-4 bg-card rounded-lg border border-border/50 text-left">
              <div className="text-xs text-muted-foreground uppercase mb-1">Status</div>
              <div className="font-medium text-foreground capitalize">{progress?.status?.replace("_", " ")}</div>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border/50 text-left">
              <div className="text-xs text-muted-foreground uppercase mb-1">Est. Time</div>
              <div className="font-medium text-foreground">2-10 minutes</div>
            </div>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-left">
            <div className="flex gap-3">
              <Activity className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">What's happening?</p>
                <p className="text-muted-foreground mt-1">
                  Our AI agent is searching auction houses (Christie's, Phillips, Sotheby's), 
                  marketplaces (Chrono24, WatchBox), and dealers to compile comprehensive pricing data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Research failed view
  if (progress?.status === "failed") {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 max-w-md mx-auto text-center p-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Research Failed</h2>
            <p className="text-muted-foreground">
              {progress?.message || "An error occurred during research. Please try again."}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setLocation("/")}>
              New Search
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Parse executive summary for key findings
  const keyFindings = analysis.executiveSummary
    ?.split("*")
    .filter(line => line.trim().length > 0 && line.includes("**"))
    .slice(0, 3)
    .map(line => line.trim()) || [];

  const hasData = (marketData?.length || 0) > 0;

  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {hasData ? (
                <Badge variant="outline" className="border-green-500/50 text-green-500 uppercase tracking-widest text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Research Complete
                </Badge>
              ) : (
                <Badge variant="outline" className="border-primary/50 text-primary uppercase tracking-widest text-[10px] flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Pending Data
                </Badge>
              )}
              {analysis.liquidityScore && (
                <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                  {analysis.liquidityScore} Liquidity
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              {analysis.brand} {analysis.model}
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              {analysis.description} {analysis.reference !== "N/A" && `(Ref. ${analysis.reference})`}
            </p>
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

        {/* No data state */}
        {!hasData && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-lg font-display font-bold mb-2">Awaiting Research Data</h3>
              <p className="text-muted-foreground max-w-md">
                No market data has been collected yet. Chronos will populate this dashboard
                with comprehensive pricing intelligence once research is complete.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Intelligence Briefing - only show if we have data */}
        {hasData && (
          <>
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="w-32 h-32 rotate-12" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-display">
                  <Activity className="w-5 h-5 text-primary" />
                  Market Intelligence Briefing
                </CardTitle>
                <CardDescription>
                  Synthesized from {marketData?.length || 0} data points across global sources.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-8 relative z-10">
                <div className="md:col-span-2 space-y-4">
                  <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed">
                    <p className="font-medium text-foreground text-base border-l-2 border-primary pl-4">
                      {analysis.executiveSummary?.split('\n')[0] || "Market analysis complete."}
                    </p>
                    {keyFindings.length > 0 && (
                      <div className="mt-4 grid gap-3">
                        {keyFindings.map((finding, i) => (
                          <div key={i} className="flex gap-3 bg-secondary/30 p-3 rounded-md border border-border/50">
                            <ArrowUpRight className="w-4 h-4 text-primary shrink-0 mt-1" />
                            <span className="text-sm">{finding.replace(/\*\*/g, '')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-background/50 backdrop-blur-sm rounded-lg border border-border/50">
                    <div className="text-sm text-muted-foreground mb-1">Confidence Score</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold font-mono text-green-500">
                        {analysis.confidenceScore || 0}/100
                      </span>
                      <span className="text-xs text-green-500">
                        {(analysis.confidenceScore || 0) >= 70 ? "High" : (analysis.confidenceScore || 0) >= 40 ? "Medium" : "Low"} Reliability
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${analysis.confidenceScore || 0}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                      <div className="text-xs text-muted-foreground">Analyst Consensus</div>
                      <div className={cn(
                        "text-sm font-bold mt-1",
                        analysis.analystConsensus === "BUY" ? "text-green-500" :
                        analysis.analystConsensus === "SELL" ? "text-red-500" : "text-primary"
                      )}>
                        {analysis.analystConsensus || "N/A"}
                      </div>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg border border-border/50">
                      <div className="text-xs text-muted-foreground">Volatility</div>
                      <div className="text-sm font-bold mt-1 text-blue-400">
                        {analysis.volatility || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard 
                title="Global Market Price" 
                value={analysis.marketPrice ? `$${analysis.marketPrice.toLocaleString()}` : "N/A"} 
                subtext="Weighted avg across all sources"
                icon={Globe}
              />
              <MetricCard 
                title="Data Points" 
                value={marketData?.length.toString() || "0"} 
                subtext="Sales & listings analyzed" 
                icon={Activity}
              />
              <MetricCard 
                title="Sold Records" 
                value={marketData?.filter(d => d.priceType === "Sold").length.toString() || "0"} 
                subtext="Completed transactions" 
                icon={Gavel}
              />
              <MetricCard 
                title="Active Listings" 
                value={marketData?.filter(d => d.priceType === "Asking").length.toString() || "0"} 
                subtext="Current market offerings" 
                icon={Store}
              />
            </div>

            {/* Main Analysis Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <PriceChart data={marketData || []} isLoading={marketDataLoading} />
                
                <Card className="border-border/50 bg-card">
                  <CardHeader>
                    <CardTitle className="text-base">Source Composition</CardTitle>
                    <CardDescription>Where the data is coming from</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Auction', 'Marketplace', 'Dealer', 'Other'].map(type => {
                      const count = marketData?.filter(d => d.sourceType === type).length || 0;
                      const percentage = marketData && marketData.length > 0 ? (count / marketData.length) * 100 : 0;
                      return (
                        <div key={type} className="space-y-1">
                          <span className="text-xs text-muted-foreground uppercase">{type}</span>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full", 
                                type === 'Auction' ? 'bg-purple-500' :
                                type === 'Marketplace' ? 'bg-blue-500' :
                                type === 'Dealer' ? 'bg-amber-500' : 'bg-zinc-500'
                              )} 
                              style={{ width: `${percentage}%` }} 
                            />
                          </div>
                          <div className="text-sm font-mono">{count} ({Math.round(percentage)}%)</div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="bg-card border-border/50 h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        Market Tape
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {marketData?.length || 0} RECORDS
                      </Badge>
                    </div>
                    <CardDescription>
                      Sales and listings from research
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-[600px]">
                      {marketDataLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : marketData && marketData.length > 0 ? (
                        <div className="divide-y divide-border/50">
                          {marketData.map((sale) => (
                            <div 
                              key={sale.id} 
                              className="p-4 hover:bg-secondary/30 transition-colors group cursor-pointer border-l-2 border-transparent hover:border-primary"
                              onClick={() => sale.listingUrl && window.open(sale.listingUrl, '_blank')}
                              data-testid={`sale-record-${sale.id}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <span className="font-bold font-mono text-foreground block">
                                    ${sale.price.toLocaleString()}
                                  </span>
                                  <span className={cn(
                                    "text-[10px] uppercase font-bold tracking-wider",
                                    sale.priceType === 'Sold' ? "text-green-500" : "text-blue-400"
                                  )}>
                                    {sale.priceType}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-[9px] bg-secondary/50 border-border/50 text-muted-foreground">
                                  {sale.source}
                                </Badge>
                              </div>
                              
                              {sale.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 my-2">
                                  {sale.description}
                                </p>
                              )}
                              
                              <div className="flex justify-between items-center mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <Gavel className="w-3 h-3" />
                                  <span>{sale.condition || "N/A"}</span>
                                  {sale.watchYear && <span className="text-primary">({sale.watchYear})</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                  {sale.saleDate && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(sale.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                  )}
                                  {sale.listingUrl ? (
                                    <ExternalLink className="w-3 h-3 text-primary" />
                                  ) : (
                                    <ExternalLink className="w-3 h-3 text-muted-foreground/30" />
                                  )}
                                </div>
                              </div>
                              
                              {(sale.seller || sale.listingId) && (
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground/70">
                                  {sale.seller && <span>Seller: {sale.seller}</span>}
                                  {sale.listingId && <span>ID: {sale.listingId}</span>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                          <Activity className="w-8 h-8 text-muted-foreground mb-3" />
                          <p className="text-sm text-muted-foreground">No market data yet</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Price Statistics Section */}
            {analysis.priceStatistics && (
              <Card className="border-border/50 bg-card" data-testid="price-statistics">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Price Statistics</CardTitle>
                  <CardDescription>Key pricing metrics from market research</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(analysis.priceStatistics as any).msrp && (
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">Official MSRP</div>
                        <div className="text-lg font-bold font-mono">${(analysis.priceStatistics as any).msrp.toLocaleString()}</div>
                      </div>
                    )}
                    {(analysis.priceStatistics as any).avgSoldPrice && (
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">Avg Sold Price</div>
                        <div className="text-lg font-bold font-mono text-green-500">${(analysis.priceStatistics as any).avgSoldPrice.toLocaleString()}</div>
                      </div>
                    )}
                    {(analysis.priceStatistics as any).medianSoldPrice && (
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">Median Sold Price</div>
                        <div className="text-lg font-bold font-mono">${(analysis.priceStatistics as any).medianSoldPrice.toLocaleString()}</div>
                      </div>
                    )}
                    {(analysis.priceStatistics as any).avgAskingPrice && (
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">Avg Asking Price</div>
                        <div className="text-lg font-bold font-mono text-blue-400">${(analysis.priceStatistics as any).avgAskingPrice.toLocaleString()}</div>
                      </div>
                    )}
                    {(analysis.priceStatistics as any).soldPriceRangeLow && (analysis.priceStatistics as any).soldPriceRangeHigh && (
                      <div className="p-3 bg-secondary/30 rounded-lg col-span-2">
                        <div className="text-xs text-muted-foreground">Sold Price Range</div>
                        <div className="text-lg font-bold font-mono">
                          ${(analysis.priceStatistics as any).soldPriceRangeLow.toLocaleString()} - ${(analysis.priceStatistics as any).soldPriceRangeHigh.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {(analysis.priceStatistics as any).askingVsSoldSpread && (
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">Asking vs Sold Spread</div>
                        <div className="text-lg font-bold font-mono">{(analysis.priceStatistics as any).askingVsSoldSpread}%</div>
                      </div>
                    )}
                    {(analysis.priceStatistics as any).recentTrend && (
                      <div className="p-3 bg-secondary/30 rounded-lg">
                        <div className="text-xs text-muted-foreground">Recent Trend</div>
                        <div className="text-lg font-bold">{(analysis.priceStatistics as any).recentTrend}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Condition-Based Pricing Table */}
            {analysis.conditionPricing && Array.isArray(analysis.conditionPricing) && (analysis.conditionPricing as any[]).length > 0 && (
              <Card className="border-border/50 bg-card" data-testid="condition-pricing">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Condition-Based Pricing</CardTitle>
                  <CardDescription>Price ranges by watch condition</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Condition</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Sold Range</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Asking Range</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(analysis.conditionPricing as any[]).map((row, i) => (
                          <tr key={i} className="border-b border-border/30 hover:bg-secondary/20">
                            <td className="py-2 px-3 font-medium">{row.condition}</td>
                            <td className="py-2 px-3 font-mono text-green-500">
                              {row.soldRangeLow && row.soldRangeHigh 
                                ? `$${row.soldRangeLow.toLocaleString()} - $${row.soldRangeHigh.toLocaleString()}`
                                : '-'}
                            </td>
                            <td className="py-2 px-3 font-mono text-blue-400">
                              {row.askingRangeLow && row.askingRangeHigh 
                                ? `$${row.askingRangeLow.toLocaleString()} - $${row.askingRangeHigh.toLocaleString()}`
                                : '-'}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground text-xs">{row.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Price Trends Narrative */}
            {analysis.priceTrends && (
              <Card className="border-border/50 bg-card" data-testid="price-trends">
                <CardHeader>
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Price Trends
                  </CardTitle>
                  <CardDescription>Historical price movement analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm prose-invert max-w-none [&_strong]:text-foreground [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:text-muted-foreground [&_p]:text-muted-foreground [&_p]:mb-3">
                    <ReactMarkdown>{analysis.priceTrends}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Special Editions & Variants */}
            {analysis.specialEditions && (
              <Card className="border-border/50 bg-card" data-testid="special-editions">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Special Editions & Variants</CardTitle>
                  <CardDescription>Notable versions and their pricing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm prose-invert max-w-none [&_strong]:text-foreground [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:text-muted-foreground [&_p]:text-muted-foreground [&_p]:mb-3">
                    <ReactMarkdown>{analysis.specialEditions}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Market Analysis */}
            {analysis.marketAnalysis && (
              <Card className="border-border/50 bg-card" data-testid="market-analysis">
                <CardHeader>
                  <CardTitle className="text-lg font-display">Market Analysis</CardTitle>
                  <CardDescription>Key factors influencing value</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm prose-invert max-w-none [&_strong]:text-foreground [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_li]:text-muted-foreground [&_p]:text-muted-foreground [&_p]:mb-3">
                    <ReactMarkdown>{analysis.marketAnalysis}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sources / Bibliography */}
            {analysis.sources && Array.isArray(analysis.sources) && (analysis.sources as any[]).length > 0 && (
              <Card className="border-border/50 bg-card/50" data-testid="sources">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(analysis.sources as any[]).map((source, i) => (
                      source.url ? (
                        <a 
                          key={i}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary/70 hover:text-primary underline-offset-2 hover:underline flex items-center gap-1"
                        >
                          {source.name}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span key={i} className="text-xs text-muted-foreground">{source.name}</span>
                      )
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
