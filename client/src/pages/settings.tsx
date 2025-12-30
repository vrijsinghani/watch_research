import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles } from "lucide-react";

export default function SettingsPage() {
  return (
    <Layout>
      <div className="p-8 max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        
        <div className="space-y-6">
          {/* New AI Agents Section */}
          <Card className="border-primary/20 bg-primary/5 shadow-[0_0_20px_rgba(234,179,8,0.05)]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <CardTitle className="text-primary">AI Research Agents</CardTitle>
              </div>
              <CardDescription>Configure autonomous agents for deep market analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-base">Deep Research Agent</Label>
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">Beta</span>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-[300px]">
                    Autonomous agent that scrapes forums, auction results, and grey market dealers for hidden price signals.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                <div className="space-y-0.5">
                   <div className="flex items-center gap-2">
                    <Label className="text-base">Sentiment Analysis Agent</Label>
                    <Sparkles className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Analyzes social media and forum sentiment trends (Coming Soon).
                  </p>
                </div>
                <Switch disabled />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Standard Data Sources</CardTitle>
              <CardDescription>Configure which marketplaces to include in analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Chrono24</Label>
                  <p className="text-xs text-muted-foreground">Global marketplace listings</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Bob's Watches</Label>
                  <p className="text-xs text-muted-foreground">Dealer inventory & buy prices</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>WatchCharts</Label>
                  <p className="text-xs text-muted-foreground">Historical market data</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Analysis Preferences</CardTitle>
              <CardDescription>Customize your default parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exclude Private Sellers</Label>
                  <p className="text-xs text-muted-foreground">Only show professional dealer listings</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Always use dark theme</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
