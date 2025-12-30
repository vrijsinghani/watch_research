/**
 * Gemini Deep Research Service for Watch Market Analysis
 * 
 * Port of the Python deep_research module to TypeScript.
 * Uses Google's Gemini Deep Research Agent for comprehensive web research.
 */

import { GoogleGenAI } from "@google/genai";
import { storage } from "../storage";
import type { InsertMarketDataPoint } from "@shared/schema";
import { parseResearchReport, extractMarketInsights } from "./research-parser.js";
import { qaValidateResults, cleanupResults } from "./research-qa.js";

const AGENT_NAME = "gemini-2.5-pro"; // Deep Research model
const DEFAULT_POLL_INTERVAL = 10000; // 10 seconds
const MAX_WAIT_TIME = 3600000; // 60 minutes

export interface ResearchProgress {
  status: "pending" | "researching" | "parsing" | "qa" | "cleanup" | "completed" | "failed";
  progress: number; // 0-100
  message: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface TokenUsage {
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface DeepResearchResult {
  interactionId: string;
  status: string;
  rawReport: string;
  extractedSales: InsertMarketDataPoint[];
  marketInsights: Record<string, any>;
  sourcesCited: string[];
  researchDurationSeconds: number;
  tokenUsage?: TokenUsage;
  qaReport?: QAReport;
}

export interface QAReport {
  passed: boolean;
  issues: string[];
  suggestions: string[];
  dataQualityScore: number; // 0-100
}

// In-memory progress tracking (in production, use Redis or DB)
const researchProgress = new Map<string, ResearchProgress>();

/**
 * Build the research prompt for watch market analysis
 */
function buildResearchPrompt(brand: string, reference: string): string {
  return `Research comprehensive watch sales and listing data for ${brand} ${reference}.

CRITICAL: Provide SPECIFIC, VERIFIABLE data with full provenance. Each data point must include:
- Exact date (e.g., "May 20, 2024", not just "2024")
- Source with specificity (e.g., "eBay (Sold Item)", "RolexForums (Private Sale)", "Phillips Geneva Watch Auction XIV")
- Listing ID, lot number, or reference where available
- Seller/dealer name when known
- Watch year/production date if mentioned
- Direct URL to source when possible

Your research should cover:

1. **Recent Sales Data**: Find actual COMPLETED sale prices from:
   - Auction houses (Christie's, Sotheby's, Phillips, Bonhams) - include lot numbers
   - Marketplaces (Chrono24, WatchBox, eBay) - include item IDs where possible
   - Collector forums (RolexForums, WatchUSeek, Omega Forums) - note as private sales
   - Dealers (Bob's Watches, Crown & Caliber, DavidSW)

2. **Current Market Listings**: Find CURRENT asking prices with listing details from active listings.

3. **Price Trends**: Detailed price history over 2021-2024 including peak and correction analysis.

4. **Condition Impact**: How does condition (BNIB, unworn, excellent, good, watch-only) affect pricing?

5. **Market Insights**: What factors drive demand? Recent events affecting prices?

Format the output as a comprehensive report with the following structure:

## Executive Summary
Detailed overview of current market status for ${brand} ${reference}. Include MSRP, typical market premium, and key takeaways.

## Completed Sales Table
| Date | Price (USD) | Condition | Source | Seller/Lot | Notes |
|------|-------------|-----------|--------|------------|-------|
(Include 10-15 ACTUAL COMPLETED sales with SPECIFIC dates like "May 20, 2024")
(Source column should be specific: "eBay (Sold Item)", "Phillips (Lot 123)", "RolexForums (Private Sale)")
(Include watch year in condition when known: "Pre-Owned, 2022")
(Notes should include key details: "Full set with box & papers", "Watch only", etc.)

## Current Listings Table  
| Date Listed | Asking Price (USD) | Condition | Source | Seller/ID | Notes |
|-------------|-------------------|-----------|--------|-----------|-------|
(Include 7-10 CURRENT asking prices with specific listing details)
(Include dealer/seller names: "DavidSW", "Bob's Watches", "Chrono24 ID: 12345678")

## Price Statistics
- **Official MSRP:** $X (current retail price)
- **Average Sold Price:** ~$X (specify timeframe)
- **Median Sold Price:** ~$X
- **Sold Price Range:** ~$X - $X
- **Average Asking Price:** ~$X
- **Asking Price Range:** ~$X - $X+
- **Recent Trend:** [Stable/Increasing/Decreasing] with context
- **Asking vs Sold Spread:** ~X% (what this means for negotiation)

## Condition-Based Pricing
| Condition | Typical Sold Range (USD) | Typical Asking Range (USD) | Notes |
|-----------|--------------------------|----------------------------|-------|
| BNIB / Unworn | $X - $X | $X - $X | Complete set, current warranty |
| Excellent / Mint | $X - $X | $X - $X | Light wear, full set |
| Very Good | $X - $X | $X - $X | Noticeable wear |
| Watch Only | $X - $X | $X - $X | Missing box/papers |

## Price Trends (2021-2024)
Provide a detailed narrative of price history including:
- Pre-boom prices (2020-2021)
- The peak period (Q1 2022) with specific price levels
- The correction period (2022-2023)
- Current stabilization (2024)
Include specific price points at key moments.

## Special Editions & Variants
List any variants with their relative pricing differences.

## Market Analysis
Provide 4-5 key factors driving the market:
1. Brand/heritage factors
2. Supply constraints
3. Design/wearability
4. Investment characteristics
5. Recent market dynamics

## Sources
List all sources used with URLs:
- [Source Name](URL) - Description of data obtained

CRITICAL REQUIREMENTS:
- Every sale/listing MUST have a specific date, not just a year
- Source names MUST be specific (include "Sold Item", "Private Sale", lot numbers, IDs)
- Include watch production year in condition field when available
- Preserve full detail in notes - don't summarize away important info
- Include URLs to sources in the Sources section`;
}

/**
 * Estimate token usage and cost
 */
function estimateTokenUsage(prompt: string, response: string): TokenUsage {
  // Rough estimate: ~4 chars per token
  const promptTokens = Math.ceil(prompt.length / 4);
  const responseTokens = Math.ceil(response.length / 4);
  const totalTokens = promptTokens + responseTokens;
  
  // Gemini Pro pricing (rough estimate)
  const inputCostPerMillion = 2.00;
  const outputCostPerMillion = 12.00;
  
  const estimatedCostUsd = 
    (promptTokens / 1_000_000) * inputCostPerMillion +
    (responseTokens / 1_000_000) * outputCostPerMillion;
  
  return {
    promptTokens,
    responseTokens,
    totalTokens,
    estimatedCostUsd: Math.round(estimatedCostUsd * 10000) / 10000
  };
}

/**
 * Update research progress
 */
function updateProgress(
  analysisId: string, 
  status: ResearchProgress["status"], 
  progress: number, 
  message: string
) {
  const existing = researchProgress.get(analysisId);
  researchProgress.set(analysisId, {
    status,
    progress,
    message,
    startedAt: existing?.startedAt || new Date(),
    completedAt: status === "completed" || status === "failed" ? new Date() : undefined
  });
}

/**
 * Get research progress
 */
export function getResearchProgress(analysisId: string): ResearchProgress | undefined {
  return researchProgress.get(analysisId);
}

/**
 * Main research function - executes the full pipeline
 */
export async function researchWatch(
  analysisId: string,
  brand: string,
  reference: string,
  apiKey: string
): Promise<DeepResearchResult> {
  const startTime = Date.now();
  updateProgress(analysisId, "researching", 10, "Initializing Chronos Research Engine...");

  const prompt = buildResearchPrompt(brand, reference);
  
  // Create research log entry
  const researchLog = await storage.createResearchLog({
    analysisId,
    status: "started",
    prompt,
  });

  try {
    // Initialize Gemini client
    const genai = new GoogleGenAI({ apiKey });
    
    updateProgress(analysisId, "researching", 20, "Gathering market intelligence...");

    // Execute research using Gemini
    // Note: The actual Deep Research API uses interactions.create() 
    // For now, we use generateContent as a fallback - can be upgraded when API is available
    const model = genai.models.generateContent({
      model: AGENT_NAME,
      contents: prompt,
    });

    const response = await model;
    const rawReport = response.text || "";
    
    updateProgress(analysisId, "parsing", 50, "Parsing research results...");

    // Parse the raw report into structured data
    const extractedSales = parseResearchReport(rawReport, brand, reference);
    const marketInsights = extractMarketInsights(rawReport);
    const sourcesCited = extractSourcesFromReport(rawReport);
    
    updateProgress(analysisId, "qa", 70, "Running QA validation...");

    // ============================================================
    // PLACEHOLDER: QA VALIDATION STEP
    // This is where you can call another Gemini model or custom logic
    // to validate the quality of the extracted data
    // ============================================================
    const qaReport = await qaValidateResults({
      rawReport,
      extractedSales,
      marketInsights,
      brand,
      reference,
      apiKey  // Can use for subsequent Gemini calls
    });

    updateProgress(analysisId, "cleanup", 85, "Cleaning up and refining data...");

    // ============================================================
    // PLACEHOLDER: CLEANUP/REFINEMENT STEP
    // This is where you can call Gemini to clean up or enrich the data
    // For example: normalize prices, fix dates, categorize conditions
    // ============================================================
    const cleanedSales = await cleanupResults({
      extractedSales,
      qaReport,
      apiKey
    });

    const duration = (Date.now() - startTime) / 1000;
    const tokenUsage = estimateTokenUsage(prompt, rawReport);

    updateProgress(analysisId, "completed", 100, "Research complete!");

    // Store results in database
    if (cleanedSales.length > 0) {
      const dataPointsWithAnalysisId: InsertMarketDataPoint[] = cleanedSales.map((sale) => ({
        ...sale,
        analysisId
      }));
      await storage.bulkCreateMarketDataPoints(dataPointsWithAnalysisId);
    }

    // Calculate market price from actual sold transactions
    const soldPrices = cleanedSales
      .filter(sale => sale.priceType === "Sold" && sale.price > 0)
      .map(sale => sale.price);
    const calculatedMarketPrice = soldPrices.length > 0 
      ? Math.round(soldPrices.reduce((a, b) => a + b, 0) / soldPrices.length) 
      : (marketInsights.averageSoldPrice || marketInsights.priceStatistics?.avgSoldPrice || null);

    // Update the analysis with comprehensive insights
    await storage.updateWatchAnalysis(analysisId, {
      executiveSummary: marketInsights.executiveSummary || rawReport.split("##")[1]?.substring(0, 500),
      confidenceScore: qaReport.dataQualityScore,
      analystConsensus: marketInsights.trend === "increasing" ? "BUY" : 
                        marketInsights.trend === "decreasing" ? "SELL" : "HOLD",
      marketPrice: calculatedMarketPrice,
      volatility: marketInsights.volatility || "Medium",
      // Store structured insights as JSON
      priceStatistics: marketInsights.priceStatistics || null,
      conditionPricing: marketInsights.conditionPricing || null,
      priceTrends: marketInsights.priceTrends || null,
      marketAnalysis: marketInsights.marketAnalysis || null,
      specialEditions: marketInsights.specialEditions || null,
      sources: marketInsights.sources || null,
    });

    // Update research log with results
    await storage.updateResearchLog(researchLog.id, {
      status: "completed",
      rawResponse: rawReport.substring(0, 100000), // Limit size
      extractedCount: cleanedSales.length,
      durationSeconds: duration,
      completedAt: new Date(),
    });

    return {
      interactionId: `research-${analysisId}-${Date.now()}`,
      status: "completed",
      rawReport,
      extractedSales: cleanedSales,
      marketInsights,
      sourcesCited,
      researchDurationSeconds: duration,
      tokenUsage,
      qaReport
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    updateProgress(analysisId, "failed", 0, `Research failed: ${errorMessage}`);
    
    // Update research log with error
    await storage.updateResearchLog(researchLog.id, {
      status: "failed",
      errorMessage,
      durationSeconds: (Date.now() - startTime) / 1000,
      completedAt: new Date(),
    });
    
    throw error;
  }
}

/**
 * Extract source URLs from the research report
 */
function extractSourcesFromReport(report: string): string[] {
  const sources: string[] = [];
  
  // Extract URLs
  const urlPattern = /https?:\/\/[^\s\)]+/g;
  const urls = report.match(urlPattern) || [];
  sources.push(...urls);
  
  // Extract source names from Sources section
  const sourcesSection = report.split("## Sources")[1];
  if (sourcesSection) {
    const lines = sourcesSection.split("\n").filter(line => line.trim());
    for (const line of lines.slice(0, 20)) { // Limit to first 20
      if (line.includes("http")) {
        const url = line.match(/https?:\/\/[^\s\)]+/)?.[0];
        if (url && !sources.includes(url)) {
          sources.push(url);
        }
      } else if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
        sources.push(line.replace(/^[-*]\s*/, "").trim());
      }
    }
  }
  
  return Array.from(new Set(sources)); // Deduplicate
}
