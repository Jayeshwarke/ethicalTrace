import { users, reports, caseNotes, type User, type InsertUser, type Report, type InsertReport, type CaseNote, type InsertCaseNote } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, count } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { Store } from "express-session";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
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

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
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
      const conditions = [];
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

export const storage = new DatabaseStorage();
