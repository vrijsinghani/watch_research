/**
 * Research QA and Cleanup Service
 * 
 * Placeholder hooks for validating and refining research results.
 * These can be enhanced with additional Gemini calls or custom logic.
 */

import type { InsertMarketDataPoint } from "@shared/schema";
import type { QAReport } from "./deep-research";

interface QAValidateParams {
  rawReport: string;
  extractedSales: Omit<InsertMarketDataPoint, "analysisId">[];
  marketInsights: Record<string, any>;
  brand: string;
  reference: string;
  apiKey: string;
}

interface CleanupParams {
  extractedSales: Omit<InsertMarketDataPoint, "analysisId">[];
  qaReport: QAReport;
  apiKey: string;
}

/**
 * PLACEHOLDER: QA Validation Step
 * 
 * This function validates the quality of extracted research data.
 * 
 * Current implementation: Basic heuristic checks
 * 
 * Future enhancements:
 * - Call Gemini to verify data consistency
 * - Cross-reference prices against known market ranges
 * - Validate source authenticity
 * - Check for duplicate or conflicting data
 */
export async function qaValidateResults(params: QAValidateParams): Promise<QAReport> {
  const { rawReport, extractedSales, marketInsights, brand, reference, apiKey } = params;
  
  const issues: string[] = [];
  const suggestions: string[] = [];
  let dataQualityScore = 100;

  // ============================================================
  // BASIC HEURISTIC CHECKS
  // ============================================================

  // Check 1: Minimum data points
  if (extractedSales.length < 5) {
    issues.push(`Low data volume: Only ${extractedSales.length} sales found`);
    dataQualityScore -= 20;
    suggestions.push("Consider running additional research with broader search terms");
  }

  // Check 2: Price reasonableness (basic sanity check)
  const prices = extractedSales.map(s => s.price);
  if (prices.length > 0) {
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const outliers = prices.filter(p => p > avgPrice * 3 || p < avgPrice / 3);
    if (outliers.length > prices.length * 0.2) {
      issues.push(`${outliers.length} potential price outliers detected`);
      dataQualityScore -= 10;
      suggestions.push("Review outlier prices for data entry errors");
    }
  }

  // Check 3: Source diversity
  const sources = new Set(extractedSales.map(s => s.source));
  if (sources.size < 3) {
    issues.push(`Limited source diversity: Only ${sources.size} unique sources`);
    dataQualityScore -= 15;
    suggestions.push("Research may benefit from additional marketplace data");
  }

  // Check 4: Balance between sold and asking
  const soldCount = extractedSales.filter(s => s.priceType === "Sold").length;
  const askingCount = extractedSales.filter(s => s.priceType === "Asking").length;
  if (soldCount === 0) {
    issues.push("No completed sales found - only asking prices");
    dataQualityScore -= 25;
    suggestions.push("Actual transaction data is critical for accurate valuation");
  } else if (askingCount === 0) {
    issues.push("No current listings found - only historical sales");
    dataQualityScore -= 10;
    suggestions.push("Current market sentiment may be missing");
  }

  // Check 5: Report completeness
  const hasExecutiveSummary = rawReport.includes("## Executive Summary");
  const hasPriceStats = rawReport.includes("## Price Statistics");
  const hasMarketAnalysis = rawReport.includes("## Market Analysis");
  
  if (!hasExecutiveSummary || !hasPriceStats) {
    issues.push("Report structure incomplete");
    dataQualityScore -= 10;
  }

  // ============================================================
  // PLACEHOLDER: GEMINI-BASED VALIDATION
  // Uncomment and implement when ready to use Gemini for QA
  // ============================================================
  /*
  const { GoogleGenAI } = await import("@google/genai");
  const genai = new GoogleGenAI({ apiKey });
  
  const qaPrompt = `
  You are a watch market data quality analyst. Review the following extracted data 
  for ${brand} ${reference} and identify any issues:
  
  Data Points: ${JSON.stringify(extractedSales.slice(0, 10), null, 2)}
  
  Market Insights: ${JSON.stringify(marketInsights, null, 2)}
  
  Check for:
  1. Price anomalies or suspicious values
  2. Inconsistent condition descriptions
  3. Missing or invalid sources
  4. Data that seems fabricated
  
  Respond with JSON: { "issues": [], "suggestions": [], "score": 0-100 }
  `;
  
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: qaPrompt
  });
  
  // Parse and merge Gemini's QA findings
  try {
    const qaResult = JSON.parse(response.text || "{}");
    issues.push(...(qaResult.issues || []));
    suggestions.push(...(qaResult.suggestions || []));
    dataQualityScore = Math.min(dataQualityScore, qaResult.score || 100);
  } catch (e) {
    console.warn("Could not parse Gemini QA response");
  }
  */

  // Ensure score is in valid range
  dataQualityScore = Math.max(0, Math.min(100, dataQualityScore));

  return {
    passed: dataQualityScore >= 60,
    issues,
    suggestions,
    dataQualityScore
  };
}

/**
 * PLACEHOLDER: Cleanup and Refinement Step
 * 
 * This function cleans up and enriches the extracted data.
 * 
 * Current implementation: Basic normalization
 * 
 * Future enhancements:
 * - Call Gemini to normalize condition descriptions
 * - Validate and standardize source names
 * - Currency conversion for non-USD prices
 * - Deduplicate similar listings
 * - Enrich with additional metadata
 */
export async function cleanupResults(params: CleanupParams): Promise<Omit<InsertMarketDataPoint, "analysisId">[]> {
  const { extractedSales, qaReport, apiKey } = params;
  
  // Start with a copy of the original data
  let cleanedSales = [...extractedSales];

  // ============================================================
  // BASIC CLEANUP OPERATIONS
  // ============================================================

  // Cleanup 1: Remove obvious duplicates (same price, source, condition)
  const seen = new Set<string>();
  cleanedSales = cleanedSales.filter(sale => {
    const key = `${sale.price}-${sale.source}-${sale.condition}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  // Cleanup 2: Normalize condition strings
  cleanedSales = cleanedSales.map(sale => ({
    ...sale,
    condition: normalizeCondition(sale.condition || "")
  }));

  // Cleanup 3: Remove extreme outliers (> 5x or < 0.2x median)
  if (cleanedSales.length >= 5) {
    const prices = cleanedSales.map(s => s.price).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    const lowerBound = median * 0.2;
    const upperBound = median * 5;
    
    const beforeCount = cleanedSales.length;
    cleanedSales = cleanedSales.filter(s => s.price >= lowerBound && s.price <= upperBound);
    
    if (cleanedSales.length < beforeCount) {
      console.log(`Removed ${beforeCount - cleanedSales.length} outliers`);
    }
  }

  // Cleanup 4: Standardize source names
  cleanedSales = cleanedSales.map(sale => ({
    ...sale,
    source: normalizeSourceName(sale.source)
  }));

  // ============================================================
  // PLACEHOLDER: GEMINI-BASED CLEANUP
  // Uncomment and implement when ready
  // ============================================================
  /*
  const { GoogleGenAI } = await import("@google/genai");
  const genai = new GoogleGenAI({ apiKey });
  
  // Example: Use Gemini to enrich condition descriptions
  const enrichPrompt = `
  For each of these watch sales, provide a standardized condition category 
  and confidence score. Categories: BNIB, Unworn, Excellent, Good, Fair, Poor
  
  Sales: ${JSON.stringify(cleanedSales.map(s => ({ 
    condition: s.condition, 
    description: s.description 
  })))}
  
  Respond with JSON array: [{ "index": 0, "standardCondition": "...", "confidence": 0.95 }, ...]
  `;
  
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: enrichPrompt
  });
  
  try {
    const enriched = JSON.parse(response.text || "[]");
    for (const item of enriched) {
      if (cleanedSales[item.index]) {
        cleanedSales[item.index].condition = item.standardCondition;
      }
    }
  } catch (e) {
    console.warn("Could not parse Gemini enrichment response");
  }
  */

  console.log(`Cleanup complete: ${extractedSales.length} → ${cleanedSales.length} records`);
  return cleanedSales;
}

/**
 * Normalize condition string to standard format
 */
function normalizeCondition(condition: string): string {
  const lower = condition.toLowerCase().trim();
  
  // Map common variations to standard terms
  const mappings: Record<string, string> = {
    "brand new": "New/Unworn",
    "bnib": "New/Unworn",
    "new in box": "New/Unworn",
    "unworn": "New/Unworn",
    "never worn": "New/Unworn",
    "mint": "Pre-Owned (Mint)",
    "excellent": "Pre-Owned (Excellent)",
    "very good": "Pre-Owned (Very Good)",
    "good": "Pre-Owned (Good)",
    "fair": "Pre-Owned (Fair)",
    "poor": "Pre-Owned (Poor)",
    "pre-owned": "Pre-Owned",
    "preowned": "Pre-Owned",
    "used": "Pre-Owned"
  };

  for (const [key, value] of Object.entries(mappings)) {
    if (lower.includes(key)) {
      return value;
    }
  }

  // Return original if no mapping found
  return condition || "Unknown";
}

/**
 * Normalize source names
 */
function normalizeSourceName(source: string): string {
  const lower = source.toLowerCase().trim();
  
  const mappings: Record<string, string> = {
    "chrono24": "Chrono24",
    "christies": "Christie's",
    "christie's": "Christie's",
    "sothebys": "Sotheby's",
    "sotheby's": "Sotheby's",
    "phillips": "Phillips",
    "bobs watches": "Bob's Watches",
    "bob's watches": "Bob's Watches",
    "watchbox": "WatchBox",
    "hodinkee": "Hodinkee",
    "ebay": "eBay",
    "everywatch": "EveryWatch"
  };

  for (const [key, value] of Object.entries(mappings)) {
    if (lower.includes(key)) {
      return value;
    }
  }

  return source;
}
