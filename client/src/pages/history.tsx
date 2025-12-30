import Layout from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock } from "lucide-react";
import { Link } from "wouter";

const historyItems = [
  { id: 1, model: "Rolex Daytona 116500LN", date: "2 hours ago", status: "Complete" },
  { id: 2, model: "Patek Philippe Nautilus 5711", date: "Yesterday", status: "Complete" },
  { id: 3, model: "Audemars Piguet Royal Oak 15500ST", date: "Dec 28, 2025", status: "Saved" },
  { id: 4, model: "Omega Speedmaster 311.30.42", date: "Dec 25, 2025", status: "Complete" },
];

export default function HistoryPage() {
  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-display font-bold mb-8">Analysis History</h1>
        
        <div className="grid gap-4">
          {historyItems.map((item) => (
            <Link key={item.id} href="/dashboard">
              <Card className="hover:bg-accent/5 transition-colors cursor-pointer border-border/50">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{item.model}</h3>
                      <p className="text-sm text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="bg-secondary/50">{item.status}</Badge>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}
