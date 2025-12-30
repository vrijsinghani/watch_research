import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <Layout>
      <div className="p-8 max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Data Sources</CardTitle>
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
