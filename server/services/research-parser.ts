/**
 * Research Report Parser
 * 
 * Extracts structured data from Gemini Deep Research markdown reports.
 */

import type { InsertMarketDataPoint } from "@shared/schema";

/**
 * Parse a research report and extract market data points
 */
export function parseResearchReport(
  report: string,
  brand: string,
  reference: string
): Omit<InsertMarketDataPoint, "analysisId">[] {
  const allRecords: Omit<InsertMarketDataPoint, "analysisId">[] = [];

  // Split report into sections
  const sections = report.split("##");

  for (const section of sections) {
    const sectionLower = section.toLowerCase();

    // Determine price type based on section header
    let priceType: "Sold" | "Asking" | "Unknown" = "Unknown";
    if (
      sectionLower.includes("completed sale") ||
      sectionLower.includes("sales data") ||
      sectionLower.includes("sold") ||
      sectionLower.includes("auction result")
    ) {
      priceType = "Sold";
    } else if (
      sectionLower.includes("current listing") ||
      sectionLower.includes("asking price") ||
      sectionLower.includes("active listing") ||
      sectionLower.includes("for sale")
    ) {
      priceType = "Asking";
    }

    // Extract table rows using regex
    const tablePattern = /\|[^\n]+\|/g;
    const tableRows = section.match(tablePattern) || [];

    for (const row of tableRows) {
      // Skip header/separator rows
      if (row.includes("---") || row.includes("Date") && row.includes("Price")) {
        continue;
      }

      const cells = row
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      if (cells.length >= 4) {
        const record = parseTableRow(cells, brand, reference, priceType);
        if (record) {
          allRecords.push(record);
        }
      }
    }
  }

  console.log(
    `Extracted ${allRecords.length} records from Deep Research report ` +
    `(${allRecords.filter(r => r.priceType === "Sold").length} sold, ` +
    `${allRecords.filter(r => r.priceType === "Asking").length} asking)`
  );

  return allRecords;
}

/**
 * Parse a single table row into a market data point
 */
function parseTableRow(
  cells: string[],
  brand: string,
  reference: string,
  priceType: "Sold" | "Asking" | "Unknown"
): Omit<InsertMarketDataPoint, "analysisId"> | null {
  try {
    // Expected format: Date, Price, Condition, Source, Notes
    const dateStr = cells[0] || "";
    const priceStr = cells[1] || "";
    const condition = cells[2] || "Unknown";
    const source = cells[3] || "Deep Research";
    const notes = cells[4] || "";

    // Parse price - remove currency symbols and commas
    const priceClean = priceStr.replace(/[^\d.]/g, "");
    if (!priceClean) {
      return null;
    }
    const price = parseFloat(priceClean);
    if (isNaN(price) || price < 100) {
      // Skip invalid or suspiciously low prices
      return null;
    }

    // Parse date
    let saleDate: Date | null = null;
    if (dateStr && !["N/A", "-", "Unknown", ""].includes(dateStr)) {
      try {
        // Try various date formats
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          saleDate = parsed;
        }
      } catch {
        // Date parsing failed, leave as null
      }
    }

    // Determine source type
    const sourceType = categorizeSource(source);

    return {
      source,
      sourceType,
      price,
      currency: "USD",
      priceType,
      condition,
      description: notes,
      location: null,
      saleDate,
      isVerified: false,
    };
  } catch (error) {
    console.debug(`Error parsing table row: ${cells.join(", ")}`);
    return null;
  }
}

/**
 * Categorize a source name into a type
 */
function categorizeSource(source: string): string {
  const sourceLower = source.toLowerCase();

  if (
    sourceLower.includes("christie") ||
    sourceLower.includes("sotheby") ||
    sourceLower.includes("phillips") ||
    sourceLower.includes("bonham") ||
    sourceLower.includes("auction")
  ) {
    return "Auction";
  }

  if (
    sourceLower.includes("chrono24") ||
    sourceLower.includes("watchbox") ||
    sourceLower.includes("ebay") ||
    sourceLower.includes("hodinkee") ||
    sourceLower.includes("everywatch")
  ) {
    return "Marketplace";
  }

  if (
    sourceLower.includes("bob") ||
    sourceLower.includes("dealer") ||
    sourceLower.includes("govberg") ||
    sourceLower.includes("jaztime") ||
    sourceLower.includes("davidsw")
  ) {
    return "Dealer";
  }

  return "Other";
}

/**
 * Extract market insights from the report
 */
export function extractMarketInsights(report: string): Record<string, any> {
  const insights: Record<string, any> = {};

  // Extract average sold price
  const avgSoldPattern = /[Aa]verage\s*[Ss]old\s*[Pp]rice[:\s]*\$?([\d,]+)/;
  const avgSoldMatch = report.match(avgSoldPattern);
  if (avgSoldMatch) {
    insights.averageSoldPrice = parseFloat(avgSoldMatch[1].replace(/,/g, ""));
  }

  // Extract median sold price
  const medianPattern = /[Mm]edian\s*[Ss]old\s*[Pp]rice[:\s]*\$?([\d,]+)/;
  const medianMatch = report.match(medianPattern);
  if (medianMatch) {
    insights.medianSoldPrice = parseFloat(medianMatch[1].replace(/,/g, ""));
  }

  // Extract price range
  const rangePattern = /[Ss]old\s*[Pp]rice\s*[Rr]ange[:\s]*\$?([\d,]+)\s*[-–]\s*\$?([\d,]+)/;
  const rangeMatch = report.match(rangePattern);
  if (rangeMatch) {
    insights.priceRangeLow = parseFloat(rangeMatch[1].replace(/,/g, ""));
    insights.priceRangeHigh = parseFloat(rangeMatch[2].replace(/,/g, ""));
  }

  // Extract trend
  const trendPattern = /[Rr]ecent\s*[Tt]rend[:\s]*(increasing|stable|decreasing)/i;
  const trendMatch = report.match(trendPattern);
  if (trendMatch) {
    insights.trend = trendMatch[1].toLowerCase();
  }

  // Extract executive summary (first paragraph after ## Executive Summary)
  const summarySection = report.split("## Executive Summary")[1];
  if (summarySection) {
    const firstParagraph = summarySection.split("##")[0].trim();
    insights.executiveSummary = firstParagraph.substring(0, 1000);
  }

  // Determine volatility based on price spread
  if (insights.priceRangeLow && insights.priceRangeHigh) {
    const spread = (insights.priceRangeHigh - insights.priceRangeLow) / insights.priceRangeLow;
    insights.volatility = spread > 0.3 ? "High" : spread > 0.15 ? "Medium" : "Low";
  }

  return insights;
}

/**
 * Categorize condition string into standard categories
 */
export function categorizeCondition(condition: string): string {
  const conditionLower = condition.toLowerCase();

  if (["bnib", "brand new", "new in box"].some((t) => conditionLower.includes(t))) {
    return "BNIB";
  }
  if (["unworn", "never worn", "mint", "new"].some((t) => conditionLower.includes(t))) {
    return "Unworn";
  }
  if (["excellent", "lightly", "light wear"].some((t) => conditionLower.includes(t))) {
    return "Lightly Worn";
  }
  if (["good", "moderate", "fair"].some((t) => conditionLower.includes(t))) {
    return "Moderately Worn";
  }
  if (["poor", "heavy", "worn"].some((t) => conditionLower.includes(t))) {
    return "Heavily Worn";
  }

  return "Unknown";
}
