import { 
  users, type User, type InsertUser, 
  familyMembers, type FamilyMember, type InsertFamilyMember,
  children, type Child, type InsertChild,
  pregnancyJournal, type PregnancyJournal, type InsertPregnancyJournal,
  symptoms, type Symptom, type InsertSymptom, 
  milestones, type Milestone, type InsertMilestone,
  growthRecords, type GrowthRecord, type InsertGrowthRecord,
  appointments, type Appointment, type InsertAppointment,
  photos, type Photo, type InsertPhoto,
  vaccinations, type Vaccination, type InsertVaccination,
  registries, type Registry, type InsertRegistry,
  registryItems, type RegistryItem, type InsertRegistryItem,
  contractions, type Contraction, type InsertContraction
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db, pool } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // Pregnancy methods
  getPregnanciesForUser(userId: number): Promise<Child[]>;
  createPregnancy(pregnancy: InsertChild): Promise<Child>;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  updateUserPremiumStatus(id: number, isPremium: boolean): Promise<User | undefined>;

  // Family member methods
  getFamilyMembers(userId: number): Promise<FamilyMember[]>;
  getFamilyMemberCount(userId: number): Promise<number>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  updateFamilyMember(id: number, member: Partial<FamilyMember>): Promise<FamilyMember | undefined>;
  deleteFamilyMember(id: number): Promise<boolean>;

  // Child methods
  getChildren(userId: number): Promise<Child[]>;
  getChild(id: number): Promise<Child | undefined>;
  getChildCount(userId: number): Promise<number>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: number, child: Partial<Child>): Promise<Child | undefined>;
  deleteChild(id: number): Promise<boolean>;

  // Pregnancy journal methods
  getPregnancyJournals(childId: number): Promise<PregnancyJournal[]>;
  getPregnancyJournalByWeek(childId: number, week: number): Promise<PregnancyJournal | undefined>;
  createPregnancyJournal(journal: InsertPregnancyJournal): Promise<PregnancyJournal>;
  updatePregnancyJournal(id: number, journal: Partial<PregnancyJournal>): Promise<PregnancyJournal | undefined>;

  // Symptom methods
  getSymptoms(childId: number): Promise<Symptom[]>;
  createSymptom(symptom: InsertSymptom): Promise<Symptom>;
  deleteSymptom(id: number): Promise<boolean>;

  // Milestone methods
  getMilestones(childId: number): Promise<Milestone[]>;
  getRecentMilestones(childId: number, limit: number): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  updateMilestone(id: number, milestone: Partial<Milestone>): Promise<Milestone | undefined>;
  deleteMilestone(id: number): Promise<boolean>;

  // Growth record methods
  getGrowthRecords(childId: number): Promise<GrowthRecord[]>;
  createGrowthRecord(record: InsertGrowthRecord): Promise<GrowthRecord>;
  updateGrowthRecord(id: number, record: Partial<GrowthRecord>): Promise<GrowthRecord | undefined>;

  // Appointment methods
  getAppointments(childId: number): Promise<Appointment[]>;
  getUpcomingAppointments(childId: number, limit: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;

  // Photo methods
  getPhotos(childId: number): Promise<Photo[]>;
  getPhotoCount(childId: number): Promise<number>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: number): Promise<boolean>;

  // Vaccination methods
  getVaccinations(childId: number): Promise<Vaccination[]>;
  createVaccination(vaccination: InsertVaccination): Promise<Vaccination>;
  deleteVaccination(id: number): Promise<boolean>;
  
  // Registry methods
  getRegistriesByUserId(userId: number): Promise<Registry[]>;
  getRegistryByChildId(childId: number): Promise<Registry | undefined>;
  getRegistryByShareCode(shareCode: string): Promise<Registry | undefined>;
  createRegistry(registry: InsertRegistry): Promise<Registry>;
  updateRegistry(id: number, registry: Partial<Registry>): Promise<Registry | undefined>;
  deleteRegistry(id: number): Promise<boolean>;
  
  // Registry item methods
  getRegistryItems(registryId: number): Promise<RegistryItem[]>;
  getRegistryItem(id: number): Promise<RegistryItem | undefined>;
  createRegistryItem(item: InsertRegistryItem): Promise<RegistryItem>;
  updateRegistryItem(id: number, item: Partial<RegistryItem>): Promise<RegistryItem | undefined>;
  deleteRegistryItem(id: number): Promise<boolean>;
  updateRegistryItemStatus(id: number, status: "available" | "reserved" | "purchased", personInfo: { name?: string; email?: string }): Promise<RegistryItem | undefined>;
  
  // Contraction methods
  getContractions(pregnancyId: number): Promise<Contraction[]>;
  getContraction(id: number): Promise<Contraction | undefined>;
  createContraction(contraction: InsertContraction): Promise<Contraction>;
  updateContraction(id: number, contraction: Partial<Contraction>): Promise<Contraction | undefined>;
  deleteContraction(id: number): Promise<boolean>;
  
  // Helper method for getting a pregnancy (child record that is_pregnancy=true)
  getPregnancy(id: number): Promise<Child | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private familyMembers: Map<number, FamilyMember>;
  private children: Map<number, Child>;
  private pregnancyJournals: Map<number, PregnancyJournal>;
  private symptoms: Map<number, Symptom>;
  private milestones: Map<number, Milestone>;
  private growthRecords: Map<number, GrowthRecord>;
  private appointments: Map<number, Appointment>;
  private photos: Map<number, Photo>;
  private vaccinations: Map<number, Vaccination>;
  private registries: Map<number, Registry>;
  private registryItems: Map<number, RegistryItem>;
  private contractions: Map<number, Contraction>;
  public sessionStore: session.Store;

  private userIdCounter: number = 1;
  private familyMemberIdCounter: number = 1;
  private childIdCounter: number = 1;
  private pregnancyJournalIdCounter: number = 1;
  private symptomIdCounter: number = 1;
  private milestoneIdCounter: number = 1;
  private growthRecordIdCounter: number = 1;
  private appointmentIdCounter: number = 1;
  private photoIdCounter: number = 1;
  private vaccinationIdCounter: number = 1;
  private registryIdCounter: number = 1;
  private registryItemIdCounter: number = 1;
  private contractionIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.familyMembers = new Map();
    this.children = new Map();
    this.pregnancyJournals = new Map();
    this.symptoms = new Map();
    this.milestones = new Map();
    this.growthRecords = new Map();
    this.appointments = new Map();
    this.photos = new Map();
    this.vaccinations = new Map();
    this.registries = new Map();
    this.registryItems = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id, 
      role: "user", 
      isPremium: false, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...updates
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPremiumStatus(id: number, isPremium: boolean): Promise<User | undefined> {
    return this.updateUser(id, { isPremium });
  }

  // Family member methods
  async getFamilyMembers(userId: number): Promise<FamilyMember[]> {
    return Array.from(this.familyMembers.values()).filter(
      (member) => member.userId === userId
    );
  }

  async getFamilyMemberCount(userId: number): Promise<number> {
    return (await this.getFamilyMembers(userId)).length;
  }

  async createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    const id = this.familyMemberIdCounter++;
    const familyMember: FamilyMember = {
      ...member,
      id,
      createdAt: new Date()
    };
    this.familyMembers.set(id, familyMember);
    return familyMember;
  }

  async updateFamilyMember(id: number, updates: Partial<FamilyMember>): Promise<FamilyMember | undefined> {
    const member = this.familyMembers.get(id);
    if (!member) return undefined;
    
    const updatedMember: FamilyMember = {
      ...member,
      ...updates
    };
    
    this.familyMembers.set(id, updatedMember);
    return updatedMember;
  }

  async deleteFamilyMember(id: number): Promise<boolean> {
    return this.familyMembers.delete(id);
  }

  // Child methods
  async getChildren(userId: number): Promise<Child[]> {
    return Array.from(this.children.values()).filter(
      (child) => child.userId === userId
    );
  }

  async getChild(id: number): Promise<Child | undefined> {
    return this.children.get(id);
  }

  async getChildCount(userId: number): Promise<number> {
    return (await this.getChildren(userId)).length;
  }

  async createChild(insertChild: InsertChild): Promise<Child> {
    const id = this.childIdCounter++;
    const child: Child = {
      ...insertChild,
      id,
      createdAt: new Date()
    };
    this.children.set(id, child);
    return child;
  }

  async updateChild(id: number, updates: Partial<Child>): Promise<Child | undefined> {
    const child = await this.getChild(id);
    if (!child) return undefined;
    
    const updatedChild: Child = {
      ...child,
      ...updates
    };
    
    this.children.set(id, updatedChild);
    return updatedChild;
  }

  async deleteChild(id: number): Promise<boolean> {
    return this.children.delete(id);
  }

  // Pregnancy journal methods
  async getPregnancyJournals(childId: number): Promise<PregnancyJournal[]> {
    return Array.from(this.pregnancyJournals.values()).filter(
      (journal) => journal.childId === childId
    ).sort((a, b) => a.week - b.week);
  }

  async getPregnancyJournalByWeek(childId: number, week: number): Promise<PregnancyJournal | undefined> {
    return Array.from(this.pregnancyJournals.values()).find(
      (journal) => journal.childId === childId && journal.week === week
    );
  }

  async createPregnancyJournal(journal: InsertPregnancyJournal): Promise<PregnancyJournal> {
    const id = this.pregnancyJournalIdCounter++;
    const pregnancyJournal: PregnancyJournal = {
      ...journal,
      id,
      createdAt: new Date()
    };
    this.pregnancyJournals.set(id, pregnancyJournal);
    return pregnancyJournal;
  }

  async updatePregnancyJournal(id: number, updates: Partial<PregnancyJournal>): Promise<PregnancyJournal | undefined> {
    const journal = this.pregnancyJournals.get(id);
    if (!journal) return undefined;
    
    const updatedJournal: PregnancyJournal = {
      ...journal,
      ...updates
    };
    
    this.pregnancyJournals.set(id, updatedJournal);
    return updatedJournal;
  }

  // Symptom methods
  async getSymptoms(childId: number): Promise<Symptom[]> {
    return Array.from(this.symptoms.values()).filter(
      (symptom) => symptom.childId === childId
    ).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createSymptom(symptom: InsertSymptom): Promise<Symptom> {
    const id = this.symptomIdCounter++;
    const newSymptom: Symptom = {
      ...symptom,
      id,
      createdAt: new Date()
    };
    this.symptoms.set(id, newSymptom);
    return newSymptom;
  }

  async deleteSymptom(id: number): Promise<boolean> {
    return this.symptoms.delete(id);
  }

  // Milestone methods
  async getMilestones(childId: number): Promise<Milestone[]> {
    return Array.from(this.milestones.values()).filter(
      (milestone) => milestone.childId === childId
    ).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getRecentMilestones(childId: number, limit: number): Promise<Milestone[]> {
    return (await this.getMilestones(childId)).slice(0, limit);
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const id = this.milestoneIdCounter++;
    const newMilestone: Milestone = {
      ...milestone,
      id,
      createdAt: new Date()
    };
    this.milestones.set(id, newMilestone);
    return newMilestone;
  }

  async updateMilestone(id: number, updates: Partial<Milestone>): Promise<Milestone | undefined> {
    const milestone = this.milestones.get(id);
    if (!milestone) return undefined;
    
    const updatedMilestone: Milestone = {
      ...milestone,
      ...updates
    };
    
    this.milestones.set(id, updatedMilestone);
    return updatedMilestone;
  }

  async deleteMilestone(id: number): Promise<boolean> {
    return this.milestones.delete(id);
  }

  // Growth record methods
  async getGrowthRecords(childId: number): Promise<GrowthRecord[]> {
    return Array.from(this.growthRecords.values()).filter(
      (record) => record.childId === childId
    ).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createGrowthRecord(record: InsertGrowthRecord): Promise<GrowthRecord> {
    const id = this.growthRecordIdCounter++;
    const newRecord: GrowthRecord = {
      ...record,
      id,
      createdAt: new Date()
    };
    this.growthRecords.set(id, newRecord);
    return newRecord;
  }

  async updateGrowthRecord(id: number, updates: Partial<GrowthRecord>): Promise<GrowthRecord | undefined> {
    const record = this.growthRecords.get(id);
    if (!record) return undefined;
    
    const updatedRecord: GrowthRecord = {
      ...record,
      ...updates
    };
    
    this.growthRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  // Appointment methods
  async getAppointments(childId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.childId === childId
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getUpcomingAppointments(childId: number, limit: number): Promise<Appointment[]> {
    const now = new Date();
    return Array.from(this.appointments.values())
      .filter(appointment => appointment.childId === childId && appointment.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, limit);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const newAppointment: Appointment = {
      ...appointment,
      id,
      createdAt: new Date()
    };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }

  async updateAppointment(id: number, updates: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment: Appointment = {
      ...appointment,
      ...updates
    };
    
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // Photo methods
  async getPhotos(childId: number): Promise<Photo[]> {
    return Array.from(this.photos.values()).filter(
      (photo) => photo.childId === childId
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPhotoCount(childId: number): Promise<number> {
    return (await this.getPhotos(childId)).length;
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const id = this.photoIdCounter++;
    const newPhoto: Photo = {
      ...photo,
      id,
      createdAt: new Date()
    };
    this.photos.set(id, newPhoto);
    return newPhoto;
  }

  async deletePhoto(id: number): Promise<boolean> {
    return this.photos.delete(id);
  }

  // Vaccination methods
  async getVaccinations(childId: number): Promise<Vaccination[]> {
    return Array.from(this.vaccinations.values()).filter(
      (vaccination) => vaccination.childId === childId
    ).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createVaccination(vaccination: InsertVaccination): Promise<Vaccination> {
    const id = this.vaccinationIdCounter++;
    const newVaccination: Vaccination = {
      ...vaccination,
      id,
      createdAt: new Date()
    };
    this.vaccinations.set(id, newVaccination);
    return newVaccination;
  }

  async deleteVaccination(id: number): Promise<boolean> {
    return this.vaccinations.delete(id);
  }

  // Registry methods
  async getPregnanciesForUser(userId: number): Promise<Child[]> {
    return Array.from(this.children.values()).filter(
      (child) => child.userId === userId && child.isPregnancy === true
    );
  }

  async createPregnancy(pregnancy: InsertChild): Promise<Child> {
    const id = this.childIdCounter++;
    const child: Child = {
      ...pregnancy,
      id,
      isPregnancy: true,
      createdAt: new Date()
    };
    this.children.set(id, child);
    return child;
  }

  async getRegistriesByUserId(userId: number): Promise<Registry[]> {
    return Array.from(this.registries.values()).filter(
      (registry) => registry.userId === userId
    );
  }

  async getRegistry(id: number): Promise<Registry | undefined> {
    return this.registries.get(id);
  }

  async getRegistryByChildId(childId: number): Promise<Registry | undefined> {
    return Array.from(this.registries.values()).find(
      (registry) => registry.childId === childId
    );
  }

  async getRegistryByShareCode(shareCode: string): Promise<Registry | undefined> {
    return Array.from(this.registries.values()).find(
      (registry) => registry.shareCode === shareCode
    );
  }

  async createRegistry(registry: InsertRegistry): Promise<Registry> {
    const id = this.registryIdCounter++;
    // Generate a random share code (8 characters alphanumeric)
    const shareCode = Math.random().toString(36).substring(2, 10);
    
    const newRegistry: Registry = {
      ...registry,
      id,
      shareCode,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.registries.set(id, newRegistry);
    return newRegistry;
  }

  async updateRegistry(id: number, updates: Partial<Registry>): Promise<Registry | undefined> {
    const registry = this.registries.get(id);
    if (!registry) return undefined;
    
    const updatedRegistry: Registry = {
      ...registry,
      ...updates,
      updatedAt: new Date()
    };
    
    this.registries.set(id, updatedRegistry);
    return updatedRegistry;
  }

  async deleteRegistry(id: number): Promise<boolean> {
    // Also delete all registry items associated with this registry
    const registryItems = Array.from(this.registryItems.values()).filter(
      (item) => item.registryId === id
    );
    
    for (const item of registryItems) {
      this.registryItems.delete(item.id);
    }
    
    return this.registries.delete(id);
  }

  // Registry item methods
  async getRegistryItems(registryId: number): Promise<RegistryItem[]> {
    return Array.from(this.registryItems.values()).filter(
      (item) => item.registryId === registryId
    );
  }

  async getRegistryItem(id: number): Promise<RegistryItem | undefined> {
    return this.registryItems.get(id);
  }

  async createRegistryItem(item: InsertRegistryItem): Promise<RegistryItem> {
    const id = this.registryItemIdCounter++;
    
    const newItem: RegistryItem = {
      ...item,
      id,
      status: "available",
      reserverName: null,
      reserverEmail: null,
      reservedAt: null,
      purchasedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.registryItems.set(id, newItem);
    return newItem;
  }

  async updateRegistryItem(id: number, updates: Partial<RegistryItem>): Promise<RegistryItem | undefined> {
    const item = this.registryItems.get(id);
    if (!item) return undefined;
    
    const updatedItem: RegistryItem = {
      ...item,
      ...updates,
      updatedAt: new Date()
    };
    
    this.registryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteRegistryItem(id: number): Promise<boolean> {
    return this.registryItems.delete(id);
  }

  async updateRegistryItemStatus(
    id: number, 
    status: "available" | "reserved" | "purchased", 
    personInfo: { name?: string; email?: string }
  ): Promise<RegistryItem | undefined> {
    const item = this.registryItems.get(id);
    if (!item) return undefined;
    
    const now = new Date();
    const updates: Partial<RegistryItem> = {
      status,
      updatedAt: now
    };
    
    if (status === "available") {
      updates.reserverName = null;
      updates.reserverEmail = null;
      updates.reservedAt = null;
      updates.purchasedAt = null;
    } else if (status === "reserved") {
      updates.reserverName = personInfo.name || null;
      updates.reserverEmail = personInfo.email || null;
      updates.reservedAt = now;
      updates.purchasedAt = null;
    } else if (status === "purchased") {
      updates.reserverName = personInfo.name || item.reserverName;
      updates.reserverEmail = personInfo.email || item.reserverEmail;
      updates.purchasedAt = now;
    }
    
    return this.updateRegistryItem(id, updates);
  }
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  // Pregnancy methods
  async getPregnanciesForUser(userId: number): Promise<Child[]> {
    return db
      .select()
      .from(children)
      .where(and(
        eq(children.userId, userId),
        eq(children.isPregnancy, true)
      ));
  }

  async createPregnancy(pregnancy: InsertChild): Promise<Child> {
    // Process dates properly to avoid toISOString error
    const processedPregnancy = {
      ...pregnancy,
      birthDate: pregnancy.birthDate ? (typeof pregnancy.birthDate === 'string' ? new Date(pregnancy.birthDate) : pregnancy.birthDate) : null,
      dueDate: pregnancy.dueDate ? (typeof pregnancy.dueDate === 'string' ? new Date(pregnancy.dueDate) : pregnancy.dueDate) : null,
      isPregnancy: true,
      createdAt: new Date()
    };

    const [newPregnancy] = await db
      .insert(children)
      .values(processedPregnancy)
      .returning();
    return newPregnancy;
  }

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      tableName: 'session', // Use the default table name for consistency
      createTableIfMissing: false, // Don't try to create the table since it already exists
      pruneSessionInterval: 60 * 15, // prune expired sessions every 15 minutes
      errorLog: console.error, // Add error logging
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: "user",
        isPremium: false,
        createdAt: new Date()
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserPremiumStatus(id: number, isPremium: boolean): Promise<User | undefined> {
    return this.updateUser(id, { isPremium });
  }

  // Family member methods
  async getFamilyMembers(userId: number): Promise<FamilyMember[]> {
    return db.select().from(familyMembers).where(eq(familyMembers.userId, userId));
  }

  async getFamilyMemberCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(familyMembers)
      .where(eq(familyMembers.userId, userId));
    return result[0]?.count || 0;
  }

  async createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    const [familyMember] = await db
      .insert(familyMembers)
      .values({
        ...member,
        createdAt: new Date()
      })
      .returning();
    return familyMember;
  }

  async updateFamilyMember(id: number, updates: Partial<FamilyMember>): Promise<FamilyMember | undefined> {
    const [updatedMember] = await db
      .update(familyMembers)
      .set(updates)
      .where(eq(familyMembers.id, id))
      .returning();
    return updatedMember;
  }

  async deleteFamilyMember(id: number): Promise<boolean> {
    const result = await db
      .delete(familyMembers)
      .where(eq(familyMembers.id, id));
    return result.rowCount > 0;
  }

  // Child methods
  async getChildren(userId: number): Promise<Child[]> {
    return db.select().from(children).where(eq(children.userId, userId));
  }

  async getChild(id: number): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }

  async getChildCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(children)
      .where(eq(children.userId, userId));
    return result[0]?.count || 0;
  }

  async createChild(child: InsertChild): Promise<Child> {
    // Parse date strings into proper Date objects if they are strings
    const processedChild = {
      ...child,
      birthDate: child.birthDate ? (typeof child.birthDate === 'string' ? new Date(child.birthDate) : child.birthDate) : null,
      dueDate: child.dueDate ? (typeof child.dueDate === 'string' ? new Date(child.dueDate) : child.dueDate) : null, 
      createdAt: new Date()
    };

    const [newChild] = await db
      .insert(children)
      .values(processedChild)
      .returning();
    return newChild;
  }

  async updateChild(id: number, updates: Partial<Child>): Promise<Child | undefined> {
    const [updatedChild] = await db
      .update(children)
      .set(updates)
      .where(eq(children.id, id))
      .returning();
    return updatedChild;
  }

  async deleteChild(id: number): Promise<boolean> {
    const result = await db
      .delete(children)
      .where(eq(children.id, id));
    return result.rowCount > 0;
  }

  // Pregnancy journal methods
  async getPregnancyJournals(childId: number): Promise<PregnancyJournal[]> {
    return db
      .select()
      .from(pregnancyJournal)
      .where(eq(pregnancyJournal.childId, childId))
      .orderBy(pregnancyJournal.week);
  }

  async getPregnancyJournalByWeek(childId: number, week: number): Promise<PregnancyJournal | undefined> {
    const [journal] = await db
      .select()
      .from(pregnancyJournal)
      .where(and(
        eq(pregnancyJournal.childId, childId),
        eq(pregnancyJournal.week, week)
      ));
    return journal;
  }

  async createPregnancyJournal(journal: InsertPregnancyJournal): Promise<PregnancyJournal> {
    const [newJournal] = await db
      .insert(pregnancyJournal)
      .values({
        ...journal,
        createdAt: new Date()
      })
      .returning();
    return newJournal;
  }

  async updatePregnancyJournal(id: number, updates: Partial<PregnancyJournal>): Promise<PregnancyJournal | undefined> {
    const [updatedJournal] = await db
      .update(pregnancyJournal)
      .set(updates)
      .where(eq(pregnancyJournal.id, id))
      .returning();
    return updatedJournal;
  }

  // Symptom methods
  async getSymptoms(childId: number): Promise<Symptom[]> {
    return db
      .select()
      .from(symptoms)
      .where(eq(symptoms.childId, childId))
      .orderBy(desc(symptoms.date));
  }

  async createSymptom(symptom: InsertSymptom): Promise<Symptom> {
    const [newSymptom] = await db
      .insert(symptoms)
      .values({
        ...symptom,
        createdAt: new Date()
      })
      .returning();
    return newSymptom;
  }

  async deleteSymptom(id: number): Promise<boolean> {
    const result = await db
      .delete(symptoms)
      .where(eq(symptoms.id, id));
    return result.rowCount > 0;
  }

  // Milestone methods
  async getMilestones(childId: number): Promise<Milestone[]> {
    return db
      .select()
      .from(milestones)
      .where(eq(milestones.childId, childId))
      .orderBy(desc(milestones.date));
  }

  async getRecentMilestones(childId: number, limit: number): Promise<Milestone[]> {
    return db
      .select()
      .from(milestones)
      .where(eq(milestones.childId, childId))
      .orderBy(desc(milestones.date))
      .limit(limit);
  }

  async createMilestone(milestone: InsertMilestone): Promise<Milestone> {
    const [newMilestone] = await db
      .insert(milestones)
      .values({
        ...milestone,
        createdAt: new Date()
      })
      .returning();
    return newMilestone;
  }

  async updateMilestone(id: number, updates: Partial<Milestone>): Promise<Milestone | undefined> {
    const [updatedMilestone] = await db
      .update(milestones)
      .set(updates)
      .where(eq(milestones.id, id))
      .returning();
    return updatedMilestone;
  }

  async deleteMilestone(id: number): Promise<boolean> {
    const result = await db
      .delete(milestones)
      .where(eq(milestones.id, id));
    return result.rowCount > 0;
  }

  // Growth record methods
  async getGrowthRecords(childId: number): Promise<GrowthRecord[]> {
    return db
      .select()
      .from(growthRecords)
      .where(eq(growthRecords.childId, childId))
      .orderBy(desc(growthRecords.date));
  }

  async createGrowthRecord(record: InsertGrowthRecord): Promise<GrowthRecord> {
    const [newRecord] = await db
      .insert(growthRecords)
      .values({
        ...record,
        createdAt: new Date()
      })
      .returning();
    return newRecord;
  }

  async updateGrowthRecord(id: number, updates: Partial<GrowthRecord>): Promise<GrowthRecord | undefined> {
    const [updatedRecord] = await db
      .update(growthRecords)
      .set(updates)
      .where(eq(growthRecords.id, id))
      .returning();
    return updatedRecord;
  }

  // Appointment methods
  async getAppointments(childId: number): Promise<Appointment[]> {
    return db
      .select()
      .from(appointments)
      .where(eq(appointments.childId, childId))
      .orderBy(appointments.date);
  }

  async getUpcomingAppointments(childId: number, limit: number): Promise<Appointment[]> {
    const now = new Date();
    return db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.childId, childId),
        sql`${appointments.date} >= ${now}`
      ))
      .orderBy(appointments.date)
      .limit(limit);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db
      .insert(appointments)
      .values({
        ...appointment,
        createdAt: new Date()
      })
      .returning();
    return newAppointment;
  }

  async updateAppointment(id: number, updates: Partial<Appointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set(updates)
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const result = await db
      .delete(appointments)
      .where(eq(appointments.id, id));
    return result.rowCount > 0;
  }

  // Photo methods
  async getPhotos(childId: number): Promise<Photo[]> {
    return db
      .select()
      .from(photos)
      .where(eq(photos.childId, childId))
      .orderBy(desc(photos.createdAt));
  }

  async getPhotoCount(childId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(photos)
      .where(eq(photos.childId, childId));
    return result[0]?.count || 0;
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const [newPhoto] = await db
      .insert(photos)
      .values({
        ...photo,
        createdAt: new Date()
      })
      .returning();
    return newPhoto;
  }

  async deletePhoto(id: number): Promise<boolean> {
    const result = await db
      .delete(photos)
      .where(eq(photos.id, id));
    return result.rowCount > 0;
  }

  // Vaccination methods
  async getVaccinations(childId: number): Promise<Vaccination[]> {
    return db
      .select()
      .from(vaccinations)
      .where(eq(vaccinations.childId, childId))
      .orderBy(desc(vaccinations.date));
  }

  async createVaccination(vaccination: InsertVaccination): Promise<Vaccination> {
    const [newVaccination] = await db
      .insert(vaccinations)
      .values({
        ...vaccination,
        createdAt: new Date()
      })
      .returning();
    return newVaccination;
  }

  async deleteVaccination(id: number): Promise<boolean> {
    const result = await db
      .delete(vaccinations)
      .where(eq(vaccinations.id, id));
    return result.rowCount > 0;
  }

  // Registry methods
  async getRegistriesByUserId(userId: number): Promise<Registry[]> {
    return db
      .select()
      .from(registries)
      .where(eq(registries.userId, userId));
  }

  async getRegistry(id: number): Promise<Registry | undefined> {
    const [registry] = await db
      .select()
      .from(registries)
      .where(eq(registries.id, id));
    return registry;
  }

  async getRegistryByChildId(childId: number): Promise<Registry | undefined> {
    const [registry] = await db
      .select()
      .from(registries)
      .where(eq(registries.childId, childId));
    return registry;
  }

  async getRegistryByShareCode(shareCode: string): Promise<Registry | undefined> {
    const [registry] = await db
      .select()
      .from(registries)
      .where(eq(registries.shareCode, shareCode));
    return registry;
  }

  async createRegistry(registry: InsertRegistry): Promise<Registry> {
    const [newRegistry] = await db
      .insert(registries)
      .values({
        ...registry,
        shareCode: Math.random().toString(36).substring(2, 10),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newRegistry;
  }

  async updateRegistry(id: number, updates: Partial<Registry>): Promise<Registry | undefined> {
    const [updatedRegistry] = await db
      .update(registries)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(registries.id, id))
      .returning();
    return updatedRegistry;
  }

  async deleteRegistry(id: number): Promise<boolean> {
    // First delete all registry items
    await db
      .delete(registryItems)
      .where(eq(registryItems.registryId, id));
    
    // Then delete the registry
    const result = await db
      .delete(registries)
      .where(eq(registries.id, id));
    return result.rowCount > 0;
  }

  // Registry item methods
  async getRegistryItems(registryId: number): Promise<RegistryItem[]> {
    return db
      .select()
      .from(registryItems)
      .where(eq(registryItems.registryId, registryId));
  }

  async getRegistryItem(id: number): Promise<RegistryItem | undefined> {
    const [item] = await db
      .select()
      .from(registryItems)
      .where(eq(registryItems.id, id));
    return item;
  }

  async createRegistryItem(item: InsertRegistryItem): Promise<RegistryItem> {
    const [newItem] = await db
      .insert(registryItems)
      .values({
        ...item,
        status: "available",
        reservedByName: null,
        reservedByEmail: null,
        reservedAt: null,
        purchasedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newItem;
  }

  async updateRegistryItem(id: number, updates: Partial<RegistryItem>): Promise<RegistryItem | undefined> {
    const [updatedItem] = await db
      .update(registryItems)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(registryItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteRegistryItem(id: number): Promise<boolean> {
    const result = await db
      .delete(registryItems)
      .where(eq(registryItems.id, id));
    return result.rowCount > 0;
  }

  async updateRegistryItemStatus(
    id: number, 
    status: "available" | "reserved" | "purchased", 
    personInfo: { name?: string; email?: string }
  ): Promise<RegistryItem | undefined> {
    const item = await this.getRegistryItem(id);
    if (!item) return undefined;
    
    const now = new Date();
    const updates: Partial<RegistryItem> = {
      status,
      updatedAt: now
    };
    
    if (status === "available") {
      updates.reservedByName = null;
      updates.reservedByEmail = null;
      updates.reservedAt = null;
      updates.purchasedAt = null;
    } else if (status === "reserved") {
      updates.reservedByName = personInfo.name || null;
      updates.reservedByEmail = personInfo.email || null;
      updates.reservedAt = now;
      updates.purchasedAt = null;
    } else if (status === "purchased") {
      updates.reservedByName = personInfo.name || item.reservedByName;
      updates.reservedByEmail = personInfo.email || item.reservedByEmail;
      updates.purchasedAt = now;
    }
    
    return this.updateRegistryItem(id, updates);
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
