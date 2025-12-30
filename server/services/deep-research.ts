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

Your research should cover:

1. **Recent Sales Data**: Find actual COMPLETED sale prices from auction houses (Christie's, Sotheby's, Phillips),
   marketplaces (Chrono24, WatchBox, Hodinkee Shop), and collector forums.

2. **Current Market Listings**: Find CURRENT asking prices from active listings on Chrono24, WatchBox,
   eBay, dealer websites, and other marketplaces.

3. **Price Trends**: How have prices changed over the past 1-3 years?

4. **Condition Impact**: How does condition (BNIB, unworn, lightly worn, etc.) affect pricing?

5. **Special Editions**: Are there special/limited edition variants? How do they compare in value?

6. **Market Insights**: What factors drive demand? Any notable recent events affecting prices?

Format the output as a comprehensive report with the following structure:

## Executive Summary
Brief overview of current market status for ${brand} ${reference}

## Completed Sales Table
| Date | Price (USD) | Condition | Source | Notes |
|------|-------------|-----------|--------|-------|
(Include as many ACTUAL COMPLETED sales as you can find with dates)

## Current Listings Table  
| Date Listed | Asking Price (USD) | Condition | Source | Notes |
|-------------|-------------------|-----------|--------|-------|
(Include CURRENT asking prices from active listings)

## Price Statistics
- Average Sold Price: $X
- Median Sold Price: $X
- Sold Price Range: $X - $X
- Average Asking Price: $X
- Asking Price Range: $X - $X
- Recent trend: increasing/stable/decreasing
- Asking vs Sold Spread: X%

## Condition-Based Pricing
| Condition | Typical Sold Range | Typical Asking Range |
|-----------|-------------------|---------------------|

## Special Editions & Variants
List any special editions with pricing differences

## Market Analysis
Key insights about supply, demand, and market dynamics.

## Sources
List all sources used with URLs where available

IMPORTANT: Clearly distinguish between COMPLETED SALES (actual transactions) and ASKING PRICES (current listings).
Prioritize recent data (last 12-18 months) but include historical data for trend analysis.`;
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
  updateProgress(analysisId, "researching", 10, "Initializing Gemini Deep Research...");

  try {
    // Initialize Gemini client
    const genai = new GoogleGenAI({ apiKey });
    
    const prompt = buildResearchPrompt(brand, reference);
    updateProgress(analysisId, "researching", 20, "Sending research request to Gemini...");

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
      const dataPointsWithAnalysisId = cleanedSales.map((sale: Omit<InsertMarketDataPoint, "analysisId">) => ({
        ...sale,
        analysisId
      }));
      await storage.bulkCreateMarketDataPoints(dataPointsWithAnalysisId);
    }

    // Update the analysis with insights
    await storage.updateWatchAnalysis(analysisId, {
      executiveSummary: marketInsights.executiveSummary || rawReport.split("##")[1]?.substring(0, 500),
      confidenceScore: qaReport.dataQualityScore,
      analystConsensus: marketInsights.trend === "increasing" ? "BUY" : 
                        marketInsights.trend === "decreasing" ? "SELL" : "HOLD",
      marketPrice: marketInsights.averageSoldPrice,
      volatility: marketInsights.volatility || "Medium"
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
