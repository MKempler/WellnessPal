import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const painLogs = pgTable("pain_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  painLevel: integer("pain_level").notNull(), // 1-10
  tags: json("tags").$type<string[]>().default([]),
  notes: text("notes"),
  date: timestamp("date").defaultNow().notNull(),
});

export const moodLogs = pgTable("mood_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mood: integer("mood").notNull(), // 1-5 (very sad to very happy)
  anxietyLevel: integer("anxiety_level").notNull(), // 1-10
  triggers: json("triggers").$type<string[]>().default([]),
  helpers: json("helpers").$type<string[]>().default([]),
  notes: text("notes"),
  date: timestamp("date").defaultNow().notNull(),
});

export const interventions = pgTable("interventions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  frequency: text("frequency").notNull(),
  currentStreak: integer("current_streak").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const interventionLogs = pgTable("intervention_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  interventionId: integer("intervention_id").notNull(),
  painLevel: integer("pain_level").notNull(),
  notes: text("notes"),
  date: timestamp("date").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  isFromUser: boolean("is_from_user").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
  firebaseUid: true,
});

export const insertPainLogSchema = createInsertSchema(painLogs).pick({
  painLevel: true,
  notes: true,
  tags: true,
}).extend({
  painLevel: z.number().min(1).max(10),
  tags: z.array(z.string()).default([]),
});

export const insertMoodLogSchema = createInsertSchema(moodLogs).pick({
  mood: true,
  anxietyLevel: true,
  triggers: true,
  helpers: true,
  notes: true,
}).extend({
  mood: z.number().min(1).max(5),
  anxietyLevel: z.number().min(1).max(10),
  triggers: z.array(z.string()).default([]),
  helpers: z.array(z.string()).default([]),
});

export const insertInterventionSchema = createInsertSchema(interventions).pick({
  name: true,
  frequency: true,
});

export const insertInterventionLogSchema = createInsertSchema(interventionLogs).pick({
  interventionId: true,
  painLevel: true,
  notes: true,
}).extend({
  painLevel: z.number().min(1).max(10),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  content: true,
  isFromUser: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PainLog = typeof painLogs.$inferSelect;
export type InsertPainLog = z.infer<typeof insertPainLogSchema>;
export type MoodLog = typeof moodLogs.$inferSelect;
export type InsertMoodLog = z.infer<typeof insertMoodLogSchema>;
export type Intervention = typeof interventions.$inferSelect;
export type InsertIntervention = z.infer<typeof insertInterventionSchema>;
export type InterventionLog = typeof interventionLogs.$inferSelect;
export type InsertInterventionLog = z.infer<typeof insertInterventionLogSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
