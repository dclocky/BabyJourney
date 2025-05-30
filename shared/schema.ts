import { pgTable, text, serial, integer, boolean, timestamp, json, uniqueIndex, varchar, decimal, date } from "drizzle-orm/pg-core";
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
  partnerId: integer("partner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Family members (max 4 per account)
export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  relationship: text("relationship").notNull(),
  // These fields are planned for future implementation
  // canViewMedical: boolean("can_view_medical").default(false).notNull(),
  // canEditProfile: boolean("can_edit_profile").default(false).notNull(),
  // canUploadPhotos: boolean("can_upload_photos").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Child profiles
export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  gender: text("gender", { enum: ["boy", "girl", "unknown"] }),
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
  // Image data stored as base64
  imageData: text("image_data"),
  imageType: text("image_type"), // e.g., image/jpeg, image/png
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
  // Doctor mode fields
  doctorName: text("doctor_name"),
  doctorSpecialty: text("doctor_specialty"),
  diagnosis: text("diagnosis"),
  treatment: text("treatment"),
  prescriptions: text("prescriptions"),
  followUpDate: timestamp("follow_up_date"),
  doctorNotes: text("doctor_notes"),
  vitals: json("vitals").default({}),
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

// Registry for baby items wishlist
export const registries = pgTable("registries", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(true).notNull(),
  shareCode: varchar("share_code", { length: 16 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Registry items
export const registryItems = pgTable("registry_items", {
  id: serial("id").primaryKey(),
  registryId: integer("registry_id").references(() => registries.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  url: text("url"),
  imageUrl: text("image_url"),
  quantity: integer("quantity").default(1).notNull(),
  priority: text("priority", { enum: ["high", "medium", "low"] }).default("medium").notNull(),
  category: text("category").notNull(),
  price: integer("price"), // stored in cents
  status: text("status", { enum: ["available", "reserved", "purchased"] }).default("available").notNull(),
  reservedBy: text("reserved_by"),
  reservedByEmail: text("reserved_by_email"),
  purchasedBy: text("purchased_by"),
  purchasedByEmail: text("purchased_by_email"),
  reservedAt: timestamp("reserved_at"),
  purchasedAt: timestamp("purchased_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const insertRegistrySchema = createInsertSchema(registries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  shareCode: true // System generated
});

// Contractions table
export const contractions = pgTable("contractions", {
  id: serial("id").primaryKey(),
  pregnancyId: integer("pregnancy_id").references(() => children.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  intensity: text("intensity", { enum: ["mild", "moderate", "strong"] }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Baby preferences table
export const babyPreferences = pgTable("baby_preferences", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  category: text("category", { enum: ["music", "toys", "activities", "food", "books", "sounds", "other"] }).notNull(),
  item: text("item").notNull(),
  preference: text("preference", { enum: ["likes", "dislikes", "neutral"] }).notNull(),
  intensity: integer("intensity").notNull(), // 1-5 scale
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBabyPreferenceSchema = createInsertSchema(babyPreferences).omit({
  id: true,
  createdAt: true
});

export const insertRegistryItemSchema = createInsertSchema(registryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reservedAt: true,
  purchasedAt: true
});

export const insertContractionSchema = createInsertSchema(contractions).omit({
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

export type Registry = typeof registries.$inferSelect;
export type InsertRegistry = z.infer<typeof insertRegistrySchema>;

export type RegistryItem = typeof registryItems.$inferSelect;
export type InsertRegistryItem = z.infer<typeof insertRegistryItemSchema>;

export type Contraction = typeof contractions.$inferSelect;
export type InsertContraction = z.infer<typeof insertContractionSchema>;

// Cravings table
export const cravings = pgTable("cravings", {
  id: serial("id").primaryKey(),
  pregnancyId: integer("pregnancy_id").references(() => children.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  foodName: text("food_name").notNull(),
  intensity: integer("intensity"),
  satisfied: boolean("satisfied").default(false),
  notes: text("notes"),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCravingSchema = createInsertSchema(cravings).omit({
  id: true,
  createdAt: true
});

export type Craving = typeof cravings.$inferSelect;
export type InsertCraving = z.infer<typeof insertCravingSchema>;

// ===== BABY TRACKING FEATURES =====
// Daily Care Tracking Tables
export const feedingLogs = pgTable("feeding_logs", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'bottle', 'breast', 'solids'
  amount: integer("amount"), // in ml for bottle, minutes for breast
  duration: integer("duration"), // in minutes for breastfeeding
  food: varchar("food", { length: 200 }), // for solids
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const diaperLogs = pgTable("diaper_logs", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'wet', 'dirty', 'both'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sleepLogs = pgTable("sleep_logs", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in minutes
  type: varchar("type", { length: 20 }).notNull(), // 'nap', 'night'
  quality: varchar("quality", { length: 20 }), // 'good', 'fair', 'poor'
  location: varchar("location", { length: 50 }), // 'crib', 'bed', 'stroller'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Growth & Development Tables
export const developmentalLeaps = pgTable("developmental_leaps", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  leapNumber: integer("leap_number").notNull(), // Wonder Weeks leap number
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  stage: varchar("stage", { length: 50 }).notNull(), // 'stormy', 'sunny', 'completed'
  behaviors: text("behaviors").array(), // observed behaviors
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const doctorVisits = pgTable("doctor_visits", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'checkup', 'sick_visit', 'vaccination'
  doctorName: varchar("doctor_name", { length: 100 }),
  clinic: varchar("clinic", { length: 100 }),
  weight: varchar("weight", { length: 10 }), // stored as string for simplicity
  length: varchar("length", { length: 10 }), // stored as string for simplicity
  notes: text("notes"),
  concerns: text("concerns"),
  recommendations: text("recommendations"),
  nextVisit: timestamp("next_visit"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new baby tracking features
export const insertFeedingLogSchema = createInsertSchema(feedingLogs).omit({
  id: true,
  createdAt: true
});

export const insertDiaperLogSchema = createInsertSchema(diaperLogs).omit({
  id: true,
  createdAt: true
});

export const insertSleepLogSchema = createInsertSchema(sleepLogs).omit({
  id: true,
  createdAt: true
});

export const insertDevelopmentalLeapSchema = createInsertSchema(developmentalLeaps).omit({
  id: true,
  createdAt: true
});

export const insertDoctorVisitSchema = createInsertSchema(doctorVisits).omit({
  id: true,
  createdAt: true
});

// Types for baby tracking features
export type InsertFeedingLog = z.infer<typeof insertFeedingLogSchema>;
export type SelectFeedingLog = typeof feedingLogs.$inferSelect;
export type InsertDiaperLog = z.infer<typeof insertDiaperLogSchema>;
export type SelectDiaperLog = typeof diaperLogs.$inferSelect;
export type InsertSleepLog = z.infer<typeof insertSleepLogSchema>;
export type SelectSleepLog = typeof sleepLogs.$inferSelect;
export type InsertDevelopmentalLeap = z.infer<typeof insertDevelopmentalLeapSchema>;
export type SelectDevelopmentalLeap = typeof developmentalLeaps.$inferSelect;
export type InsertDoctorVisit = z.infer<typeof insertDoctorVisitSchema>;
export type SelectDoctorVisit = typeof doctorVisits.$inferSelect;

// ===== PRIVATE FAMILY GROUPS FEATURE =====
// Family Groups - Allow families to share child data with trusted members
export const familyGroups = pgTable("family_groups", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").references(() => children.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  inviteCode: varchar("invite_code", { length: 32 }).unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Group Members with Roles and Permissions
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => familyGroups.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'owner', 'admin', 'contributor', 'viewer'
  permissions: json("permissions").$type<{
    canViewPhotos: boolean;
    canViewMedical: boolean;
    canViewFeeding: boolean;
    canViewSleep: boolean;
    canViewDiapers: boolean;
    canAddData: boolean;
    canInviteMembers: boolean;
    canManageGroup: boolean;
  }>(),
  joinedAt: timestamp("joined_at").defaultNow(),
  invitedBy: integer("invited_by").references(() => users.id),
});

// Invitation System with Token-based Security
export const groupInvitations = pgTable("group_invitations", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => familyGroups.id).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 128 }).unique().notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  permissions: json("permissions").$type<{
    canViewPhotos: boolean;
    canViewMedical: boolean;
    canViewFeeding: boolean;
    canViewSleep: boolean;
    canViewDiapers: boolean;
    canAddData: boolean;
    canInviteMembers: boolean;
    canManageGroup: boolean;
  }>(),
  invitedBy: integer("invited_by").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity Feed for Group Updates
export const groupActivities = pgTable("group_activities", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => familyGroups.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // 'feeding_added', 'photo_shared', 'milestone_reached'
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  metadata: json("metadata"), // Store activity-specific data
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments on Activities
export const activityComments = pgTable("activity_comments", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => groupActivities.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isEdited: boolean("is_edited").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Likes/Reactions on Activities
export const activityLikes = pgTable("activity_likes", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => groupActivities.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  reactionType: varchar("reaction_type", { length: 20 }).default("like"), // 'like', 'love', 'laugh'
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit Log for Security and Compliance
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => familyGroups.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  action: varchar("action", { length: 100 }).notNull(), // 'member_invited', 'data_accessed', 'permission_changed'
  resourceType: varchar("resource_type", { length: 50 }), // 'feeding_log', 'photo', 'group_settings'
  resourceId: integer("resource_id"),
  oldValues: json("old_values"),
  newValues: json("new_values"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for private groups
export const insertFamilyGroupSchema = createInsertSchema(familyGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  inviteCode: true
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({
  id: true,
  joinedAt: true
});

export const insertGroupInvitationSchema = createInsertSchema(groupInvitations).omit({
  id: true,
  token: true,
  createdAt: true,
  acceptedAt: true
});

export const insertGroupActivitySchema = createInsertSchema(groupActivities).omit({
  id: true,
  createdAt: true
});

export const insertActivityCommentSchema = createInsertSchema(activityComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isEdited: true
});

export const insertActivityLikeSchema = createInsertSchema(activityLikes).omit({
  id: true,
  createdAt: true
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true
});

// Types for private groups
export type InsertFamilyGroup = z.infer<typeof insertFamilyGroupSchema>;
export type SelectFamilyGroup = typeof familyGroups.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type SelectGroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupInvitation = z.infer<typeof insertGroupInvitationSchema>;
export type SelectGroupInvitation = typeof groupInvitations.$inferSelect;
export type InsertGroupActivity = z.infer<typeof insertGroupActivitySchema>;
export type SelectGroupActivity = typeof groupActivities.$inferSelect;
export type InsertActivityComment = z.infer<typeof insertActivityCommentSchema>;
export type SelectActivityComment = typeof activityComments.$inferSelect;
export type InsertActivityLike = z.infer<typeof insertActivityLikeSchema>;
export type SelectActivityLike = typeof activityLikes.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type SelectAuditLog = typeof auditLogs.$inferSelect;

// Baby Name Ideas table
export const babyNames = pgTable("baby_names", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  childId: integer("child_id").references(() => children.id), // Optional - can be for a specific pregnancy or general
  name: text("name").notNull(),
  meaning: text("meaning"),
  origin: text("origin"),
  gender: text("gender", { enum: ["male", "female", "neutral"] }),
  rating: integer("rating").default(0), // Rating from 1-5
  isFavorite: boolean("is_favorite").default(false),
  notes: text("notes"),
  suggestedBy: text("suggested_by"), // Who suggested this name?
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBabyNameSchema = createInsertSchema(babyNames).omit({
  id: true,
  createdAt: true
});

export type BabyName = typeof babyNames.$inferSelect;
export type InsertBabyName = z.infer<typeof insertBabyNameSchema>;

export type SelectBabyPreference = typeof babyPreferences.$inferSelect;
export type InsertBabyPreference = z.infer<typeof insertBabyPreferenceSchema>;

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

// Conception Tracking Tables
export const ovulationCycles = pgTable("ovulation_cycles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  cycleStartDate: date("cycle_start_date").notNull(),
  cycleLength: integer("cycle_length").default(28).notNull(),
  ovulationDate: date("ovulation_date"),
  lutealPhaseLength: integer("luteal_phase_length"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fertilitySymptoms = pgTable("fertility_symptoms", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  cycleId: integer("cycle_id").references(() => ovulationCycles.id),
  date: date("date").notNull(),
  basalBodyTemp: decimal("basal_body_temp", { precision: 4, scale: 2 }),
  cervicalMucus: text("cervical_mucus", { enum: ["dry", "sticky", "creamy", "watery", "egg_white"] }),
  cervicalPosition: text("cervical_position", { enum: ["low", "medium", "high"] }),
  cervicalFirmness: text("cervical_firmness", { enum: ["firm", "medium", "soft"] }),
  ovulationPain: boolean("ovulation_pain").default(false),
  breastTenderness: boolean("breast_tenderness").default(false),
  mood: text("mood", { enum: ["happy", "neutral", "sad", "irritable", "anxious"] }),
  energyLevel: integer("energy_level"), // 1-5 scale
  libido: integer("libido"), // 1-5 scale
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ovulationTests = pgTable("ovulation_tests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  cycleId: integer("cycle_id").references(() => ovulationCycles.id),
  date: date("date").notNull(),
  testTime: text("test_time").notNull(),
  result: text("result", { enum: ["negative", "positive", "peak"] }).notNull(),
  testBrand: text("test_brand"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const intimacyTracking = pgTable("intimacy_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  cycleId: integer("cycle_id").references(() => ovulationCycles.id),
  date: date("date").notNull(),
  wasProtected: boolean("was_protected").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conceptionGoals = pgTable("conception_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  targetConceptionDate: date("target_conception_date"),
  vitaminsSupplement: boolean("vitamins_supplement").default(false),
  folicAcidDaily: boolean("folic_acid_daily").default(false),
  exerciseRoutine: text("exercise_routine"),
  dietaryChanges: text("dietary_changes"),
  stressManagement: text("stress_management"),
  sleepHours: integer("sleep_hours"),
  caffeineLimit: boolean("caffeine_limit").default(false),
  alcoholLimit: boolean("alcohol_limit").default(false),
  smokingCessation: boolean("smoking_cessation").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Conception tracking insert schemas
export const insertOvulationCycleSchema = createInsertSchema(ovulationCycles).omit({
  id: true,
  createdAt: true
});

export const insertFertilitySymptomSchema = createInsertSchema(fertilitySymptoms).omit({
  id: true,
  createdAt: true
});

export const insertOvulationTestSchema = createInsertSchema(ovulationTests).omit({
  id: true,
  createdAt: true
});

export const insertIntimacyTrackingSchema = createInsertSchema(intimacyTracking).omit({
  id: true,
  createdAt: true
});

export const insertConceptionGoalSchema = createInsertSchema(conceptionGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Conception tracking types
export type OvulationCycle = typeof ovulationCycles.$inferSelect;
export type InsertOvulationCycle = z.infer<typeof insertOvulationCycleSchema>;
export type FertilitySymptom = typeof fertilitySymptoms.$inferSelect;
export type InsertFertilitySymptom = z.infer<typeof insertFertilitySymptomSchema>;
export type OvulationTest = typeof ovulationTests.$inferSelect;
export type InsertOvulationTest = z.infer<typeof insertOvulationTestSchema>;
export type IntimacyTracking = typeof intimacyTracking.$inferSelect;
export type InsertIntimacyTracking = z.infer<typeof insertIntimacyTrackingSchema>;
export type ConceptionGoal = typeof conceptionGoals.$inferSelect;
export type InsertConceptionGoal = z.infer<typeof insertConceptionGoalSchema>;
