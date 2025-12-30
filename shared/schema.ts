import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Watch Analyses - The main entity representing a market analysis for a specific watch model
export const watchAnalyses = pgTable("watch_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  reference: text("reference").notNull(),
  description: text("description"),
  
  // Market metrics
  marketPrice: real("market_price"),
  retailPrice: real("retail_price"),
  volatility: text("volatility"), // "Low", "Medium", "High"
  liquidityScore: text("liquidity_score"), // "Low", "Medium", "High"
  
  // AI Analysis metadata
  confidenceScore: integer("confidence_score"), // 0-100
  analystConsensus: text("analyst_consensus"), // "BUY", "HOLD", "SELL"
  executiveSummary: text("executive_summary"),
  
  // Structured insights - stored as JSON for rich content
  priceStatistics: jsonb("price_statistics"), // { avgSold, medianSold, soldRange, avgAsking, askingRange, spread }
  conditionPricing: jsonb("condition_pricing"), // Array of { condition, soldRange, askingRange }
  priceTrends: text("price_trends"), // Full narrative of price history
  marketAnalysis: text("market_analysis"), // Key market factors and drivers
  specialEditions: text("special_editions"), // Special editions and variants info
  sources: jsonb("sources"), // Array of { name, url, description } bibliography
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Market Data Points - Individual listings, sales, or auction results
export const marketDataPoints = pgTable("market_data_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").references(() => watchAnalyses.id, { onDelete: "cascade" }).notNull(),
  
  source: text("source").notNull(), // "Christie's", "Chrono24", "Bob's Watches", etc.
  sourceType: text("source_type").notNull(), // "Auction", "Marketplace", "Dealer", "Private"
  
  price: real("price").notNull(),
  currency: text("currency").default("USD").notNull(),
  priceType: text("price_type").notNull(), // "Sold", "Asking", "Bid"
  
  condition: text("condition"), // "New/Unworn", "Pre-Owned (Mint)", etc.
  description: text("description"),
  location: text("location"),
  
  // Enhanced fields for better provenance
  listingUrl: text("listing_url"), // Direct link to listing/auction lot
  listingId: text("listing_id"), // Lot number, item ID, or listing reference
  seller: text("seller"), // Dealer name, seller username, auction house
  watchYear: text("watch_year"), // Year of the watch (e.g., "2022", "2021")
  
  saleDate: timestamp("sale_date"),
  isVerified: boolean("is_verified").default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Data Sources Configuration - Track which sources are enabled
export const dataSources = pgTable("data_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // "Auction", "Marketplace", "Dealer"
  description: text("description"),
  
  isEnabled: boolean("is_enabled").default(true).notNull(),
  status: text("status").default("active").notNull(), // "active", "inactive", "syncing", "error"
  
  lastSyncAt: timestamp("last_sync_at"),
  recordCount: integer("record_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Research Logs - Store prompts and responses for debugging
export const researchLogs = pgTable("research_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").references(() => watchAnalyses.id, { onDelete: "cascade" }).notNull(),
  
  status: text("status").notNull(), // "started", "completed", "failed"
  prompt: text("prompt").notNull(),
  rawResponse: text("raw_response"),
  
  extractedCount: integer("extracted_count").default(0),
  durationSeconds: real("duration_seconds"),
  errorMessage: text("error_message"),
  
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Zod schemas for validation
export const insertWatchAnalysisSchema = createInsertSchema(watchAnalyses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMarketDataPointSchema = createInsertSchema(marketDataPoints).omit({
  id: true,
  createdAt: true,
});

export const insertDataSourceSchema = createInsertSchema(dataSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResearchLogSchema = createInsertSchema(researchLogs).omit({
  id: true,
  startedAt: true,
});

// Types
export type InsertWatchAnalysis = z.infer<typeof insertWatchAnalysisSchema>;
export type WatchAnalysis = typeof watchAnalyses.$inferSelect;

export type InsertMarketDataPoint = z.infer<typeof insertMarketDataPointSchema>;
export type MarketDataPoint = typeof marketDataPoints.$inferSelect;

export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;
export type DataSource = typeof dataSources.$inferSelect;

export type InsertResearchLog = z.infer<typeof insertResearchLogSchema>;
export type ResearchLog = typeof researchLogs.$inferSelect;
