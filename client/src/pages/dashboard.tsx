import Layout from "@/components/layout";
import { MetricCard } from "@/components/metric-card";
import { PriceChart } from "@/components/price-chart";
import { ListingFeed } from "@/components/listing-feed";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Share2, TrendingUp, AlertTriangle, Activity, DollarSign } from "lucide-react";

export default function Dashboard() {
  return (
    <Layout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="border-primary/50 text-primary uppercase tracking-widest text-[10px]">Reference 126509</Badge>
              <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">High Liquidity</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Rolex Daytona</h1>
            <p className="text-muted-foreground mt-1 text-lg">White Gold • Steel Dial • Oyster Bracelet</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 border-border hover:bg-secondary hover:text-foreground">
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
              <Download className="w-4 h-4" /> Export Report
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Market Price" 
            value="$45,900" 
            change="+3.2%" 
            trend="up" 
            subtext="vs last month"
            icon={DollarSign}
          />
          <MetricCard 
            title="Retail Price" 
            value="$42,500" 
            subtext="Premium: +8.0%" 
            icon={TrendingUp}
          />
          <MetricCard 
            title="Volatility" 
            value="Low" 
            subtext="Risk Score: 2/10" 
            icon={Activity}
          />
          <MetricCard 
            title="Liquidity" 
            value="High" 
            subtext="Avg. Time to Sale: 14 days" 
            icon={AlertTriangle}
          />
        </div>

        {/* Main Analysis Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PriceChart />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border/50 rounded-lg p-6">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Investment Outlook</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">6-Month Forecast</span>
                    <span className="text-green-500 font-medium">+5.2%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[65%]" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Market sentiment remains bullish due to limited supply of white gold variants. Dealers are accumulating inventory.
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-lg p-6">
                 <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Condition Impact</h3>
                 <div className="space-y-3">
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">New / Unworn</span>
                     <span className="text-foreground font-medium">$45,900</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Mint Condition</span>
                     <span className="text-foreground font-medium">$44,200</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Good Condition</span>
                     <span className="text-foreground font-medium">$41,500</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <ListingFeed />
          </div>
        </div>
      </div>
    </Layout>
  );
}
