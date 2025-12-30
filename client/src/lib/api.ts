import type { WatchAnalysis, MarketDataPoint, DataSource } from "@shared/schema";

// Watch Analyses API
export async function getAnalyses(): Promise<WatchAnalysis[]> {
  const response = await fetch("/api/analyses");
  if (!response.ok) throw new Error("Failed to fetch analyses");
  return response.json();
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
