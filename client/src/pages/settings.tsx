import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Globe, 
  Gavel, 
  Store, 
  Search, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle,
  Database,
  Signal
} from "lucide-react";
import { cn } from "@/lib/utils";

const SourceCard = ({ 
  icon: Icon, 
  title, 
  description, 
  status = "active", 
  lastSync = "Just now",
  count = 0
}: { 
  icon: any, 
  title: string, 
  description: string, 
  status?: "active" | "inactive" | "syncing" | "error",
  lastSync?: string,
  count?: number
}) => (
  <div className="flex items-start justify-between p-4 bg-secondary/20 hover:bg-secondary/40 border border-border/50 rounded-lg transition-all duration-200 group">
    <div className="flex gap-4">
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
        status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-foreground">{title}</h3>
          {status === "active" && (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-green-500/30 text-green-500 bg-green-500/5">
              Live
            </Badge>
          )}
          {status === "syncing" && (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-primary/30 text-primary bg-primary/5 animate-pulse">
              Syncing
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground max-w-[200px]">{description}</p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <RefreshCw className={cn("w-3 h-3", status === "syncing" && "animate-spin")} /> {lastSync}
          </span>
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3" /> {count} records
          </span>
        </div>
      </div>
    </div>
    <Switch defaultChecked={status !== "inactive"} />
  </div>
);

export default function SettingsPage() {
  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Signal className="w-8 h-8 text-primary" />
            Intelligence Sources
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage the global data streams powering your market analysis.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auction Houses */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-primary" />
                <CardTitle>Auction Houses</CardTitle>
              </div>
              <CardDescription>Realized prices from major global auctions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SourceCard 
                icon={Gavel}
                title="Christie's" 
                description="Rare watches & horological masterpieces"
                status="active"
                lastSync="2 mins ago"
                count={1420}
              />
              <SourceCard 
                icon={Gavel}
                title="Phillips" 
                description="Market-leading watch auctions"
                status="active"
                lastSync="5 mins ago"
                count={850}
              />
              <SourceCard 
                icon={Gavel}
                title="Sotheby's" 
                description="Global luxury watch auctions"
                status="syncing"
                lastSync="Syncing..."
                count={2100}
              />
            </CardContent>
          </Card>

          {/* Market Aggregators */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <CardTitle>Global Aggregators</CardTitle>
              </div>
              <CardDescription>Cross-market listings and trend data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SourceCard 
                icon={Globe}
                title="EveryWatch" 
                description="Comprehensive cross-platform monitoring"
                status="active"
                lastSync="Live Stream"
                count={15400}
              />
              <SourceCard 
                icon={Search}
                title="WatchCharts" 
                description="Historical price trends & market indices"
                status="active"
                lastSync="1 hour ago"
                count={5000}
              />
            </CardContent>
          </Card>

          {/* Dealer Networks */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                <CardTitle>Verified Dealers</CardTitle>
              </div>
              <CardDescription>Professional inventory from trusted sellers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SourceCard 
                icon={Store}
                title="Bob's Watches" 
                description="Pre-owned Rolex exchange data"
                status="active"
                lastSync="10 mins ago"
                count={320}
              />
              <SourceCard 
                icon={Store}
                title="Chrono24" 
                description="Professional dealer listings worldwide"
                status="active"
                lastSync="Live Stream"
                count={25000}
              />
              <SourceCard 
                icon={Store}
                title="Govberg / 1916" 
                description="Authorized dealer pre-owned inventory"
                status="inactive"
                lastSync="Disconnected"
                count={0}
              />
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                <CardTitle>System Status</CardTitle>
              </div>
              <CardDescription>Overall health of intelligence gathering</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background/50 rounded-lg border border-border/50 text-center">
                  <div className="text-2xl font-bold font-mono text-foreground">45,090</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total Data Points</div>
                </div>
                <div className="p-4 bg-background/50 rounded-lg border border-border/50 text-center">
                  <div className="text-2xl font-bold font-mono text-green-500">98.2%</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Source Uptime</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">API Quota Usage</span>
                  <span className="text-foreground">64%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[64%]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
