import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertReportSchema, updateReportStatusSchema, insertCaseNoteSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { z } from "zod";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images and documents are allowed"));
    }
  }
});

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Public route - submit report
  app.post("/api/reports", upload.single("file"), async (req, res) => {
    try {
      const reportData = insertReportSchema.parse({
        ...req.body,
        anonymous: req.body.anonymous === "true",
      });

      if (req.file) {
        reportData.fileUrl = req.file.path;
      }

      const report = await storage.createReport(reportData);
      res.status(201).json({ 
        trackingId: report.trackingId,
        message: "Report submitted successfully" 
      });
    } catch (error) {
      console.error("Error creating report:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid report data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit report" });
    }
  });

  // Public route - get report by tracking ID
  app.get("/api/reports/track/:trackingId", async (req, res) => {
    try {
      const report = await storage.getReportByTrackingId(req.params.trackingId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      // Return limited info for public tracking
      res.json({
        trackingId: report.trackingId,
        status: report.status,
        createdAt: report.createdAt,
      });
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  // Protected routes - require admin authentication
  app.get("/api/cases", requireAuth, async (req, res) => {
    try {
      const filters = {
        status: req.query.status as string,
        category: req.query.category as string,
        search: req.query.search as string,
      };

      const reports = await storage.getReports(filters);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ message: "Failed to fetch cases" });
    }
  });

  app.get("/api/cases/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getReportsStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.get("/api/cases/:id", requireAuth, async (req, res) => {
    try {
      const report = await storage.getReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Case not found" });
      }

      const notes = await storage.getCaseNotesByReportId(req.params.id);
      res.json({ ...report, notes });
    } catch (error) {
      console.error("Error fetching case:", error);
      res.status(500).json({ message: "Failed to fetch case" });
    }
  });

  app.patch("/api/cases/:id/status", requireAuth, async (req, res) => {
    try {
      const statusData = updateReportStatusSchema.parse(req.body);
      const report = await storage.updateReportStatus(
        req.params.id, 
        statusData.status, 
        (req as any).user?.id
      );
      
      if (!report) {
        return res.status(404).json({ message: "Case not found" });
      }

      res.json(report);
    } catch (error) {
      console.error("Error updating status:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid status data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update case status" });
    }
  });

  app.post("/api/cases/:id/notes", requireAuth, async (req, res) => {
    try {
      const noteData = insertCaseNoteSchema.parse({
        ...req.body,
        reportId: req.params.id,
      });

      const note = await storage.createCaseNote({
        ...noteData,
        addedById: (req as any).user.id,
      });

      const noteWithUser = await storage.getCaseNotesByReportId(req.params.id);
      const createdNote = noteWithUser.find(n => n.id === note.id);
      
      res.status(201).json(createdNote);
    } catch (error) {
      console.error("Error creating note:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
