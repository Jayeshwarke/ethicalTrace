import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("role", ["admin", "user"]);
export const reportStatusEnum = pgEnum("status", ["new", "investigating", "pending", "resolved", "closed"]);
export const reportCategoryEnum = pgEnum("category", ["harassment", "safety", "ethics", "fraud", "other"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackingId: text("tracking_id").notNull().unique(),
  category: reportCategoryEnum("category").notNull(),
  description: text("description").notNull(),
  reporterName: text("reporter_name"),
  reporterEmail: text("reporter_email"),
  anonymous: boolean("anonymous").default(false).notNull(),
  fileUrl: text("file_url"),
  status: reportStatusEnum("status").default("new").notNull(),
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const caseNotes = pgTable("case_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => reports.id).notNull(),
  note: text("note").notNull(),
  addedById: varchar("added_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reportsRelations = relations(reports, ({ one, many }) => ({
  assignedTo: one(users, {
    fields: [reports.assignedToId],
    references: [users.id],
  }),
  notes: many(caseNotes),
}));

export const caseNotesRelations = relations(caseNotes, ({ one }) => ({
  report: one(reports, {
    fields: [caseNotes.reportId],
    references: [reports.id],
  }),
  addedBy: one(users, {
    fields: [caseNotes.addedById],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  assignedReports: many(reports),
  notes: many(caseNotes),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertReportSchema = createInsertSchema(reports).pick({
  category: true,
  description: true,
  reporterName: true,
  reporterEmail: true,
  anonymous: true,
  fileUrl: true,
});

export const insertCaseNoteSchema = createInsertSchema(caseNotes).pick({
  reportId: true,
  note: true,
});

export const updateReportStatusSchema = z.object({
  status: z.enum(["new", "investigating", "pending", "resolved", "closed"]),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertCaseNote = z.infer<typeof insertCaseNoteSchema>;
export type CaseNote = typeof caseNotes.$inferSelect;
export type UpdateReportStatus = z.infer<typeof updateReportStatusSchema>;
