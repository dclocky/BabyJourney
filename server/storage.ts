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
  contractions, type Contraction, type InsertContraction,
  cravings, type Craving, type InsertCraving,
  babyNames, type BabyName, type InsertBabyName,
  // Family Groups types
  familyGroups, type SelectFamilyGroup, type InsertFamilyGroup,
  groupMembers, type SelectGroupMember, type InsertGroupMember,
  groupInvitations, type SelectGroupInvitation, type InsertGroupInvitation,
  groupActivities, type SelectGroupActivity, type InsertGroupActivity,
  activityComments, type SelectActivityComment, type InsertActivityComment,
  activityLikes, type SelectActivityLike, type InsertActivityLike,
  auditLogs, type SelectAuditLog, type InsertAuditLog,
  babyPreferences, type SelectBabyPreference, type InsertBabyPreference,
  // Conception tracking imports
  ovulationCycles, type OvulationCycle, type InsertOvulationCycle,
  fertilitySymptoms, type FertilitySymptom, type InsertFertilitySymptom,
  ovulationTests, type OvulationTest, type InsertOvulationTest,
  intimacyTracking, type IntimacyTracking, type InsertIntimacyTracking,
  conceptionGoals, type ConceptionGoal, type InsertConceptionGoal
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db, pool } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, json, uniqueIndex, varchar, jsonb } from "drizzle-orm/pg-core";
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
  upgradeToPremium(userId: number): Promise<User | undefined>;

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
  
  // Cravings methods
  getCravings(pregnancyId: number): Promise<Craving[]>;
  getCraving(id: number): Promise<Craving | undefined>;
  createCraving(craving: InsertCraving): Promise<Craving>;
  updateCraving(id: number, craving: Partial<Craving>): Promise<Craving | undefined>;
  deleteCraving(id: number): Promise<boolean>;
  
  // Baby Names methods
  getBabyNames(userId: number, childId?: number): Promise<BabyName[]>;
  getBabyName(id: number): Promise<BabyName | undefined>;
  createBabyName(babyName: InsertBabyName): Promise<BabyName>;
  updateBabyName(id: number, babyName: Partial<BabyName>): Promise<BabyName | undefined>;
  deleteBabyName(id: number): Promise<boolean>;

  // Conception tracker methods
  getOvulationCycles(userId: number): Promise<OvulationCycle[]>;
  createOvulationCycle(cycle: InsertOvulationCycle): Promise<OvulationCycle>;
  getFertilitySymptoms(userId: number, cycleId?: number): Promise<FertilitySymptom[]>;
  createFertilitySymptom(symptom: InsertFertilitySymptom): Promise<FertilitySymptom>;
  getOvulationTests(userId: number): Promise<OvulationTest[]>;
  createOvulationTest(test: InsertOvulationTest): Promise<OvulationTest>;
  getConceptionGoals(userId: number): Promise<ConceptionGoal | null>;
  createOrUpdateConceptionGoals(goals: InsertConceptionGoal): Promise<ConceptionGoal>;
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
  private cravings: Map<number, Craving>;
  private babyNames: Map<number, BabyName>;
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
  private cravingIdCounter: number = 1;
  private babyNameIdCounter: number = 1;

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
    this.contractions = new Map();
    this.cravings = new Map();
    this.babyNames = new Map();
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
      id,
      fullName: member.fullName,
      email: member.email ?? null,
      createdAt: new Date(),
      userId: member.userId,
      relationship: member.relationship
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
      id,
      name: insertChild.name,
      createdAt: new Date(),
      userId: insertChild.userId,
      gender: insertChild.gender ?? null,
      birthDate: insertChild.birthDate ?? null,
      dueDate: insertChild.dueDate ?? null,
      isPregnancy: insertChild.isPregnancy ?? false
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
      id,
      createdAt: new Date(),
      childId: journal.childId,
      userId: journal.userId,
      week: journal.week,
      notes: journal.notes ?? null,
      symptoms: journal.symptoms ?? null,
      babySize: journal.babySize ?? null
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
      date: symptom.date,
      id,
      name: symptom.name,
      createdAt: new Date(),
      childId: symptom.childId,
      userId: symptom.userId,
      notes: symptom.notes ?? null,
      severity: symptom.severity ?? null
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
      date: milestone.date,
      id,
      createdAt: new Date(),
      childId: milestone.childId,
      userId: milestone.userId,
      title: milestone.title,
      description: milestone.description ?? null,
      category: milestone.category,
      imageData: milestone.imageData ?? null,
      imageType: milestone.imageType ?? null
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
      date: record.date,
      id,
      createdAt: new Date(),
      childId: record.childId,
      userId: record.userId,
      notes: record.notes ?? null,
      weight: record.weight ?? null,
      height: record.height ?? null,
      headCircumference: record.headCircumference ?? null
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
      id,
      createdAt: new Date(),
      date: appointment.date,
      userId: appointment.userId,
      childId: appointment.childId,
      title: appointment.title,
      notes: appointment.notes ?? null,
      time: appointment.time ?? null,
      location: appointment.location ?? null,
      doctorName: appointment.doctorName ?? null,
      doctorSpecialty: null,
      doctorNotes: null,
      diagnosis: null,
      treatment: null,
      prescriptions: null,
      followUpDate: null,
      vitals: appointment.vitals ?? null
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
      id,
      createdAt: new Date(),
      childId: photo.childId,
      userId: photo.userId,
      title: photo.title,
      description: photo.description ?? null,
      filename: photo.filename,
      takenAt: photo.takenAt ?? null,
      tags: photo.tags ?? null
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
      date: vaccination.date,
      id,
      name: vaccination.name,
      createdAt: new Date(),
      childId: vaccination.childId,
      userId: vaccination.userId,
      notes: vaccination.notes ?? null
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
      id,
      name: pregnancy.name,
      createdAt: new Date(),
      userId: pregnancy.userId,
      gender: pregnancy.gender ?? null,
      birthDate: pregnancy.birthDate ?? null,
      dueDate: pregnancy.dueDate ?? null,
      isPregnancy: true
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
      id,
      createdAt: new Date(),
      userId: registry.userId,
      childId: registry.childId ?? null,
      title: registry.title,
      description: registry.description ?? null,
      isPublic: registry.isPublic ?? false,
      shareCode,
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
      id,
      name: item.name,
      createdAt: new Date(),
      status: "available",
      description: item.description ?? null,
      category: item.category,
      updatedAt: new Date(),
      registryId: item.registryId,
      url: item.url ?? null,
      price: item.price ?? null,
      quantity: item.quantity ?? 1,
      priority: item.priority ?? "medium",
      imageUrl: item.imageUrl ?? null,
      purchasedBy: null,
      purchasedByEmail: null,
      reservedBy: null,
      reservedByEmail: null,
      reservedAt: null,
      purchasedAt: null
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
      updates.reservedBy = null;
      updates.reservedByEmail = null;
      updates.reservedAt = null;
      updates.purchasedAt = null;
    } else if (status === "reserved") {
      updates.reservedBy = personInfo.name || null;
      updates.reservedByEmail = personInfo.email || null;
      updates.reservedAt = now;
      updates.purchasedAt = null;
    } else if (status === "purchased") {
      updates.purchasedBy = personInfo.name || item.reservedBy;
      updates.purchasedByEmail = personInfo.email || item.reservedByEmail;
      updates.purchasedAt = now;
    }
    
    return this.updateRegistryItem(id, updates);
  }
  
  // Helper method for getting a pregnancy (child record that is_pregnancy=true)
  async getPregnancy(id: number): Promise<Child | undefined> {
    const child = await this.getChild(id);
    if (!child || !child.isPregnancy) return undefined;
    return child;
  }
  
  // Contraction methods
  async getContractions(pregnancyId: number): Promise<Contraction[]> {
    return Array.from(this.contractions.values())
      .filter(contraction => contraction.pregnancyId === pregnancyId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()); // Most recent first
  }
  
  async getContraction(id: number): Promise<Contraction | undefined> {
    return this.contractions.get(id);
  }
  
  async createContraction(contraction: InsertContraction): Promise<Contraction> {
    const id = this.contractionIdCounter++;
    const newContraction: Contraction = {
      id,
      createdAt: new Date(),
      pregnancyId: contraction.pregnancyId,
      startTime: contraction.startTime,
      endTime: contraction.endTime || null,
      duration: contraction.duration ?? null,
      intensity: contraction.intensity ?? null
    };
    this.contractions.set(id, newContraction);
    return newContraction;
  }
  
  async updateContraction(id: number, updates: Partial<Contraction>): Promise<Contraction | undefined> {
    const contraction = await this.getContraction(id);
    if (!contraction) return undefined;
    
    const updatedContraction: Contraction = {
      ...contraction,
      ...updates
    };
    
    this.contractions.set(id, updatedContraction);
    return updatedContraction;
  }
  
  async deleteContraction(id: number): Promise<boolean> {
    return this.contractions.delete(id);
  }

  // Cravings methods
  async getCravings(pregnancyId: number): Promise<Craving[]> {
    return Array.from(this.cravings.values())
      .filter(craving => craving.pregnancyId === pregnancyId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  async getCraving(id: number): Promise<Craving | undefined> {
    return this.cravings.get(id);
  }
  
  async createCraving(craving: InsertCraving): Promise<Craving> {
    const id = this.cravingIdCounter++;
    const newCraving: Craving = {
      id,
      createdAt: new Date(),
      userId: craving.userId,
      pregnancyId: craving.pregnancyId,
      foodName: craving.foodName,
      date: craving.date || new Date(),
      notes: craving.notes ?? null,
      intensity: craving.intensity ?? null,
      satisfied: craving.satisfied ?? null
    };
    this.cravings.set(id, newCraving);
    return newCraving;
  }
  
  async updateCraving(id: number, updates: Partial<Craving>): Promise<Craving | undefined> {
    const craving = this.cravings.get(id);
    if (!craving) return undefined;
    
    const updatedCraving: Craving = {
      ...craving,
      ...updates
    };
    
    this.cravings.set(id, updatedCraving);
    return updatedCraving;
  }
  
  async deleteCraving(id: number): Promise<boolean> {
    return this.cravings.delete(id);
  }
  
  // Baby Names methods
  async getBabyNames(userId: number, childId?: number): Promise<BabyName[]> {
    return Array.from(this.babyNames.values()).filter(
      (babyName) => {
        // If childId is provided, filter by both userId and childId
        if (childId) {
          return babyName.userId === userId && babyName.childId === childId;
        }
        // Otherwise, just filter by userId
        return babyName.userId === userId;
      }
    ).sort((a, b) => {
      // Sort by favorite status first (favorites at the top)
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      
      // Then sort by rating (highest rating first)
      if ((a.rating ?? 0) !== (b.rating ?? 0)) {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      
      // Finally, sort by creation date (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  async getBabyName(id: number): Promise<BabyName | undefined> {
    return this.babyNames.get(id);
  }

  async createBabyName(babyName: InsertBabyName): Promise<BabyName> {
    const id = this.babyNameIdCounter++;
    const newBabyName: BabyName = {
      id,
      name: babyName.name,
      createdAt: new Date(),
      userId: babyName.userId,
      gender: babyName.gender || null,
      childId: babyName.childId ?? null,
      notes: babyName.notes ?? null,
      meaning: babyName.meaning ?? null,
      origin: babyName.origin ?? null,
      rating: babyName.rating ?? null,
      isFavorite: babyName.isFavorite ?? null,
      suggestedBy: babyName.suggestedBy ?? null
    };
    this.babyNames.set(id, newBabyName);
    return newBabyName;
  }

  async updateBabyName(id: number, updates: Partial<BabyName>): Promise<BabyName | undefined> {
    const babyName = this.babyNames.get(id);
    if (!babyName) return undefined;
    
    const updatedBabyName: BabyName = {
      ...babyName,
      ...updates
    };
    
    this.babyNames.set(id, updatedBabyName);
    return updatedBabyName;
  }

  async deleteBabyName(id: number): Promise<boolean> {
    return this.babyNames.delete(id);
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
    return (result.rowCount ?? 0) > 0;
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
    return (result.rowCount ?? 0) > 0;
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
    return (result.rowCount ?? 0) > 0;
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
    return (result.rowCount ?? 0) > 0;
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
    return (result.rowCount ?? 0) > 0;
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
    return (result.rowCount ?? 0) > 0;
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
    return (result.rowCount ?? 0) > 0;
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
    // If childId is null, we need to find a child to associate with
    if (registry.childId === null || registry.childId === undefined) {
      // Try to get first child for the user
      const [firstChild] = await db
        .select()
        .from(children)
        .where(eq(children.userId, registry.userId))
        .limit(1);

      if (firstChild) {
        registry.childId = firstChild.id;
      } else {
        // Create a temporary child if none exists
        const [newChild] = await db
          .insert(children)
          .values({
            userId: registry.userId,
            name: "Default Baby",
            isPregnancy: true,
            createdAt: new Date()
          })
          .returning();
        registry.childId = newChild.id;
      }
    }
    
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
    return (result.rowCount ?? 0) > 0;
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
        reservedBy: null,
        reservedByEmail: null,
        purchasedBy: null,
        purchasedByEmail: null,
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
    return (result.rowCount ?? 0) > 0;
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
      updates.reservedBy = null;
      updates.reservedByEmail = null;
      updates.reservedAt = null;
      updates.purchasedAt = null;
    } else if (status === "reserved") {
      updates.reservedBy = personInfo.name || null;
      updates.reservedByEmail = personInfo.email || null;
      updates.reservedAt = now;
      updates.purchasedAt = null;
    } else if (status === "purchased") {
      updates.purchasedBy = personInfo.name || item.reservedBy;
      updates.purchasedByEmail = personInfo.email || item.reservedByEmail;
      updates.purchasedAt = now;
    }
    
    return this.updateRegistryItem(id, updates);
  }
  
  // Helper method for getting a pregnancy
  async getPregnancy(id: number): Promise<Child | undefined> {
    const [pregnancy] = await db
      .select()
      .from(children)
      .where(and(
        eq(children.id, id),
        eq(children.isPregnancy, true)
      ));
    return pregnancy;
  }
  
  // Contraction methods
  async getContractions(pregnancyId: number): Promise<Contraction[]> {
    return db
      .select()
      .from(contractions)
      .where(eq(contractions.pregnancyId, pregnancyId))
      .orderBy(desc(contractions.startTime));
  }
  
  async getContraction(id: number): Promise<Contraction | undefined> {
    const [contraction] = await db
      .select()
      .from(contractions)
      .where(eq(contractions.id, id));
    return contraction;
  }
  
  async createContraction(contraction: InsertContraction): Promise<Contraction> {
    const [newContraction] = await db
      .insert(contractions)
      .values({
        ...contraction,
        createdAt: new Date()
      })
      .returning();
    return newContraction;
  }
  
  async updateContraction(id: number, updates: Partial<Contraction>): Promise<Contraction | undefined> {
    const [updatedContraction] = await db
      .update(contractions)
      .set(updates)
      .where(eq(contractions.id, id))
      .returning();
    return updatedContraction;
  }
  
  async deleteContraction(id: number): Promise<boolean> {
    const result = await db
      .delete(contractions)
      .where(eq(contractions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Cravings methods
  async getCravings(pregnancyId: number): Promise<Craving[]> {
    return db
      .select()
      .from(cravings)
      .where(eq(cravings.pregnancyId, pregnancyId))
      .orderBy(desc(cravings.date));
  }
  
  async getCraving(id: number): Promise<Craving | undefined> {
    const [craving] = await db
      .select()
      .from(cravings)
      .where(eq(cravings.id, id));
    return craving;
  }
  
  async createCraving(craving: InsertCraving): Promise<Craving> {
    const [newCraving] = await db
      .insert(cravings)
      .values({
        ...craving,
        createdAt: new Date()
      })
      .returning();
    return newCraving;
  }
  
  async updateCraving(id: number, updates: Partial<Craving>): Promise<Craving | undefined> {
    const [updatedCraving] = await db
      .update(cravings)
      .set(updates)
      .where(eq(cravings.id, id))
      .returning();
    return updatedCraving;
  }
  
  async deleteCraving(id: number): Promise<boolean> {
    const result = await db
      .delete(cravings)
      .where(eq(cravings.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  
  // Baby Names methods
  async getBabyNames(userId: number, childId?: number): Promise<BabyName[]> {
    let query = db
      .select()
      .from(babyNames)
      .where(eq(babyNames.userId, userId));
      
    if (childId) {
      query = db
        .select()
        .from(babyNames)
        .where(and(
          eq(babyNames.userId, userId),
          eq(babyNames.childId, childId)
        ));
    }
    
    const names = await query.orderBy(
      desc(babyNames.isFavorite),
      desc(babyNames.rating),
      desc(babyNames.createdAt)
    );
    
    return names;
  }

  async getBabyName(id: number): Promise<BabyName | undefined> {
    const [name] = await db
      .select()
      .from(babyNames)
      .where(eq(babyNames.id, id));
    return name;
  }

  async createBabyName(babyName: InsertBabyName): Promise<BabyName> {
    const [newName] = await db
      .insert(babyNames)
      .values({
        ...babyName,
        createdAt: new Date()
      })
      .returning();
    return newName;
  }

  async updateBabyName(id: number, updates: Partial<BabyName>): Promise<BabyName | undefined> {
    const [updatedName] = await db
      .update(babyNames)
      .set(updates)
      .where(eq(babyNames.id, id))
      .returning();
    return updatedName;
  }

  async deleteBabyName(id: number): Promise<boolean> {
    const result = await db
      .delete(babyNames)
      .where(eq(babyNames.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ===== FAMILY GROUPS STORAGE METHODS =====
  
  // Family Groups
  async createFamilyGroup(data: InsertFamilyGroup): Promise<SelectFamilyGroup> {
    const [group] = await db.insert(familyGroups).values(data).returning();
    return group;
  }

  async getFamilyGroup(id: number): Promise<SelectFamilyGroup | undefined> {
    const [group] = await db.select().from(familyGroups).where(eq(familyGroups.id, id));
    return group;
  }

  async getFamilyGroupByChild(childId: number): Promise<SelectFamilyGroup | undefined> {
    const [group] = await db.select().from(familyGroups)
      .where(and(eq(familyGroups.childId, childId), eq(familyGroups.isActive, true)));
    return group;
  }

  async updateFamilyGroup(id: number, data: Partial<InsertFamilyGroup>): Promise<SelectFamilyGroup> {
    const [group] = await db.update(familyGroups)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(familyGroups.id, id))
      .returning();
    return group;
  }

  // Group Members
  async createGroupMember(data: InsertGroupMember): Promise<SelectGroupMember> {
    const [member] = await db.insert(groupMembers).values(data).returning();
    return member;
  }

  async getGroupMember(groupId: number, userId: number): Promise<SelectGroupMember | undefined> {
    const [member] = await db.select().from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
    return member;
  }

  async getGroupMembers(groupId: number): Promise<(SelectGroupMember & { user: User })[]> {
    return db.select({
      id: groupMembers.id,
      groupId: groupMembers.groupId,
      userId: groupMembers.userId,
      role: groupMembers.role,
      permissions: groupMembers.permissions,
      joinedAt: groupMembers.joinedAt,
      invitedBy: groupMembers.invitedBy,
      user: {
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt,
        isPremium: users.isPremium,
        role: users.role,
      }
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, groupId));
  }

  async updateGroupMember(id: number, data: Partial<InsertGroupMember>): Promise<SelectGroupMember> {
    const [member] = await db.update(groupMembers).set(data).where(eq(groupMembers.id, id)).returning();
    return member;
  }

  async removeGroupMember(id: number): Promise<void> {
    await db.delete(groupMembers).where(eq(groupMembers.id, id));
  }

  // Group Invitations
  async createGroupInvitation(invitation: InsertGroupInvitation): Promise<SelectGroupInvitation> {
    const [newInvitation] = await db
      .insert(groupInvitations)
      .values({
        email: invitation.email,
        role: invitation.role,
        groupId: invitation.groupId,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
        permissions: invitation.permissions,
        createdAt: new Date()
      })
      .returning();
    return newInvitation;
  }

  async getInvitationByToken(token: string): Promise<SelectGroupInvitation | undefined> {
    const [invitation] = await db.select().from(groupInvitations)
      .where(eq(groupInvitations.token, token));
    return invitation;
  }

  async getGroupInvitations(groupId: number): Promise<SelectGroupInvitation[]> {
    return db.select().from(groupInvitations)
      .where(eq(groupInvitations.groupId, groupId))
      .orderBy(desc(groupInvitations.createdAt));
  }

  async updateInvitation(id: number, data: Partial<InsertGroupInvitation>): Promise<SelectGroupInvitation> {
    const [invitation] = await db.update(groupInvitations).set(data).where(eq(groupInvitations.id, id)).returning();
    return invitation;
  }

  // Group Activities
  async createGroupActivity(data: InsertGroupActivity): Promise<SelectGroupActivity> {
    const [activity] = await db.insert(groupActivities).values(data).returning();
    return activity;
  }

  async getGroupActivity(id: number): Promise<SelectGroupActivity | undefined> {
    const [activity] = await db.select().from(groupActivities).where(eq(groupActivities.id, id));
    return activity;
  }

  async getGroupActivities(groupId: number, limit: number = 20, offset: number = 0): Promise<(SelectGroupActivity & { user: User; comments: (SelectActivityComment & { user: User })[]; likes: SelectActivityLike[]; })[]> {
    // Get activities with user info
    const activities = await db.select({
      id: groupActivities.id,
      groupId: groupActivities.groupId,
      userId: groupActivities.userId,
      activityType: groupActivities.activityType,
      title: groupActivities.title,
      description: groupActivities.description,
      metadata: groupActivities.metadata,
      isVisible: groupActivities.isVisible,
      createdAt: groupActivities.createdAt,
      user: {
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt,
        isPremium: users.isPremium,
        role: users.role,
      }
    })
    .from(groupActivities)
    .innerJoin(users, eq(groupActivities.userId, users.id))
    .where(and(eq(groupActivities.groupId, groupId), eq(groupActivities.isVisible, true)))
    .orderBy(desc(groupActivities.createdAt))
    .limit(limit)
    .offset(offset);

    // Get comments and likes for each activity
    const result = [];
    for (const activity of activities) {
      const comments = await this.getActivityComments(activity.id);
      const likes = await this.getActivityLikes(activity.id);
      result.push({ ...activity, comments, likes });
    }

    return result;
  }

  // Activity Comments
  async createActivityComment(data: InsertActivityComment): Promise<SelectActivityComment> {
    const [comment] = await db.insert(activityComments).values(data).returning();
    return comment;
  }

  async getActivityComments(activityId: number): Promise<(SelectActivityComment & { user: User })[]> {
    return db.select({
      id: activityComments.id,
      activityId: activityComments.activityId,
      userId: activityComments.userId,
      content: activityComments.content,
      isEdited: activityComments.isEdited,
      createdAt: activityComments.createdAt,
      updatedAt: activityComments.updatedAt,
      user: {
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt,
        isPremium: users.isPremium,
        role: users.role,
      }
    })
    .from(activityComments)
    .innerJoin(users, eq(activityComments.userId, users.id))
    .where(eq(activityComments.activityId, activityId))
    .orderBy(activityComments.createdAt);
  }

  // Activity Likes
  async createActivityLike(data: InsertActivityLike): Promise<SelectActivityLike> {
    const [like] = await db.insert(activityLikes).values(data).returning();
    return like;
  }

  async getActivityLike(activityId: number, userId: number): Promise<SelectActivityLike | undefined> {
    const [like] = await db.select().from(activityLikes)
      .where(and(eq(activityLikes.activityId, activityId), eq(activityLikes.userId, userId)));
    return like;
  }

  async getActivityLikes(activityId: number): Promise<SelectActivityLike[]> {
    return db.select().from(activityLikes)
      .where(eq(activityLikes.activityId, activityId));
  }

  async updateActivityLike(id: number, data: Partial<InsertActivityLike>): Promise<SelectActivityLike> {
    const [like] = await db.update(activityLikes).set(data).where(eq(activityLikes.id, id)).returning();
    return like;
  }

  async removeActivityLike(activityId: number, userId: number): Promise<void> {
    await db.delete(activityLikes)
      .where(and(eq(activityLikes.activityId, activityId), eq(activityLikes.userId, userId)));
  }

  // Audit Logs
  async createAuditLog(data: InsertAuditLog): Promise<SelectAuditLog> {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  }

  async getAuditLogs(groupId: number, limit: number = 50, offset: number = 0): Promise<(SelectAuditLog & { user: User })[]> {
    return db.select({
      id: auditLogs.id,
      groupId: auditLogs.groupId,
      userId: auditLogs.userId,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      oldValues: auditLogs.oldValues,
      newValues: auditLogs.newValues,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
      user: {
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt,
        isPremium: users.isPremium,
        role: users.role,
      }
    })
    .from(auditLogs)
    .innerJoin(users, eq(auditLogs.userId, users.id))
    .where(eq(auditLogs.groupId, groupId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);
  }

  // Baby Preferences
  async getChildPreferences(childId: number, userId: number): Promise<SelectBabyPreference[]> {
    return db.select()
      .from(babyPreferences)
      .where(and(eq(babyPreferences.childId, childId), eq(babyPreferences.userId, userId)))
      .orderBy(desc(babyPreferences.createdAt));
  }

  async createChildPreference(data: InsertBabyPreference): Promise<SelectBabyPreference> {
    const [preference] = await db.insert(babyPreferences).values(data).returning();
    return preference;
  }
  
  // Conception Tracking Methods
  async getOvulationCycles(userId: number): Promise<OvulationCycle[]> {
    const result = await db.select().from(ovulationCycles)
      .where(eq(ovulationCycles.userId, userId))
      .orderBy(desc(ovulationCycles.cycleStartDate));
    return result;
  }

  async getCurrentCycle(userId: number): Promise<OvulationCycle | undefined> {
    const cycles = await this.getOvulationCycles(userId);
    return cycles[0];
  }

  async createOvulationCycle(cycle: InsertOvulationCycle): Promise<OvulationCycle> {
    const [result] = await db.insert(ovulationCycles).values(cycle).returning();
    return result;
  }

  async getFertilitySymptoms(userId: number, cycleId?: number): Promise<FertilitySymptom[]> {
    const conditions = [eq(fertilitySymptoms.userId, userId)];
    if (cycleId) {
      conditions.push(eq(fertilitySymptoms.cycleId, cycleId));
    }
    
    const result = await db.select().from(fertilitySymptoms)
      .where(and(...conditions))
      .orderBy(desc(fertilitySymptoms.date));
    return result;
  }

  async createFertilitySymptom(symptom: InsertFertilitySymptom): Promise<FertilitySymptom> {
    const [result] = await db.insert(fertilitySymptoms).values(symptom).returning();
    return result;
  }

  async getOvulationTests(userId: number): Promise<OvulationTest[]> {
    const result = await db.select().from(ovulationTests)
      .where(eq(ovulationTests.userId, userId))
      .orderBy(desc(ovulationTests.date));
    return result;
  }

  async createOvulationTest(test: InsertOvulationTest): Promise<OvulationTest> {
    const [result] = await db.insert(ovulationTests).values(test).returning();
    return result;
  }

  async getConceptionGoals(userId: number): Promise<ConceptionGoal | null> {
    const [result] = await db.select().from(conceptionGoals)
      .where(eq(conceptionGoals.userId, userId))
      .limit(1);
    return result || null;
  }

  async createOrUpdateConceptionGoals(goals: InsertConceptionGoal): Promise<ConceptionGoal> {
    const existing = await this.getConceptionGoals(goals.userId);
    
    if (existing) {
      const [updated] = await db.update(conceptionGoals)
        .set({ ...goals, updatedAt: new Date() })
        .where(eq(conceptionGoals.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(conceptionGoals).values(goals).returning();
      return created;
    }
  }
}

// Switch from MemStorage to DatabaseStorage  
export const storage = new DatabaseStorage();
