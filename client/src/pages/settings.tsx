import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, 
  Gavel, 
  Store, 
  CheckCircle2, 
  RefreshCw, 
  Database,
  Signal,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getDataSources, toggleDataSource } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

const SourceCard = ({ 
  id,
  icon: Icon, 
  title, 
  description, 
  status = "active", 
  lastSync,
  count = 0,
  isEnabled,
  onToggle
}: { 
  id: string,
  icon: any, 
  title: string, 
  description: string, 
  status?: string,
  lastSync?: Date | null,
  count?: number,
  isEnabled: boolean,
  onToggle: (id: string, enabled: boolean) => void
}) => (
  <div className="flex items-start justify-between p-4 bg-secondary/20 hover:bg-secondary/40 border border-border/50 rounded-lg transition-all duration-200 group">
    <div className="flex gap-4">
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
        status === "active" && isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-foreground">{title}</h3>
          {status === "active" && isEnabled && (
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
            <RefreshCw className={cn("w-3 h-3", status === "syncing" && "animate-spin")} /> 
            {lastSync ? formatDistanceToNow(new Date(lastSync), { addSuffix: true }) : "Never"}
          </span>
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3" /> {count.toLocaleString()} records
          </span>
        </div>
      </div>
    </div>
    <Switch checked={isEnabled} onCheckedChange={(checked) => onToggle(id, checked)} />
  </div>
);

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: dataSources, isLoading } = useQuery({
    queryKey: ["dataSources"],
    queryFn: getDataSources,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) => 
      toggleDataSource(id, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataSources"] });
    },
  });

  const handleToggle = (id: string, isEnabled: boolean) => {
    toggleMutation.mutate({ id, isEnabled });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const auctionSources = dataSources?.filter(s => s.type === "Auction") || [];
  const marketplaceSources = dataSources?.filter(s => s.type === "Marketplace") || [];
  const dealerSources = dataSources?.filter(s => s.type === "Dealer") || [];

  const totalRecords = dataSources?.reduce((sum, s) => sum + (s.recordCount || 0), 0) || 0;
  const activeSources = dataSources?.filter(s => s.isEnabled && s.status === "active").length || 0;
  const totalSources = dataSources?.length || 1;
  const uptime = Math.round((activeSources / totalSources) * 100);

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
              {auctionSources.map(source => (
                <SourceCard 
                  key={source.id}
                  id={source.id}
                  icon={Gavel}
                  title={source.name}
                  description={source.description || ""}
                  status={source.status}
                  lastSync={source.lastSyncAt}
                  count={source.recordCount || 0}
                  isEnabled={source.isEnabled}
                  onToggle={handleToggle}
                />
              ))}
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
              {marketplaceSources.map(source => (
                <SourceCard 
                  key={source.id}
                  id={source.id}
                  icon={Globe}
                  title={source.name}
                  description={source.description || ""}
                  status={source.status}
                  lastSync={source.lastSyncAt}
                  count={source.recordCount || 0}
                  isEnabled={source.isEnabled}
                  onToggle={handleToggle}
                />
              ))}
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
              {dealerSources.map(source => (
                <SourceCard 
                  key={source.id}
                  id={source.id}
                  icon={Store}
                  title={source.name}
                  description={source.description || ""}
                  status={source.status}
                  lastSync={source.lastSyncAt}
                  count={source.recordCount || 0}
                  isEnabled={source.isEnabled}
                  onToggle={handleToggle}
                />
              ))}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <CardTitle>System Status</CardTitle>
              </div>
              <CardDescription>Overall health of intelligence gathering</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background/50 rounded-lg border border-border/50 text-center">
                  <div className="text-2xl font-bold font-mono text-foreground">
                    {totalRecords.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                    Total Data Points
                  </div>
                </div>
                <div className="p-4 bg-background/50 rounded-lg border border-border/50 text-center">
                  <div className="text-2xl font-bold font-mono text-green-500">
                    {uptime}%
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                    Source Uptime
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Sources</span>
                  <span className="text-foreground">{activeSources}/{totalSources}</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${uptime}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
