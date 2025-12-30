import type { WatchAnalysis, MarketDataPoint, DataSource, InsertWatchAnalysis } from "@shared/schema";

// Watch Analyses API
export async function getAnalyses(): Promise<WatchAnalysis[]> {
  const response = await fetch("/api/analyses");
  if (!response.ok) throw new Error("Failed to fetch analyses");
  return response.json();
}

// Create a new watch analysis
export async function createAnalysis(data: InsertWatchAnalysis): Promise<WatchAnalysis> {
  const response = await fetch("/api/analyses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to create analysis");
  return response.json();
}

// Trigger deep research for an analysis
export async function triggerResearch(analysisId: string): Promise<{ message: string; analysisId: string }> {
  const response = await fetch(`/api/analyses/${analysisId}/research`, {
    method: "POST",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to start research");
  }
  return response.json();
}

// Get research progress
export interface ResearchProgress {
  status: "not_started" | "pending" | "researching" | "parsing" | "qa" | "cleanup" | "completed" | "failed";
  progress: number;
  message: string;
  startedAt?: string;
  completedAt?: string;
}

export async function getResearchProgress(analysisId: string): Promise<ResearchProgress> {
  const response = await fetch(`/api/analyses/${analysisId}/research/progress`);
  if (!response.ok) throw new Error("Failed to get research progress");
  return response.json();
}

// Parse a search query into brand/model/reference
export function parseWatchQuery(query: string): { brand: string; model: string; reference: string } {
  const trimmed = query.trim();
  
  const knownBrands = [
    "Rolex", "Patek Philippe", "Audemars Piguet", "AP", "Omega", "Tudor", 
    "Cartier", "IWC", "Jaeger-LeCoultre", "JLC", "Vacheron Constantin", 
    "A. Lange & Söhne", "Lange", "Panerai", "Breitling", "TAG Heuer"
  ];
  
  let brand = "";
  let remaining = trimmed;
  
  for (const b of knownBrands) {
    if (trimmed.toLowerCase().startsWith(b.toLowerCase())) {
      brand = b === "AP" ? "Audemars Piguet" : b === "JLC" ? "Jaeger-LeCoultre" : b;
      remaining = trimmed.substring(b.length).trim();
      break;
    }
  }
  
  if (!brand) {
    const parts = trimmed.split(" ");
    brand = parts[0];
    remaining = parts.slice(1).join(" ");
  }
  
  const refMatch = remaining.match(/(?:ref\.?\s*)?(\d{4,}[A-Za-z]*)/i);
  const reference = refMatch ? refMatch[1] : "";
  
  let model = remaining.replace(/(?:ref\.?\s*)?\d{4,}[A-Za-z]*/gi, "").trim();
  if (!model) {
    model = reference ? "Unknown Model" : remaining || "Unknown";
  }
  
  return { brand, model, reference: reference || "N/A" };
}

export async function getAnalysis(id: string): Promise<WatchAnalysis> {
  const response = await fetch(`/api/analyses/${id}`);
  if (!response.ok) throw new Error("Failed to fetch analysis");
  return response.json();
}

export async function getMarketDataPoints(analysisId: string): Promise<MarketDataPoint[]> {
  const response = await fetch(`/api/analyses/${analysisId}/data-points`);
  if (!response.ok) throw new Error("Failed to fetch market data");
  return response.json();
}

// Data Sources API
export async function getDataSources(): Promise<DataSource[]> {
  const response = await fetch("/api/data-sources");
  if (!response.ok) throw new Error("Failed to fetch data sources");
  return response.json();
}

export async function toggleDataSource(id: string, isEnabled: boolean): Promise<DataSource> {
  const response = await fetch(`/api/data-sources/${id}/toggle`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isEnabled }),
  });
  if (!response.ok) throw new Error("Failed to toggle data source");
  return response.json();
}

// Seed database with initial data
export async function seedDatabase(): Promise<{ message: string; analysisId: string }> {
  const response = await fetch("/api/seed", {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to seed database");
  return response.json();
}

// Research Logs API
export interface ResearchLog {
  id: string;
  analysisId: string;
  status: string;
  prompt: string;
  rawResponse: string | null;
  extractedCount: number | null;
  durationSeconds: number | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export async function getResearchLogs(): Promise<ResearchLog[]> {
  const response = await fetch("/api/research-logs");
  if (!response.ok) throw new Error("Failed to fetch research logs");
  return response.json();
}
