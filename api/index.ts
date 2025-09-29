import express from 'express';
import { Express } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";
import { users, reports, caseNotes, type User, type InsertUser, type Report, type InsertReport, type CaseNote, type InsertCaseNote, type User as SelectUser } from "../shared/schema.js";
import { eq, desc, and, ilike, count } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { Store } from "express-session";

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database setup
let pool: Pool;
let db: any;
let sessionStore: any;

try {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set");
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
  }

  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });

  // Session store setup
  const PostgresSessionStore = connectPg(session);
  sessionStore = new PostgresSessionStore({ 
    pool, 
    createTableIfMissing: true 
  });
} catch (error) {
  console.error("Database initialization error:", error);
  // Don't throw here, let the app start and handle errors gracefully
}

// Storage implementation
interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createReport(report: InsertReport): Promise<Report>;
  getReports(filters?: { status?: string; category?: string; search?: string }): Promise<Report[]>;
  getReportById(id: string): Promise<Report | undefined>;
  getReportByTrackingId(trackingId: string): Promise<Report | undefined>;
  updateReportStatus(id: string, status: string, assignedToId?: string): Promise<Report | undefined>;
  getReportsStats(): Promise<{ total: number; new: number; investigating: number; resolved: number; thisMonth: number }>;
  
  createCaseNote(note: InsertCaseNote & { addedById: string }): Promise<CaseNote>;
  getCaseNotesByReportId(reportId: string): Promise<(CaseNote & { addedBy: { username: string } })[]>;
  
  sessionStore: Store;
}

class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = sessionStore;
  }

  private checkDatabase() {
    if (!db) {
      throw new Error("Database not initialized");
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    this.checkDatabase();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, role: "admin" })
      .returning();
    return user;
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    // Generate tracking ID
    const timestamp = Date.now().toString().slice(-6);
    const trackingId = `SR-2024-${timestamp}`;
    
    const [report] = await db
      .insert(reports)
      .values({ ...insertReport, trackingId })
      .returning();
    return report;
  }

  async getReports(filters?: { status?: string; category?: string; search?: string }): Promise<Report[]> {
    let query = db.select().from(reports).orderBy(desc(reports.createdAt));
    
    if (filters) {
      const conditions: any[] = [];
      if (filters.status) conditions.push(eq(reports.status, filters.status as any));
      if (filters.category) conditions.push(eq(reports.category, filters.category as any));
      if (filters.search) {
        conditions.push(
          ilike(reports.description, `%${filters.search}%`)
        );
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }
    
    return await query;
  }

  async getReportById(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async getReportByTrackingId(trackingId: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.trackingId, trackingId));
    return report || undefined;
  }

  async updateReportStatus(id: string, status: string, assignedToId?: string): Promise<Report | undefined> {
    const updateData: any = { 
      status: status as any, 
      updatedAt: new Date() 
    };
    
    if (assignedToId) {
      updateData.assignedToId = assignedToId;
    }

    const [report] = await db
      .update(reports)
      .set(updateData)
      .where(eq(reports.id, id))
      .returning();
    return report || undefined;
  }

  async getReportsStats(): Promise<{ total: number; new: number; investigating: number; resolved: number; thisMonth: number }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalResult] = await db.select({ count: count() }).from(reports);
    const [newResult] = await db.select({ count: count() }).from(reports).where(eq(reports.status, "new"));
    const [investigatingResult] = await db.select({ count: count() }).from(reports).where(eq(reports.status, "investigating"));
    const [resolvedResult] = await db.select({ count: count() }).from(reports).where(eq(reports.status, "resolved"));
    const [thisMonthResult] = await db.select({ count: count() }).from(reports).where(
      and(eq(reports.status, "new"), eq(reports.createdAt, startOfMonth))
    );

    return {
      total: totalResult.count,
      new: newResult.count,
      investigating: investigatingResult.count,
      resolved: resolvedResult.count,
      thisMonth: thisMonthResult.count,
    };
  }

  async createCaseNote(note: InsertCaseNote & { addedById: string }): Promise<CaseNote> {
    const [caseNote] = await db
      .insert(caseNotes)
      .values(note)
      .returning();
    return caseNote;
  }

  async getCaseNotesByReportId(reportId: string): Promise<(CaseNote & { addedBy: { username: string } })[]> {
    const notes = await db
      .select({
        id: caseNotes.id,
        reportId: caseNotes.reportId,
        note: caseNotes.note,
        addedById: caseNotes.addedById,
        createdAt: caseNotes.createdAt,
        addedBy: {
          username: users.username,
        },
      })
      .from(caseNotes)
      .innerJoin(users, eq(caseNotes.addedById, users.id))
      .where(eq(caseNotes.reportId, reportId))
      .orderBy(desc(caseNotes.createdAt));

    return notes;
  }
}

const storage = new DatabaseStorage();

// Auth setup
declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    console.error("SESSION_SECRET environment variable is not set");
    return; // Skip auth setup if no secret
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore || undefined,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user || undefined);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// Express app setup
const app = express();

// Environment validation
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
}

// Middleware - CORS setup
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' ? '*' : '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage for serverless
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
}).any(); // Accept any field name

// Setup authentication
setupAuth(app);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: db ? "connected" : "not connected",
    sessionSecret: process.env.SESSION_SECRET ? "set" : "not set"
  });
});

// Report submission endpoint
app.post("/api/reports", upload, async (req, res) => {
  try {
    const reportSchema = z.object({
      description: z.string().min(1, "Description is required"),
      category: z.enum(["harassment", "safety", "ethics", "fraud", "other"]),
      reporterName: z.string().optional(),
      reporterEmail: z.string().email().optional(),
      anonymous: z.boolean().optional(),
      fileUrl: z.string().optional(),
    });

    const validatedData = reportSchema.parse(req.body);
    
    // Process file attachments if any
    const attachments: any[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        // In a real application, you'd save files to cloud storage
        // For now, we'll just store metadata
        attachments.push({
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          // In production, this would be a URL to the stored file
          url: `/uploads/${file.fieldname}-${Date.now()}-${file.originalname}`
        });
      }
    }

    const report = await storage.createReport({
      ...validatedData,
    });

    res.status(201).json(report);
  } catch (error) {
    console.error("Error creating report:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid report data", errors: error.errors });
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message: "Failed to submit report", error: errorMessage });
  }
});

// Get reports endpoint
app.get("/api/reports", async (req, res) => {
  try {
    const { status, category, search } = req.query;
    
    const filters: { status?: string; category?: string; search?: string } = {};
    if (status && status !== 'all') filters.status = status as string;
    if (category && category !== 'all') filters.category = category as string;
    if (search) filters.search = search as string;
    
    const reports = await storage.getReports(filters);
    res.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message: "Failed to fetch reports", error: errorMessage });
  }
});

// Get single report endpoint
app.get("/api/reports/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const report = await storage.getReportById(id);
    
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    
    res.json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message: "Failed to fetch report", error: errorMessage });
  }
});

// Update report status endpoint
app.patch("/api/reports/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedToId } = req.body;
    
    if (!status || !["new", "investigating", "resolved", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const report = await storage.updateReportStatus(id, status, assignedToId);
    
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    
    res.json(report);
  } catch (error) {
    console.error("Error updating report:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message: "Failed to update report", error: errorMessage });
  }
});

// Get reports statistics endpoint
app.get("/api/reports/stats", async (req, res) => {
  try {
    const stats = await storage.getReportsStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message: "Failed to fetch stats", error: errorMessage });
  }
});

// Case notes endpoints
app.post("/api/reports/:id/notes", async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    
    if (!note || typeof note !== 'string') {
      return res.status(400).json({ message: "Note is required" });
    }
    
    // In a real app, you'd get the user ID from the session
    const addedById = (req.user as any)?.id || 'system';
    
    const caseNote = await storage.createCaseNote({
      reportId: id,
      note,
      addedById,
    });
    
    res.status(201).json(caseNote);
  } catch (error) {
    console.error("Error creating case note:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message: "Failed to create case note", error: errorMessage });
  }
});

app.get("/api/reports/:id/notes", async (req, res) => {
  try {
    const { id } = req.params;
    const notes = await storage.getCaseNotesByReportId(id);
    res.json(notes);
  } catch (error) {
    console.error("Error fetching case notes:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message: "Failed to fetch case notes", error: errorMessage });
  }
});

// API-only routes - static files are handled by Vercel
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "API endpoint not found" });
  }
  // This shouldn't be reached since Vercel handles static files
  res.status(404).json({ message: "Not found" });
});

export default app;