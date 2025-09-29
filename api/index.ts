import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { setupAuth } from "../server/auth";
import { insertReportSchema, updateReportStatusSchema, insertCaseNoteSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { storage } from "../server/storage";
import { fileURLToPath } from 'url';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Check for required environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
}

// Setup authentication with error handling
try {
  setupAuth(app);
} catch (error) {
  console.error('Error setting up authentication:', error);
}

// Setup multer for file uploads (memory storage for serverless)
const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage for serverless
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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
// Public route - submit report
app.post("/api/reports", upload.single("file"), async (req, res) => {
  try {
    const reportData = insertReportSchema.parse({
      ...req.body,
      anonymous: req.body.anonymous === "true",
    });

    if (req.file) {
      // For serverless, we'll store file data as base64 or handle differently
      // For now, we'll skip file storage in serverless environment
      console.log("File upload received but not stored in serverless environment:", req.file.originalname);
    }

    // Check if storage is available
    if (!storage) {
      return res.status(500).json({ message: "Database not available" });
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
    res.status(500).json({ message: "Failed to submit report", error: error.message });
  }
});

// Public route - get report by tracking ID
app.get("/api/reports/track/:trackingId", async (req, res) => {
  try {
    const report = await storage.getReportByTrackingId(req.params.trackingId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    
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
      status: req.query.status === "all" ? undefined : req.query.status as string,
      category: req.query.category === "all" ? undefined : req.query.category as string,
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

// Serve static files from dist directory
const distPath = path.resolve(__dirname, "..", "dist");

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Serve index.html for all non-API routes (SPA routing)
  app.get("*", (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "API endpoint not found" });
    }
    
    res.sendFile(path.resolve(distPath, "index.html"));
  });
} else {
  // Fallback if dist doesn't exist
  app.get("*", (req, res) => {
    res.status(500).json({ message: "Build files not found" });
  });
}

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Server error:", err);
  res.status(status).json({ message });
});

export default app;
