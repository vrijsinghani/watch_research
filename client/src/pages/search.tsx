import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@assets/generated_images/macro_mechanical_watch_movement_gears_dark_luxury.png";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [_, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setIsSearching(true);
    // Simulate API delay for dramatic effect
    setTimeout(() => {
      setLocation("/dashboard");
    }, 1500);
  };

  return (
    <Layout>
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Background with Overlay */}
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
            className="flex flex-col md:flex-row gap-3 w-full max-w-lg mx-auto bg-card/50 backdrop-blur-md p-2 rounded-lg border border-white/10 shadow-2xl"
          >
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                className="pl-10 h-12 bg-transparent border-transparent focus-visible:ring-0 text-lg placeholder:text-muted-foreground/70"
                placeholder="Enter Brand & Reference (e.g. Rolex 116500LN)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button 
              size="lg" 
              className="h-12 px-8 font-medium text-base shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] transition-shadow duration-300"
              disabled={isSearching}
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze"}
            </Button>
          </motion.form>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground"
          >
            <span>Popular:</span>
            <button className="hover:text-primary transition-colors">Rolex Submariner</button>
            <span className="text-white/20">•</span>
            <button className="hover:text-primary transition-colors">Patek Philippe Nautilus</button>
            <span className="text-white/20">•</span>
            <button className="hover:text-primary transition-colors">AP Royal Oak</button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
