import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertWatchAnalysisSchema, 
  insertMarketDataPointSchema,
  insertDataSourceSchema 
} from "@shared/schema";
import { deepResearchData } from "../client/src/lib/mock-data";
import { researchWatch, getResearchProgress } from "./services/deep-research.js";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Watch Analyses Routes
  app.get("/api/analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllWatchAnalyses();
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analyses" });
    }
  });

  app.get("/api/analyses/:id", async (req, res) => {
    try {
      const analysis = await storage.getWatchAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  app.post("/api/analyses", async (req, res) => {
    try {
      const validatedData = insertWatchAnalysisSchema.parse(req.body);
      const analysis = await storage.createWatchAnalysis(validatedData);
      res.status(201).json(analysis);
    } catch (error) {
      res.status(400).json({ error: "Invalid data provided" });
    }
  });

  app.patch("/api/analyses/:id", async (req, res) => {
    try {
      const updated = await storage.updateWatchAnalysis(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update analysis" });
    }
  });

  app.delete("/api/analyses/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWatchAnalysis(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete analysis" });
    }
  });

  // Market Data Points Routes
  app.get("/api/analyses/:analysisId/data-points", async (req, res) => {
    try {
      const dataPoints = await storage.getMarketDataPoints(req.params.analysisId);
      res.json(dataPoints);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data points" });
    }
  });

  app.post("/api/analyses/:analysisId/data-points", async (req, res) => {
    try {
      const data = { ...req.body, analysisId: req.params.analysisId };
      const validatedData = insertMarketDataPointSchema.parse(data);
      const dataPoint = await storage.createMarketDataPoint(validatedData);
      res.status(201).json(dataPoint);
    } catch (error) {
      res.status(400).json({ error: "Invalid data provided" });
    }
  });

  app.post("/api/analyses/:analysisId/data-points/bulk", async (req, res) => {
    try {
      const dataArray = Array.isArray(req.body) ? req.body : [req.body];
      const dataWithAnalysisId = dataArray.map(item => ({
        ...item,
        analysisId: req.params.analysisId
      }));
      const dataPoints = await storage.bulkCreateMarketDataPoints(dataWithAnalysisId);
      res.status(201).json(dataPoints);
    } catch (error) {
      res.status(400).json({ error: "Invalid data provided" });
    }
  });

  // Data Sources Routes
  app.get("/api/data-sources", async (req, res) => {
    try {
      const sources = await storage.getAllDataSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch data sources" });
    }
  });

  app.post("/api/data-sources", async (req, res) => {
    try {
      const validatedData = insertDataSourceSchema.parse(req.body);
      const source = await storage.createDataSource(validatedData);
      res.status(201).json(source);
    } catch (error) {
      res.status(400).json({ error: "Invalid data provided" });
    }
  });

  app.patch("/api/data-sources/:id", async (req, res) => {
    try {
      const updated = await storage.updateDataSource(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Data source not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update data source" });
    }
  });

  app.patch("/api/data-sources/:id/toggle", async (req, res) => {
    try {
      const { isEnabled } = req.body;
      const updated = await storage.toggleDataSource(req.params.id, isEnabled);
      if (!updated) {
        return res.status(404).json({ error: "Data source not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle data source" });
    }
  });

  // ============================================================
  // DEEP RESEARCH ENDPOINTS
  // ============================================================

  // Trigger deep research for a watch analysis
  app.post("/api/analyses/:id/research", async (req, res) => {
    try {
      const analysis = await storage.getWatchAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      // Get API key from environment (secure method)
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ 
          error: "Gemini API key not configured. Please set GEMINI_API_KEY in your environment." 
        });
      }

      // Start research in background (don't await - it takes 2-10 mins)
      researchWatch(
        analysis.id,
        analysis.brand,
        analysis.reference,
        apiKey
      ).catch(err => {
        console.error(`Research failed for ${analysis.id}:`, err);
      });

      res.json({ 
        message: "Research started",
        analysisId: analysis.id,
        estimatedTime: "2-10 minutes"
      });
    } catch (error) {
      console.error("Research error:", error);
      res.status(500).json({ error: "Failed to start research" });
    }
  });

  // Get research progress
  app.get("/api/analyses/:id/research/progress", async (req, res) => {
    try {
      const progress = getResearchProgress(req.params.id);
      if (!progress) {
        return res.json({ 
          status: "not_started",
          progress: 0,
          message: "No research in progress"
        });
      }
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to get research progress" });
    }
  });

  // Seed endpoint - Create initial data sources and sample analysis
  app.post("/api/seed", async (req, res) => {
    try {
      // Create data sources
      const sourcesToSeed = [
        { name: "Christie's", type: "Auction", description: "Rare watches & horological masterpieces", status: "active", recordCount: 1420, lastSyncAt: new Date(Date.now() - 2 * 60 * 1000) },
        { name: "Phillips", type: "Auction", description: "Market-leading watch auctions", status: "active", recordCount: 850, lastSyncAt: new Date(Date.now() - 5 * 60 * 1000) },
        { name: "Sotheby's", type: "Auction", description: "Global luxury watch auctions", status: "syncing", recordCount: 2100, lastSyncAt: new Date() },
        { name: "EveryWatch", type: "Marketplace", description: "Comprehensive cross-platform monitoring", status: "active", recordCount: 15400, lastSyncAt: new Date() },
        { name: "WatchCharts", type: "Marketplace", description: "Historical price trends & market indices", status: "active", recordCount: 5000, lastSyncAt: new Date(Date.now() - 60 * 60 * 1000) },
        { name: "Bob's Watches", type: "Dealer", description: "Pre-owned Rolex exchange data", status: "active", recordCount: 320, lastSyncAt: new Date(Date.now() - 10 * 60 * 1000) },
        { name: "Chrono24", type: "Dealer", description: "Professional dealer listings worldwide", status: "active", recordCount: 25000, lastSyncAt: new Date() },
        { name: "Govberg / 1916", type: "Dealer", description: "Authorized dealer pre-owned inventory", status: "inactive", recordCount: 0 },
      ];

      for (const source of sourcesToSeed) {
        await storage.createDataSource(source);
      }

      // Create sample analysis
      const analysis = await storage.createWatchAnalysis({
        brand: "Rolex",
        model: "Daytona",
        reference: "126509",
        description: "White Gold • Steel Dial • Oyster Bracelet",
        marketPrice: 45900,
        retailPrice: 42500,
        volatility: "Low",
        liquidityScore: "High",
        confidenceScore: 94,
        analystConsensus: "BUY",
        executiveSummary: deepResearchData.raw_report.split("## Executive Summary")[1]?.split("###")[0]?.trim() || "Market analysis complete.",
      });

      // Add market data points from deep research
      const dataPointsToAdd = deepResearchData.extracted_sales.map(sale => ({
        analysisId: analysis.id,
        source: sale.source,
        sourceType: sale.source.includes("Christie") || sale.source.includes("Phillips") || sale.source.includes("Sotheby") ? "Auction" : 
                    sale.source.includes("Bob") || sale.source.includes("Chrono24") ? "Dealer" : "Marketplace",
        price: sale.price,
        currency: sale.currency,
        priceType: sale.price_type,
        condition: sale.condition,
        description: sale.description,
        isVerified: true,
      }));

      await storage.bulkCreateMarketDataPoints(dataPointsToAdd);

      res.json({ message: "Seed data created successfully", analysisId: analysis.id });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ error: "Failed to seed database" });
    }
  });

  return httpServer;
}
