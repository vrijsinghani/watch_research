import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, Loader2, Activity, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { createAnalysis, triggerResearch, parseWatchQuery } from "@/lib/api";
import heroImage from "@assets/generated_images/macro_mechanical_watch_movement_gears_dark_luxury.png";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [status, setStatus] = useState("");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    try {
      setStatus("Parsing watch details...");
      const { brand, model, reference } = parseWatchQuery(query);
      
      setStatus("Creating analysis record...");
      const analysis = await createAnalysis({
        brand,
        model,
        reference,
        description: query,
      });
      
      setStatus("Initiating Chronos Research...");
      await triggerResearch(analysis.id);
      
      toast({
        title: "Research Started",
        description: `Analyzing ${brand} ${model}. This may take 2-10 minutes.`,
      });
      
      setLocation(`/dashboard/${analysis.id}`);
      
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Research Failed",
        description: error instanceof Error ? error.message : "Failed to start research",
        variant: "destructive",
      });
      setIsSearching(false);
      setStatus("");
    }
  };

  const handleQuickSearch = (watchQuery: string) => {
    setQuery(watchQuery);
  };

  return (
    <Layout>
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Mechanical Watch Movement" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/40" />
        </div>

        <div className="relative z-10 w-full max-w-2xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-white mb-4">
              Market Intelligence
              <span className="block text-primary mt-2">Redefined.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Professional-grade analysis for the world's most prestigious timepieces. 
              Track prices, volatility, and liquidity in real-time.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            onSubmit={handleSearch}
            className="flex flex-col gap-3 w-full max-w-lg mx-auto"
          >
            <div className="flex flex-col md:flex-row gap-3 bg-card/50 backdrop-blur-md p-2 rounded-lg border border-white/10 shadow-2xl">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  data-testid="input-search"
                  className="pl-10 h-12 bg-transparent border-transparent focus-visible:ring-0 text-lg placeholder:text-muted-foreground/70"
                  placeholder="Enter Brand & Reference (e.g. Rolex 116500LN)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isSearching}
                />
              </div>
              <Button 
                data-testid="button-analyze"
                size="lg" 
                className="h-12 px-8 font-medium text-base shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-shadow duration-300"
                disabled={isSearching || !query.trim()}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    <span className="hidden md:inline">Researching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
            
            {isSearching && status && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-sm text-primary"
              >
                <Activity className="w-4 h-4 animate-pulse" />
                <span>{status}</span>
              </motion.div>
            )}
          </motion.form>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground"
          >
            <span>Popular:</span>
            <button 
              data-testid="quick-search-submariner"
              onClick={() => handleQuickSearch("Rolex Submariner Date 16610")}
              className="hover:text-primary transition-colors"
              disabled={isSearching}
            >
              Rolex Submariner
            </button>
            <span className="text-white/20">•</span>
            <button 
              data-testid="quick-search-nautilus"
              onClick={() => handleQuickSearch("Patek Philippe Nautilus 5711/1A")}
              className="hover:text-primary transition-colors"
              disabled={isSearching}
            >
              Patek Philippe Nautilus
            </button>
            <span className="text-white/20">•</span>
            <button 
              data-testid="quick-search-royal-oak"
              onClick={() => handleQuickSearch("Audemars Piguet Royal Oak 15500ST")}
              className="hover:text-primary transition-colors"
              disabled={isSearching}
            >
              AP Royal Oak
            </button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg max-w-md mx-auto"
          >
            <div className="flex items-start gap-3">
              <Activity className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-left text-sm">
                <p className="font-medium text-foreground">Chronos Deep Research</p>
                <p className="text-muted-foreground mt-1">
                  Our research engine searches auction houses, marketplaces, and dealers to compile comprehensive market intelligence in 2-10 minutes.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
