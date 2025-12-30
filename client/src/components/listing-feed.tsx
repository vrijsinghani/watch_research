import { ExternalLink, ShieldCheck, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const listings = [
  {
    id: 1,
    source: "Chrono24",
    price: 45500,
    condition: "New/Unworn",
    location: "United States",
    seller: "Professional Dealer",
    date: "2 days ago",
    verified: true,
  },
  {
    id: 2,
    source: "Bob's Watches",
    price: 44900,
    condition: "Pre-owned (Mint)",
    location: "United States",
    seller: "Bob's Watches",
    date: "1 week ago",
    verified: true,
  },
  {
    id: 3,
    source: "Chrono24",
    price: 46200,
    condition: "New/Unworn",
    location: "Japan",
    seller: "Private Seller",
    date: "Just now",
    verified: false,
  },
  {
    id: 4,
    source: "EveryWatch",
    price: 43800,
    condition: "Pre-owned (Good)",
    location: "Germany",
    seller: "Professional Dealer",
    date: "3 days ago",
    verified: true,
  },
  {
    id: 5,
    source: "Chrono24",
    price: 45000,
    condition: "New/Unworn",
    location: "UAE",
    seller: "Professional Dealer",
    date: "5 days ago",
    verified: true,
  },
];

export function ListingFeed() {
  return (
    <Card className="bg-card border-border/50 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-display tracking-wide text-lg flex items-center justify-between">
          <span>Live Market Listings</span>
          <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-border">
            15 Active Found
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-border/50">
            {listings.map((listing) => (
              <div key={listing.id} className="p-4 hover:bg-secondary/30 transition-colors group cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">${listing.price.toLocaleString()}</span>
                    {listing.verified && (
                      <ShieldCheck className="w-3 h-3 text-primary" />
                    )}
                  </div>
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-medium bg-secondary text-secondary-foreground">
                    {listing.source}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span className={listing.condition.includes("New") ? "text-green-400" : "text-amber-400"}>
                    {listing.condition}
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <MapPin className="w-3 h-3" /> {listing.location}
                  </span>
                </div>
                
                <div className="mt-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-muted-foreground">{listing.seller}</span>
                  <ExternalLink className="w-3 h-3 text-primary" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
