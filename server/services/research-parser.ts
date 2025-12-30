/**
 * Research Report Parser
 * 
 * Extracts structured data from Gemini Deep Research markdown reports.
 * Enhanced to preserve full provenance and source details.
 */

import type { InsertMarketDataPoint } from "@shared/schema";

export interface PriceStatistics {
  msrp?: number;
  avgSoldPrice?: number;
  medianSoldPrice?: number;
  soldPriceRangeLow?: number;
  soldPriceRangeHigh?: number;
  avgAskingPrice?: number;
  askingPriceRangeLow?: number;
  askingPriceRangeHigh?: number;
  askingVsSoldSpread?: number;
  recentTrend?: string;
}

export interface ConditionPricing {
  condition: string;
  soldRangeLow?: number;
  soldRangeHigh?: number;
  askingRangeLow?: number;
  askingRangeHigh?: number;
  notes?: string;
}

export interface SourceReference {
  name: string;
  url?: string;
  description?: string;
}

export interface MarketInsights {
  executiveSummary?: string;
  priceStatistics?: PriceStatistics;
  conditionPricing?: ConditionPricing[];
  priceTrends?: string;
  marketAnalysis?: string;
  specialEditions?: string;
  sources?: SourceReference[];
  trend?: string;
  volatility?: string;
  averageSoldPrice?: number;
}

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
 * Enhanced to extract more detail from each column
 */
function parseTableRow(
  cells: string[],
  brand: string,
  reference: string,
  priceType: "Sold" | "Asking" | "Unknown"
): Omit<InsertMarketDataPoint, "analysisId"> | null {
  try {
    // Expected format varies by table type:
    // Completed Sales: Date, Price, Condition, Source, Seller/Lot, Notes
    // Current Listings: Date Listed, Asking Price, Condition, Source, Seller/ID, Notes
    const dateStr = cells[0] || "";
    const priceStr = cells[1] || "";
    const conditionRaw = cells[2] || "Unknown";
    const sourceRaw = cells[3] || "Deep Research";
    const sellerOrLot = cells[4] || "";
    const notes = cells[5] || cells[4] || ""; // Notes may be in position 4 or 5

    // Parse price - remove currency symbols and commas
    const priceClean = priceStr.replace(/[^\d.]/g, "");
    if (!priceClean) {
      return null;
    }
    const price = parseFloat(priceClean);
    if (isNaN(price) || price < 100) {
      return null;
    }

    // Parse date with better handling
    let saleDate: Date | null = null;
    if (dateStr && !["N/A", "-", "Unknown", ""].includes(dateStr)) {
      saleDate = parseFlexibleDate(dateStr);
    }

    // Extract year from condition if present (e.g., "Pre-Owned, 2022")
    const yearMatch = conditionRaw.match(/\b(20\d{2})\b/);
    const watchYear = yearMatch ? yearMatch[1] : null;
    
    // Clean condition - remove year to avoid redundancy
    const condition = conditionRaw.replace(/,?\s*20\d{2}/, "").trim() || conditionRaw;

    // Parse source - preserve the full detail including "(Sold Item)", "(Private Sale)", etc.
    const { source, sourceType, seller, listingId, listingUrl } = parseSourceDetail(sourceRaw, sellerOrLot);

    return {
      source,
      sourceType,
      price,
      currency: "USD",
      priceType,
      condition,
      description: notes,
      location: null,
      listingUrl,
      listingId,
      seller,
      watchYear,
      saleDate,
      isVerified: false,
    };
  } catch (error) {
    console.debug(`Error parsing table row: ${cells.join(", ")}`);
    return null;
  }
}

/**
 * Parse flexible date formats
 */
function parseFlexibleDate(dateStr: string): Date | null {
  try {
    // Try standard parsing first
    let parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // Handle formats like "May 20, 2024"
    const monthDayYear = dateStr.match(/(\w+)\s+(\d{1,2}),?\s*(\d{4})/);
    if (monthDayYear) {
      parsed = new Date(`${monthDayYear[1]} ${monthDayYear[2]}, ${monthDayYear[3]}`);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Handle "Apr 2024" format
    const monthYear = dateStr.match(/(\w+)\s+(\d{4})/);
    if (monthYear) {
      parsed = new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse source detail with enhanced extraction
 */
function parseSourceDetail(sourceRaw: string, sellerOrLot: string): {
  source: string;
  sourceType: string;
  seller: string | null;
  listingId: string | null;
  listingUrl: string | null;
} {
  let source = sourceRaw;
  let seller: string | null = null;
  let listingId: string | null = null;
  let listingUrl: string | null = null;

  // Extract listing ID patterns
  const idPatterns = [
    /ID:\s*(\d+)/i,
    /Lot\s*#?\s*(\d+)/i,
    /Item\s*#?\s*(\d+)/i,
    /#(\d{6,})/,
  ];
  
  for (const pattern of idPatterns) {
    const match = sourceRaw.match(pattern) || sellerOrLot.match(pattern);
    if (match) {
      listingId = match[1];
      break;
    }
  }

  // Extract URL if present
  const urlMatch = sourceRaw.match(/https?:\/\/[^\s\)]+/) || sellerOrLot.match(/https?:\/\/[^\s\)]+/);
  if (urlMatch) {
    listingUrl = urlMatch[0];
  }

  // Parse seller from sellerOrLot column
  if (sellerOrLot && !sellerOrLot.match(/^(Lot|ID|Item|#)/i)) {
    seller = sellerOrLot.replace(/\s*\(.*\)/, "").trim() || null;
  }

  // Determine source type
  const sourceType = categorizeSource(source);

  return { source, sourceType, seller, listingId, listingUrl };
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
    sourceLower.includes("davidsw") ||
    sourceLower.includes("crown & caliber") ||
    sourceLower.includes("moda watch")
  ) {
    return "Dealer";
  }

  if (
    sourceLower.includes("forum") ||
    sourceLower.includes("private") ||
    sourceLower.includes("rolexforum") ||
    sourceLower.includes("watchuseek")
  ) {
    return "Private";
  }

  return "Other";
}

/**
 * Extract comprehensive market insights from the report
 */
export function extractMarketInsights(report: string): MarketInsights {
  const insights: MarketInsights = {};

  // Extract executive summary
  const summarySection = report.split("## Executive Summary")[1];
  if (summarySection) {
    const firstSection = summarySection.split("##")[0].trim();
    insights.executiveSummary = firstSection;
  }

  // Extract price statistics
  insights.priceStatistics = extractPriceStatistics(report);

  // Extract condition-based pricing
  insights.conditionPricing = extractConditionPricing(report);

  // Extract price trends narrative
  const trendsSection = report.split(/## Price Trends?/i)[1];
  if (trendsSection) {
    insights.priceTrends = trendsSection.split("##")[0].trim();
  }

  // Extract market analysis
  const analysisSection = report.split("## Market Analysis")[1];
  if (analysisSection) {
    insights.marketAnalysis = analysisSection.split("##")[0].trim();
  }

  // Extract special editions and variants
  const specialSection = report.split(/## Special Editions?[^\n]*/i)[1];
  if (specialSection) {
    insights.specialEditions = specialSection.split("##")[0].trim();
  }

  // Extract sources/bibliography
  insights.sources = extractSources(report);

  // Determine trend
  const trendPattern = /[Rr]ecent\s*[Tt]rend[:\s]*[*]*\s*(increasing|stable|decreasing|slightly decreasing|slightly increasing)/i;
  const trendMatch = report.match(trendPattern);
  if (trendMatch) {
    insights.trend = trendMatch[1].toLowerCase();
  }

  // Set average sold price from statistics
  if (insights.priceStatistics?.avgSoldPrice) {
    insights.averageSoldPrice = insights.priceStatistics.avgSoldPrice;
  }

  // Determine volatility based on price spread
  if (insights.priceStatistics?.soldPriceRangeLow && insights.priceStatistics?.soldPriceRangeHigh) {
    const spread = (insights.priceStatistics.soldPriceRangeHigh - insights.priceStatistics.soldPriceRangeLow) 
                   / insights.priceStatistics.soldPriceRangeLow;
    insights.volatility = spread > 0.3 ? "High" : spread > 0.15 ? "Medium" : "Low";
  }

  return insights;
}

/**
 * Extract price statistics from the report
 * Handles markdown formatting like **$9,850** and ~$10,000
 */
function extractPriceStatistics(report: string): PriceStatistics {
  const stats: PriceStatistics = {};

  // Helper to extract price from markdown text
  const extractPrice = (text: string): number | null => {
    const match = text.match(/\$?([\d,]+)/);
    return match ? parseFloat(match[1].replace(/,/g, "")) : null;
  };

  // MSRP - handles "MSRP was approximately **$6,000**" or "MSRP: $10,250"
  const msrpPatterns = [
    /(?:MSRP|Official MSRP|Retail Price)[^$]*\*?\*?\$?([\d,]+)/i,
    /\*\*\$?([\d,]+)\s*USD?\*\*[^*]*(?:MSRP|retail)/i,
  ];
  for (const pattern of msrpPatterns) {
    const match = report.match(pattern);
    if (match) {
      stats.msrp = parseFloat(match[1].replace(/,/g, ""));
      break;
    }
  }

  // Average sold price - handles "**~$9,850**" format
  const avgSoldPatterns = [
    /[Aa]verage\s*[Ss]old\s*[Pp]rice[^*$]*\*?\*?~?\$?([\d,]+)/,
    /[Aa]vg\s*[Ss]old[^*$]*\*?\*?~?\$?([\d,]+)/,
  ];
  for (const pattern of avgSoldPatterns) {
    const match = report.match(pattern);
    if (match) {
      stats.avgSoldPrice = parseFloat(match[1].replace(/,/g, ""));
      break;
    }
  }

  // Median sold price
  const medianPatterns = [
    /[Mm]edian\s*[Ss]old\s*[Pp]rice[^*$]*\*?\*?~?\$?([\d,]+)/,
  ];
  for (const pattern of medianPatterns) {
    const match = report.match(pattern);
    if (match) {
      stats.medianSoldPrice = parseFloat(match[1].replace(/,/g, ""));
      break;
    }
  }

  // Sold price range - handles "**~$8,200** ... to **~$11,750**"
  const soldRangePatterns = [
    /[Ss]old\s*[Pp]rice\s*[Rr]ange[^:]*:[^$]*~?\*?\*?\$?([\d,]+)[^$]*(?:to|[-–])[^$]*~?\*?\*?\$?([\d,]+)/,
    /sold[^$]*\*?\*?~?\$?([\d,]+)\*?\*?[^$]*to[^$]*\*?\*?~?\$?([\d,]+)/i,
  ];
  for (const pattern of soldRangePatterns) {
    const match = report.match(pattern);
    if (match) {
      stats.soldPriceRangeLow = parseFloat(match[1].replace(/,/g, ""));
      stats.soldPriceRangeHigh = parseFloat(match[2].replace(/,/g, ""));
      break;
    }
  }

  // Average asking price
  const avgAskingPatterns = [
    /[Aa]verage\s*[Aa]sking\s*[Pp]rice[^*$]*\*?\*?~?\$?([\d,]+)/,
  ];
  for (const pattern of avgAskingPatterns) {
    const match = report.match(pattern);
    if (match) {
      stats.avgAskingPrice = parseFloat(match[1].replace(/,/g, ""));
      break;
    }
  }

  // Asking price range
  const askingRangePatterns = [
    /[Aa]sking\s*[Pp]rice\s*[Rr]ange[^:]*:[^$]*~?\*?\*?\$?([\d,]+)[^$]*(?:to|[-–])[^$]*~?\*?\*?\$?([\d,]+)/,
  ];
  for (const pattern of askingRangePatterns) {
    const match = report.match(pattern);
    if (match) {
      stats.askingPriceRangeLow = parseFloat(match[1].replace(/,/g, ""));
      stats.askingPriceRangeHigh = parseFloat(match[2].replace(/,/g, ""));
      break;
    }
  }

  // Asking vs Sold spread - handles "**~10-15%**"
  const spreadPatterns = [
    /[Aa]sking\s*vs\.?\s*[Ss]old\s*[Ss]pread[^*\d]*\*?\*?~?([\d]+)(?:\s*[-–]\s*(\d+))?%/,
  ];
  for (const pattern of spreadPatterns) {
    const match = report.match(pattern);
    if (match) {
      // If range like "10-15%", take average
      if (match[2]) {
        stats.askingVsSoldSpread = (parseFloat(match[1]) + parseFloat(match[2])) / 2;
      } else {
        stats.askingVsSoldSpread = parseFloat(match[1]);
      }
      break;
    }
  }

  // Recent trend - handles "**Stable**. After the..."
  const trendPatterns = [
    /[Rr]ecent\s*[Tt]rend[:\s]*\*?\*?([A-Za-z]+)\*?\*?/,
  ];
  for (const pattern of trendPatterns) {
    const match = report.match(pattern);
    if (match) {
      stats.recentTrend = match[1].trim();
      break;
    }
  }

  return stats;
}

/**
 * Extract condition-based pricing table
 */
function extractConditionPricing(report: string): ConditionPricing[] {
  const pricing: ConditionPricing[] = [];

  // Find the condition-based pricing section
  const conditionSection = report.split(/## Condition[- ]Based Pricing/i)[1];
  if (!conditionSection) return pricing;

  const sectionContent = conditionSection.split("##")[0];
  
  // Extract table rows
  const tablePattern = /\|[^\n]+\|/g;
  const tableRows = sectionContent.match(tablePattern) || [];

  for (const row of tableRows) {
    if (row.includes("---") || row.includes("Condition") && row.includes("Range")) {
      continue;
    }

    const cells = row.split("|").map(c => c.trim()).filter(c => c.length > 0);
    if (cells.length >= 3) {
      const condition = cells[0].replace(/\*\*/g, "");
      
      // Parse sold range
      const soldRange = cells[1];
      const soldMatch = soldRange.match(/\$?([\d,]+)\s*[-–]\s*\$?([\d,]+)/);
      
      // Parse asking range
      const askingRange = cells[2];
      const askingMatch = askingRange?.match(/\$?([\d,]+)\s*[-–]\s*\$?([\d,]+)/);

      pricing.push({
        condition,
        soldRangeLow: soldMatch ? parseFloat(soldMatch[1].replace(/,/g, "")) : undefined,
        soldRangeHigh: soldMatch ? parseFloat(soldMatch[2].replace(/,/g, "")) : undefined,
        askingRangeLow: askingMatch ? parseFloat(askingMatch[1].replace(/,/g, "")) : undefined,
        askingRangeHigh: askingMatch ? parseFloat(askingMatch[2].replace(/,/g, "")) : undefined,
        notes: cells[3] || undefined,
      });
    }
  }

  return pricing;
}

/**
 * Extract sources/bibliography from the report
 */
function extractSources(report: string): SourceReference[] {
  const sources: SourceReference[] = [];

  // Find the sources section
  const sourcesSection = report.split(/## Sources?|## Bibliography|## References/i)[1];
  if (!sourcesSection) return sources;

  const sectionContent = sourcesSection.split("##")[0];
  
  // Match markdown links: [Name](url) or bullet points with URLs
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkPattern.exec(sectionContent)) !== null) {
    sources.push({
      name: match[1].trim(),
      url: match[2].trim(),
    });
  }

  // Also match bullet points with plain text descriptions
  const bulletPattern = /\*\s+([^\n]+)/g;
  while ((match = bulletPattern.exec(sectionContent)) !== null) {
    const line = match[1];
    // Skip if we already extracted as markdown link
    if (line.includes("](")) continue;
    
    // Try to extract URL from plain text
    const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
    const name = line.replace(/(https?:\/\/[^\s]+)/, "").replace(/[-–:]\s*$/, "").trim();
    
    if (name) {
      sources.push({
        name,
        url: urlMatch ? urlMatch[1] : undefined,
        description: line,
      });
    }
  }

  return sources;
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
