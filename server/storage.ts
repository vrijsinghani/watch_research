import { 
  type WatchAnalysis, 
  type InsertWatchAnalysis,
  type MarketDataPoint,
  type InsertMarketDataPoint,
  type DataSource,
  type InsertDataSource,
  type ResearchLog,
  type InsertResearchLog,
  watchAnalyses,
  marketDataPoints,
  dataSources,
  researchLogs,
} from "@shared/schema";
import { db } from "../drizzle/db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Watch Analyses
  getWatchAnalysis(id: string): Promise<WatchAnalysis | undefined>;
  getWatchAnalysisByReference(reference: string): Promise<WatchAnalysis | undefined>;
  getAllWatchAnalyses(): Promise<WatchAnalysis[]>;
  createWatchAnalysis(data: InsertWatchAnalysis): Promise<WatchAnalysis>;
  updateWatchAnalysis(id: string, data: Partial<InsertWatchAnalysis>): Promise<WatchAnalysis | undefined>;
  deleteWatchAnalysis(id: string): Promise<boolean>;

  // Market Data Points
  getMarketDataPoints(analysisId: string): Promise<MarketDataPoint[]>;
  createMarketDataPoint(data: InsertMarketDataPoint): Promise<MarketDataPoint>;
  bulkCreateMarketDataPoints(data: InsertMarketDataPoint[]): Promise<MarketDataPoint[]>;

  // Data Sources
  getAllDataSources(): Promise<DataSource[]>;
  getDataSource(id: string): Promise<DataSource | undefined>;
  createDataSource(data: InsertDataSource): Promise<DataSource>;
  updateDataSource(id: string, data: Partial<InsertDataSource>): Promise<DataSource | undefined>;
  toggleDataSource(id: string, isEnabled: boolean): Promise<DataSource | undefined>;

  // Research Logs
  getAllResearchLogs(): Promise<ResearchLog[]>;
  getResearchLogsByAnalysis(analysisId: string): Promise<ResearchLog[]>;
  createResearchLog(data: InsertResearchLog): Promise<ResearchLog>;
  updateResearchLog(id: string, data: Partial<InsertResearchLog>): Promise<ResearchLog | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Watch Analyses
  async getWatchAnalysis(id: string): Promise<WatchAnalysis | undefined> {
    const [analysis] = await db.select().from(watchAnalyses).where(eq(watchAnalyses.id, id));
    return analysis;
  }

  async getWatchAnalysisByReference(reference: string): Promise<WatchAnalysis | undefined> {
    const [analysis] = await db.select().from(watchAnalyses).where(eq(watchAnalyses.reference, reference));
    return analysis;
  }

  async getAllWatchAnalyses(): Promise<WatchAnalysis[]> {
    return await db.select().from(watchAnalyses).orderBy(desc(watchAnalyses.createdAt));
  }

  async createWatchAnalysis(data: InsertWatchAnalysis): Promise<WatchAnalysis> {
    const [analysis] = await db.insert(watchAnalyses).values(data).returning();
    return analysis;
  }

  async updateWatchAnalysis(id: string, data: Partial<InsertWatchAnalysis>): Promise<WatchAnalysis | undefined> {
    const [updated] = await db
      .update(watchAnalyses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(watchAnalyses.id, id))
      .returning();
    return updated;
  }

  async deleteWatchAnalysis(id: string): Promise<boolean> {
    const result = await db.delete(watchAnalyses).where(eq(watchAnalyses.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Market Data Points
  async getMarketDataPoints(analysisId: string): Promise<MarketDataPoint[]> {
    return await db
      .select()
      .from(marketDataPoints)
      .where(eq(marketDataPoints.analysisId, analysisId))
      .orderBy(desc(marketDataPoints.createdAt));
  }

  async createMarketDataPoint(data: InsertMarketDataPoint): Promise<MarketDataPoint> {
    const [point] = await db.insert(marketDataPoints).values(data).returning();
    return point;
  }

  async bulkCreateMarketDataPoints(data: InsertMarketDataPoint[]): Promise<MarketDataPoint[]> {
    if (data.length === 0) return [];
    return await db.insert(marketDataPoints).values(data).returning();
  }

  // Data Sources
  async getAllDataSources(): Promise<DataSource[]> {
    return await db.select().from(dataSources).orderBy(dataSources.type, dataSources.name);
  }

  async getDataSource(id: string): Promise<DataSource | undefined> {
    const [source] = await db.select().from(dataSources).where(eq(dataSources.id, id));
    return source;
  }

  async createDataSource(data: InsertDataSource): Promise<DataSource> {
    const [source] = await db.insert(dataSources).values(data).returning();
    return source;
  }

  async updateDataSource(id: string, data: Partial<InsertDataSource>): Promise<DataSource | undefined> {
    const [updated] = await db
      .update(dataSources)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dataSources.id, id))
      .returning();
    return updated;
  }

  async toggleDataSource(id: string, isEnabled: boolean): Promise<DataSource | undefined> {
    return this.updateDataSource(id, { isEnabled });
  }

  // Research Logs
  async getAllResearchLogs(): Promise<ResearchLog[]> {
    return await db.select().from(researchLogs).orderBy(desc(researchLogs.startedAt));
  }

  async getResearchLogsByAnalysis(analysisId: string): Promise<ResearchLog[]> {
    return await db
      .select()
      .from(researchLogs)
      .where(eq(researchLogs.analysisId, analysisId))
      .orderBy(desc(researchLogs.startedAt));
  }

  async createResearchLog(data: InsertResearchLog): Promise<ResearchLog> {
    const [log] = await db.insert(researchLogs).values(data).returning();
    return log;
  }

  async updateResearchLog(id: string, data: Partial<InsertResearchLog>): Promise<ResearchLog | undefined> {
    const [updated] = await db
      .update(researchLogs)
      .set(data)
      .where(eq(researchLogs.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
