import { pgTable, text, serial, integer, boolean, timestamp, json, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User accounts
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["admin", "user"] }).default("user").notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Family members (max 4 per account)
export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  relationship: text("relationship", { 
    enum: ["mother", "father", "partner", "grandparent", "other"] 
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Child profiles
export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  gender: text("gender", { enum: ["male", "female", "other"] }),
  birthDate: timestamp("birth_date"),
  dueDate: timestamp("due_date"),
  isPregnancy: boolean("is_pregnancy").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pregnancy journal
export const pregnancyJournal = pgTable("pregnancy_journal", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  week: integer("week").notNull(),
  notes: text("notes"),
  symptoms: json("symptoms").default({}).notNull(),
  babySize: text("baby_size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Symptoms
export const symptoms = pgTable("symptoms", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  name: text("name").notNull(),
  severity: integer("severity").default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Milestones
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  description: text("description"),
  category: text("category", { 
    enum: ["pregnancy", "birth", "first", "growth", "health", "other"]
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Growth records (height, weight, etc)
export const growthRecords = pgTable("growth_records", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  weight: integer("weight"), // in grams
  height: integer("height"), // in mm
  headCircumference: integer("head_circumference"), // in mm
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Appointments
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  time: text("time"),
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Photos
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  description: text("description"),
  takenAt: timestamp("taken_at"),
  tags: json("tags").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Vaccinations
export const vaccinations = pgTable("vaccinations", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isPremium: true,
  role: true
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
  createdAt: true
});

export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true
});

export const insertPregnancyJournalSchema = createInsertSchema(pregnancyJournal).omit({
  id: true,
  createdAt: true
});

export const insertSymptomSchema = createInsertSchema(symptoms).omit({
  id: true, 
  createdAt: true
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  createdAt: true
});

export const insertGrowthRecordSchema = createInsertSchema(growthRecords).omit({
  id: true,
  createdAt: true
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true
});

export const insertVaccinationSchema = createInsertSchema(vaccinations).omit({
  id: true,
  createdAt: true
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;

export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;

export type PregnancyJournal = typeof pregnancyJournal.$inferSelect;
export type InsertPregnancyJournal = z.infer<typeof insertPregnancyJournalSchema>;

export type Symptom = typeof symptoms.$inferSelect;
export type InsertSymptom = z.infer<typeof insertSymptomSchema>;

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;

export type GrowthRecord = typeof growthRecords.$inferSelect;
export type InsertGrowthRecord = z.infer<typeof insertGrowthRecordSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type Vaccination = typeof vaccinations.$inferSelect;
export type InsertVaccination = z.infer<typeof insertVaccinationSchema>;

// Extend schemas with validation
export const userSchema = insertUserSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters long"),
  email: z.string().email("Please enter a valid email address")
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

export type LoginData = z.infer<typeof loginSchema>;
