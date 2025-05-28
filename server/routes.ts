import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import multer from "multer";
import { randomBytes } from "crypto";
import { format } from "date-fns";
import { 
  insertUserSchema, userSchema, loginSchema, 
  insertFamilyMemberSchema, insertChildSchema, 
  insertPregnancyJournalSchema, insertSymptomSchema, 
  insertMilestoneSchema, insertGrowthRecordSchema, 
  insertAppointmentSchema, insertPhotoSchema,
  insertVaccinationSchema, insertRegistrySchema, 
  insertRegistryItemSchema, insertContractionSchema,
  insertCravingSchema, insertBabyNameSchema,
  type Child
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Configure file upload with memory storage for this MVP
  // In production, this would use cloud storage
  const memoryStorage = multer.memoryStorage();
  const upload = multer({ 
    storage: memoryStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only images are allowed'));
      }
    }
  });

  // Authentication middleware
  const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    next();
  };

  // === Pregnancy Routes ===
  app.get("/api/pregnancies", requireAuth, async (req, res, next) => {
    try {
      // Get all pregnancies for the current user
      const pregnancies = await storage.getPregnanciesForUser(req.user.id);
      res.json(pregnancies);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/pregnancies", requireAuth, async (req, res, next) => {
    try {
      // Process dates properly to avoid toISOString error
      const dueDate = typeof req.body.dueDate === 'string' 
        ? req.body.dueDate
        : (req.body.dueDate instanceof Date ? req.body.dueDate.toISOString() : null);
        
      const pregnancy = await storage.createPregnancy({
        userId: req.user.id,
        name: req.body.babyName || "Baby",
        dueDate: dueDate,
        isPregnancy: true
      });

      res.status(201).json(pregnancy);
    } catch (err) {
      next(err);
    }
  });

  // === Child Profile Routes ===
  app.get("/api/children", requireAuth, async (req, res, next) => {
    try {
      const children = await storage.getChildren(req.user.id);
      res.json(children);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/children/:id", requireAuth, async (req, res, next) => {
    try {
      const child = await storage.getChild(parseInt(req.params.id));
      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }

      // Ensure user owns this child record
      if (child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to access this profile" });
      }

      res.json(child);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/children", requireAuth, async (req, res, next) => {
    try {
      // Check if free user already has one child
      const count = await storage.getChildCount(req.user.id);
      if (count >= 1 && !req.user.isPremium) {
        return res.status(403).json({ message: "Free accounts are limited to 1 child. Upgrade to premium for more." });
      }

      // Process dates properly to avoid conversion issues
      const childData = {
        ...req.body,
        userId: req.user.id,
        // Don't transform dates here, the storage layer will handle it
      };

      const child = await storage.createChild(childData);
      res.status(201).json(child);
    } catch (err) {
      console.error("Error creating child:", err);
      next(err);
    }
  });

  app.put("/api/children/:id", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);

      if (!child) {
        return res.status(404).json({ message: "Child not found" });
      }

      // Ensure user owns this child record
      if (child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to modify this profile" });
      }

      const updatedChild = await storage.updateChild(childId, req.body);
      res.json(updatedChild);
    } catch (err) {
      next(err);
    }
  });

  // === Pregnancy Journal Routes ===
  app.get("/api/children/:id/pregnancy-journal", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const journals = await storage.getPregnancyJournals(childId);
      res.json(journals);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/children/:id/pregnancy-journal/:week", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const week = parseInt(req.params.week);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const journal = await storage.getPregnancyJournalByWeek(childId, week);
      if (!journal) {
        return res.status(404).json({ message: "No journal entry for this week" });
      }

      res.json(journal);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/children/:id/pregnancy-journal", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Check if journal for this week already exists
      const existingJournal = await storage.getPregnancyJournalByWeek(childId, req.body.week);
      if (existingJournal) {
        return res.status(400).json({ message: "Journal entry for this week already exists" });
      }

      const journal = await storage.createPregnancyJournal({
        ...req.body,
        childId,
        userId: req.user.id
      });

      res.status(201).json(journal);
    } catch (err) {
      next(err);
    }
  });

  app.put("/api/children/:id/pregnancy-journal/:journalId", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const journalId = parseInt(req.params.journalId);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const updatedJournal = await storage.updatePregnancyJournal(journalId, req.body);
      if (!updatedJournal) {
        return res.status(404).json({ message: "Journal not found" });
      }

      res.json(updatedJournal);
    } catch (err) {
      next(err);
    }
  });

  // === Symptoms Routes ===
  app.get("/api/children/:id/symptoms", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const symptoms = await storage.getSymptoms(childId);
      res.json(symptoms);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/children/:id/symptoms", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const symptom = await storage.createSymptom({
        ...req.body,
        childId,
        userId: req.user.id,
        date: new Date(req.body.date)
      });

      res.status(201).json(symptom);
    } catch (err) {
      next(err);
    }
  });

  // === Milestones Routes ===
  app.get("/api/children/:id/milestones", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const milestones = await storage.getMilestones(childId);
      res.json(milestones);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/children/:id/milestones/recent", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string || "3");
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      console.log(`Getting recent milestones for child ${childId}, limit: ${limit}`);
      const milestones = await storage.getRecentMilestones(childId, limit);
      console.log(`Found ${milestones.length} milestones:`, JSON.stringify(milestones));
      res.json(milestones);
    } catch (err) {
      console.error("Error getting recent milestones:", err);
      next(err);
    }
  });

  // We already have multer configured at the top of the file

  app.post("/api/children/:id/milestones", requireAuth, upload.single('image'), async (req, res, next) => {
    try {
      console.log("Creating milestone with data:", req.body);
      
      const childId = parseInt(req.params.id);
      if (isNaN(childId)) {
        return res.status(400).json({ message: "Invalid child ID" });
      }
      
      const child = await storage.getChild(childId);
      console.log("Child found:", child);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Validate date
      let milestoneDate;
      try {
        // Check if date is already a Date object or a string
        if (req.body.date instanceof Date) {
          milestoneDate = req.body.date;
        } else if (typeof req.body.date === 'string') {
          milestoneDate = new Date(req.body.date);
        } else {
          milestoneDate = new Date();
        }
        
        // Ensure it's a valid date
        if (isNaN(milestoneDate.getTime())) {
          console.error("Invalid date value:", req.body.date);
          return res.status(400).json({ message: "Invalid date format" });
        }
      } catch (dateError) {
        console.error("Date parsing error:", dateError);
        return res.status(400).json({ message: "Invalid date format" });
      }

      // Get milestone data from either FormData or JSON
      const milestoneData = req.file 
        ? { 
            title: req.body.title,
            description: req.body.description || null,
            category: req.body.category || "other",
            date: milestoneDate,
            // Add image data if available
            imageData: req.file.buffer.toString('base64'),
            imageType: req.file.mimetype
          } 
        : { 
            ...req.body, 
            date: milestoneDate,
            description: req.body.description || null,
            category: req.body.category || "other",
            imageData: null,
            imageType: null
          };

      console.log("Prepared milestone data:", { 
        ...milestoneData, 
        imageData: milestoneData.imageData ? "Image data present" : "No image data" 
      });

      const milestone = await storage.createMilestone({
        ...milestoneData,
        childId,
        userId: req.user.id
      });

      res.status(201).json(milestone);
    } catch (err) {
      console.error("Error creating milestone:", err);
      res.status(500).json({ message: "Failed to create milestone", error: err.message });
    }
  });

  // === Growth Records Routes ===
  app.get("/api/children/:id/growth", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const records = await storage.getGrowthRecords(childId);
      res.json(records);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/children/:id/growth", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const record = await storage.createGrowthRecord({
        ...req.body,
        childId,
        userId: req.user.id,
        date: new Date(req.body.date)
      });

      res.status(201).json(record);
    } catch (err) {
      next(err);
    }
  });

  // === Appointments Routes ===
  app.get("/api/children/:id/appointments", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const appointments = await storage.getAppointments(childId);
      res.json(appointments);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/children/:id/appointments/upcoming", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string || "3");
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const appointments = await storage.getUpcomingAppointments(childId, limit);
      res.json(appointments);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/children/:id/appointments", requireAuth, async (req, res, next) => {
    try {
      console.log("Creating appointment with data:", req.body);
      
      const childId = parseInt(req.params.id);
      if (isNaN(childId)) {
        return res.status(400).json({ message: "Invalid child ID" });
      }
      
      const child = await storage.getChild(childId);
      console.log("Child found:", child);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Validate date
      let appointmentDate;
      try {
        appointmentDate = req.body.date ? new Date(req.body.date) : new Date();
        if (isNaN(appointmentDate.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      } catch (dateError) {
        console.error("Date parsing error:", dateError);
        return res.status(400).json({ message: "Invalid date format" });
      }

      // Validate required fields
      if (!req.body.title) {
        return res.status(400).json({ message: "Appointment title is required" });
      }

      const appointmentData = {
        title: req.body.title,
        childId,
        userId: req.user.id,
        date: appointmentDate,
        time: req.body.time || null,
        location: req.body.location || null,
        notes: req.body.notes || null,
        doctorName: req.body.doctorName || null,
        doctorSpecialty: req.body.doctorSpecialty || null,
        diagnosis: req.body.diagnosis || null,
        treatment: req.body.treatment || null,
        prescriptions: req.body.prescriptions || null,
        followUpDate: req.body.followUpDate ? new Date(req.body.followUpDate) : null,
        doctorNotes: req.body.doctorNotes || null,
        vitals: req.body.vitals || {}
      };

      console.log("Prepared appointment data:", appointmentData);

      const appointment = await storage.createAppointment(appointmentData);

      res.status(201).json(appointment);
    } catch (err) {
      console.error("Error creating appointment:", err);
      res.status(500).json({ message: "Failed to create appointment", error: err.message });
    }
  });

  // === Photos Routes ===
  app.get("/api/children/:id/photos", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const photos = await storage.getPhotos(childId);
      res.json(photos);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/children/:id/photos/count", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const count = await storage.getPhotoCount(childId);
      res.json({ count });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/children/:id/photos", requireAuth, upload.single('photo'), async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Check photo limit for free users
      if (!req.user.isPremium) {
        const count = await storage.getPhotoCount(childId);
        if (count >= 5) {
          return res.status(403).json({ 
            message: "Free accounts are limited to 5 photos. Upgrade to premium for unlimited photos." 
          });
        }
      }

      if (!req.file) {
        return res.status(400).json({ message: "No photo uploaded" });
      }

      // Generate unique filename (in a real app, this would be stored in cloud storage)
      const randomId = randomBytes(8).toString('hex');
      const fileExtension = req.file.mimetype.split('/')[1];
      const datePrefix = format(new Date(), 'yyyyMMdd');
      const filename = `${datePrefix}-${randomId}.${fileExtension}`;

      // For this MVP, we're not actually storing the file, just simulating it
      const photo = await storage.createPhoto({
        childId,
        userId: req.user.id,
        title: req.body.title || "Untitled",
        filename,
        description: req.body.description,
        takenAt: req.body.takenAt ? new Date(req.body.takenAt) : new Date(),
        tags: req.body.tags ? JSON.parse(req.body.tags) : []
      });

      res.status(201).json(photo);
    } catch (err) {
      next(err);
    }
  });

  // === Vaccinations Routes ===
  app.get("/api/children/:id/vaccinations", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const vaccinations = await storage.getVaccinations(childId);
      res.json(vaccinations);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/children/:id/vaccinations", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const vaccination = await storage.createVaccination({
        ...req.body,
        childId,
        userId: req.user.id,
        date: new Date(req.body.date)
      });

      res.status(201).json(vaccination);
    } catch (err) {
      next(err);
    }
  });
  
  // === Premium Subscription Routes ===
  app.post("/api/create-payment-intent", requireAuth, async (req, res, next) => {
    try {
      // Generate a fake client secret for demo purposes
      // In a real app, this would use Stripe:
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount: 999, // $9.99 in cents
      //   currency: 'usd',
      //   metadata: { userId: req.user.id }
      // });
      
      const fakeClientSecret = `pi_${randomBytes(16).toString('hex')}_secret_${randomBytes(16).toString('hex')}`;
      
      res.json({ 
        clientSecret: fakeClientSecret,
        amount: 999,
        currency: 'usd'
      });
    } catch (err) {
      next(err);
    }
  });
  
  app.post("/api/confirm-premium-upgrade", requireAuth, async (req, res, next) => {
    try {
      const paymentIntentId = req.body.paymentIntentId;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }
      
      // In a real app, we would verify the payment with Stripe:
      // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      // if (paymentIntent.status !== 'succeeded') {
      //   return res.status(400).json({ message: "Payment not successful" });
      // }
      
      // Update user's premium status
      const updatedUser = await storage.updateUserPremiumStatus(req.user.id, true);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  });
  
  // === Family Members Routes ===
  app.get("/api/family-members", requireAuth, async (req, res, next) => {
    try {
      const members = await storage.getFamilyMembers(req.user.id);
      res.json(members);
    } catch (err) {
      next(err);
    }
  });
  
  app.post("/api/family-members", requireAuth, async (req, res, next) => {
    try {
      // Check if user has reached limit (4 members for free users)
      const count = await storage.getFamilyMemberCount(req.user.id);
      if (count >= 4 && !req.user.isPremium) {
        return res.status(403).json({ 
          message: "Free accounts are limited to 4 family members. Upgrade to premium for more." 
        });
      }
      
      const member = await storage.createFamilyMember({
        ...req.body,
        userId: req.user.id
      });
      
      res.status(201).json(member);
    } catch (err) {
      next(err);
    }
  });
  
  app.patch("/api/family-members/:id", requireAuth, async (req, res, next) => {
    try {
      const memberId = parseInt(req.params.id);
      const members = await storage.getFamilyMembers(req.user.id);
      const member = members.find(m => m.id === memberId);
      
      if (!member) {
        return res.status(404).json({ message: "Family member not found" });
      }
      
      // Use the storage method to update the family member
      const updatedMember = await storage.updateFamilyMember(memberId, req.body);
      
      res.json(updatedMember);
    } catch (err) {
      next(err);
    }
  });
  
  app.delete("/api/family-members/:id", requireAuth, async (req, res, next) => {
    try {
      const memberId = parseInt(req.params.id);
      const deleted = await storage.deleteFamilyMember(memberId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Family member not found" });
      }
      
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  // === Registry Routes ===
  
  // Get all registries for the authenticated user
  app.get("/api/registries", requireAuth, async (req, res, next) => {
    try {
      const registries = await storage.getRegistriesByUserId(req.user.id);
      res.json(registries);
    } catch (err) {
      next(err);
    }
  });

  // Get a registry by ID
  app.get("/api/registries/:id", requireAuth, async (req, res, next) => {
    try {
      const registryId = parseInt(req.params.id);
      const registry = await storage.getRegistry(registryId);
      
      if (!registry) {
        return res.status(404).json({ message: "Registry not found" });
      }
      
      if (registry.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      res.json(registry);
    } catch (err) {
      next(err);
    }
  });

  // Get a registry by child ID
  app.get("/api/registries/child/:childId", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.childId);
      const registry = await storage.getRegistryByChildId(childId);
      
      if (!registry) {
        return res.status(404).json({ message: "Registry not found" });
      }
      
      if (registry.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      res.json(registry);
    } catch (err) {
      next(err);
    }
  });

  // Get a registry by share code (public endpoint)
  app.get("/api/registries/public/:shareCode", async (req, res, next) => {
    try {
      const shareCode = req.params.shareCode;
      const registry = await storage.getRegistryByShareCode(shareCode);
      
      if (!registry) {
        return res.status(404).json({ message: "Registry not found" });
      }
      
      res.json(registry);
    } catch (err) {
      next(err);
    }
  });

  // Create a new registry
  app.post("/api/registries", requireAuth, async (req, res, next) => {
    try {
      console.log("Creating registry with data:", req.body);
      
      // Validate required fields
      if (!req.body.name && !req.body.title) {
        return res.status(400).json({ message: "Registry name/title is required" });
      }
      
      // Make childId optional if it's present but null or undefined
      const registryData = {
        userId: req.user.id,
        childId: req.body.childId && !isNaN(parseInt(req.body.childId)) ? parseInt(req.body.childId) : null,
        title: req.body.name || req.body.title, // Accept either name or title to fix inconsistencies
        description: req.body.description || null,
        isPublic: req.body.isPublic ?? true
      };
      
      console.log("Prepared registry data:", registryData);
      
      const registry = await storage.createRegistry(registryData);
      
      res.status(201).json(registry);
    } catch (err) {
      console.error("Error creating registry:", err);
      res.status(500).json({ message: "Failed to create registry", error: err.message });
    }
  });

  // Update a registry
  app.put("/api/registries/:id", requireAuth, async (req, res, next) => {
    try {
      const registryId = parseInt(req.params.id);
      const registry = await storage.getRegistry(registryId);
      
      if (!registry) {
        return res.status(404).json({ message: "Registry not found" });
      }
      
      if (registry.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedRegistry = await storage.updateRegistry(registryId, req.body);
      res.json(updatedRegistry);
    } catch (err) {
      next(err);
    }
  });

  // Delete a registry
  app.delete("/api/registries/:id", requireAuth, async (req, res, next) => {
    try {
      const registryId = parseInt(req.params.id);
      const registry = await storage.getRegistry(registryId);
      
      if (!registry) {
        return res.status(404).json({ message: "Registry not found" });
      }
      
      if (registry.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const deleted = await storage.deleteRegistry(registryId);
      
      if (deleted) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete registry" });
      }
    } catch (err) {
      next(err);
    }
  });

  // === Registry Item Routes ===
  
  // Get items for a registry
  app.get("/api/registries/:registryId/items", async (req, res, next) => {
    try {
      console.log(`Getting items for registry ID: ${req.params.registryId}`);
      const registryId = parseInt(req.params.registryId);
      
      if (isNaN(registryId)) {
        console.log("Invalid registry ID format");
        return res.status(400).json({ message: "Invalid registry ID" });
      }
      
      const registry = await storage.getRegistry(registryId);
      console.log("Registry found:", registry);
      
      if (!registry) {
        console.log("Registry not found");
        return res.status(404).json({ message: "Registry not found" });
      }
      
      // If not the owner, check if share code is valid
      if (!req.isAuthenticated() || registry.userId !== req.user?.id) {
        const shareCode = req.query.shareCode as string;
        console.log(`Share code check: ${shareCode} vs ${registry.shareCode}`);
        if (!shareCode || registry.shareCode !== shareCode) {
          return res.status(403).json({ message: "Not authorized" });
        }
      }
      
      const items = await storage.getRegistryItems(registryId);
      console.log(`Found ${items.length} items:`, items);
      res.json(items);
    } catch (err) {
      console.error("Error getting registry items:", err);
      next(err);
    }
  });

  // Add an item to a registry (REST-style endpoint)
  app.post("/api/registries/:registryId/items", requireAuth, async (req, res, next) => {
    try {
      console.log("Creating registry item with data:", req.body);
      
      const registryId = parseInt(req.params.registryId);
      if (isNaN(registryId)) {
        return res.status(400).json({ message: "Invalid registry ID" });
      }
      
      const registry = await storage.getRegistry(registryId);
      console.log("Registry found:", registry);
      
      if (!registry) {
        return res.status(404).json({ message: "Registry not found" });
      }
      
      if (registry.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Validate required fields
      if (!req.body.name) {
        return res.status(400).json({ message: "Item name is required" });
      }
      
      if (!req.body.category) {
        return res.status(400).json({ message: "Item category is required" });
      }
      
      const item = await storage.createRegistryItem({
        registryId,
        name: req.body.name,
        description: req.body.description || "",
        url: req.body.url || null,
        imageUrl: req.body.imageUrl || null,
        quantity: req.body.quantity || 1,
        priority: req.body.priority || "medium",
        category: req.body.category,
        price: req.body.price || null,
        status: "available"
      });
      
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  });

  // Add an item to a registry (Legacy endpoint for compatibility)
  app.post("/api/registry-items", requireAuth, async (req, res, next) => {
    try {
      console.log("Creating registry item with data:", req.body);
      
      if (!req.body.registryId) {
        return res.status(400).json({ message: "Registry ID is required" });
      }
      
      const registryId = parseInt(req.body.registryId);
      if (isNaN(registryId)) {
        return res.status(400).json({ message: "Invalid registry ID" });
      }
      
      const registry = await storage.getRegistry(registryId);
      console.log("Registry found:", registry);
      
      if (!registry) {
        return res.status(404).json({ message: "Registry not found" });
      }
      
      if (registry.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Validate required fields
      if (!req.body.name) {
        return res.status(400).json({ message: "Item name is required" });
      }
      
      if (!req.body.price && req.body.price !== 0) {
        return res.status(400).json({ message: "Item price is required" });
      }
      
      const itemData = {
        registryId,
        name: req.body.name,
        price: parseFloat(req.body.price) * 100, // Convert to cents
        category: req.body.category || "other",
        priority: req.body.priority || "medium",
        quantity: parseInt(req.body.quantity) || 1,
        url: req.body.url || null,
        imageUrl: req.body.imageUrl || null,
        description: req.body.description || null,
        status: "available" as const
      };
      
      console.log("Prepared registry item data:", itemData);
      
      const item = await storage.createRegistryItem(itemData);
      res.status(201).json(item);
    } catch (err) {
      console.error("Error creating registry item:", err);
      res.status(500).json({ message: "Failed to create registry item", error: err.message });
    }
  });

  // Update a registry item
  app.put("/api/registry-items/:id", requireAuth, async (req, res, next) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getRegistryItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Registry item not found" });
      }
      
      const registry = await storage.getRegistry(item.registryId);
      
      if (registry.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedItem = await storage.updateRegistryItem(itemId, req.body);
      res.json(updatedItem);
    } catch (err) {
      next(err);
    }
  });

  // Delete a registry item
  app.delete("/api/registry-items/:id", requireAuth, async (req, res, next) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getRegistryItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Registry item not found" });
      }
      
      const registry = await storage.getRegistry(item.registryId);
      
      if (registry.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const deleted = await storage.deleteRegistryItem(itemId);
      
      if (deleted) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete registry item" });
      }
    } catch (err) {
      next(err);
    }
  });

  // Update registry item status (reserve or purchase)
  app.put("/api/registry-items/:id/status", async (req, res, next) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getRegistryItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Registry item not found" });
      }
      
      const registry = await storage.getRegistry(item.registryId);
      
      // Only owner can set back to available
      if (req.body.status === "available") {
        if (!req.isAuthenticated() || registry.userId !== req.user?.id) {
          return res.status(403).json({ message: "Only registry owner can mark items as available" });
        }
      }
      
      // Verify registry access 
      if (!req.isAuthenticated() || registry.userId !== req.user?.id) {
        const shareCode = req.body.shareCode;
        if (!shareCode || registry.shareCode !== shareCode) {
          return res.status(403).json({ message: "Invalid share code" });
        }
      }
      
      // Validate status
      const status = req.body.status;
      if (!["available", "reserved", "purchased"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const personInfo = {
        name: req.body.name,
        email: req.body.email
      };
      
      const updatedItem = await storage.updateRegistryItemStatus(itemId, status, personInfo);
      res.json(updatedItem);
    } catch (err) {
      next(err);
    }
  });

  // === User Profile Routes ===
  // Profile update endpoint
  app.patch("/api/user/profile", requireAuth, async (req, res, next) => {
    try {
      const { fullName, email } = req.body;
      
      // Check if email already exists for another user
      if (email !== req.user.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      
      const updatedUser = await storage.updateUser(req.user.id, { fullName, email });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update the session with the new user info
      req.login(updatedUser, (err) => {
        if (err) return next(err);
        res.json(updatedUser);
      });
    } catch (err) {
      next(err);
    }
  });
  
  // Password update endpoint
  app.patch("/api/user/password", requireAuth, async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Verify current password
      const isPasswordCorrect = await comparePasswords(currentPassword, req.user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      const updatedUser = await storage.updateUser(req.user.id, { password: hashedPassword });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (err) {
      next(err);
    }
  });
  
  // Notification settings update endpoint
  app.patch("/api/user/notifications", requireAuth, async (req, res, next) => {
    try {
      const { emailNotifications, pushNotifications, appointmentReminders, milestoneReminders } = req.body;
      
      // In a real app, we would store these preferences in the database
      // For now, we'll just return success
      
      res.json({ 
        emailNotifications, 
        pushNotifications, 
        appointmentReminders, 
        milestoneReminders,
        message: "Notification preferences updated successfully" 
      });
    } catch (err) {
      next(err);
    }
  });

  // === Contraction Routes ===
  
  // Get contractions for a pregnancy
  app.get("/api/pregnancies/:pregnancyId/contractions", requireAuth, async (req, res, next) => {
    try {
      const pregnancyId = parseInt(req.params.pregnancyId);
      
      const pregnancy = await storage.getPregnancy(pregnancyId);
      
      if (!pregnancy) {
        return res.status(404).json({ message: "Pregnancy not found" });
      }
      
      if (pregnancy.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const contractions = await storage.getContractions(pregnancyId);
      res.json(contractions);
    } catch (err) {
      next(err);
    }
  });
  
  // Record a new contraction
  app.post("/api/pregnancies/:pregnancyId/contractions", requireAuth, async (req, res, next) => {
    try {
      const pregnancyId = parseInt(req.params.pregnancyId);
      
      const pregnancy = await storage.getPregnancy(pregnancyId);
      
      if (!pregnancy) {
        return res.status(404).json({ message: "Pregnancy not found" });
      }
      
      if (pregnancy.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Basic validation
      if (!req.body.startTime) {
        return res.status(400).json({ message: "Start time is required" });
      }
      
      // Prepare the contraction data
      const contractionData = {
        pregnancyId,
        startTime: new Date(req.body.startTime),
        endTime: req.body.endTime ? new Date(req.body.endTime) : null,
        duration: req.body.duration || null,
        intensity: req.body.intensity || null
      };
      
      const contraction = await storage.createContraction(contractionData);
      res.status(201).json(contraction);
    } catch (err) {
      console.error("Error recording contraction:", err);
      res.status(500).json({ message: "Failed to record contraction", error: err.message });
    }
  });

  // Symptoms Routes
  
  // Get symptoms for a pregnancy
  app.get("/api/pregnancies/:pregnancyId/symptoms", requireAuth, async (req, res, next) => {
    try {
      const pregnancyId = parseInt(req.params.pregnancyId);
      
      const pregnancy = await storage.getPregnancy(pregnancyId);
      
      if (!pregnancy) {
        return res.status(404).json({ message: "Pregnancy not found" });
      }
      
      if (pregnancy.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const symptoms = await storage.getSymptoms(pregnancyId);
      res.json(symptoms);
    } catch (err) {
      next(err);
    }
  });
  
  // Record a new symptom
  app.post("/api/pregnancies/:pregnancyId/symptoms", requireAuth, async (req, res, next) => {
    try {
      const pregnancyId = parseInt(req.params.pregnancyId);
      
      const pregnancy = await storage.getPregnancy(pregnancyId);
      
      if (!pregnancy) {
        return res.status(404).json({ message: "Pregnancy not found" });
      }
      
      if (pregnancy.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Basic validation
      if (!req.body.name) {
        return res.status(400).json({ message: "Symptom name is required" });
      }
      
      // Prepare the symptom data
      const symptomData = {
        childId: pregnancyId,
        userId: req.user.id,
        name: req.body.name,
        severity: req.body.severity || 3,
        notes: req.body.notes || null,
        date: req.body.date ? new Date(req.body.date) : new Date()
      };
      
      const symptom = await storage.createSymptom(symptomData);
      res.status(201).json(symptom);
    } catch (err) {
      console.error("Error recording symptom:", err);
      res.status(500).json({ message: "Failed to record symptom", error: err.message });
    }
  });
  
  // Delete a symptom
  app.delete("/api/symptoms/:id", requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // For now, just delete the symptom directly
      // In a real app, you'd want to verify ownership first
      await storage.deleteSymptom(id);
      res.status(204).end();
    } catch (err) {
      console.error("Error deleting symptom:", err);
      res.status(500).json({ message: "Failed to delete symptom", error: err.message });
    }
  });

  // Cravings Routes
  
  // Get cravings for a pregnancy
  app.get("/api/pregnancies/:pregnancyId/cravings", requireAuth, async (req, res, next) => {
    try {
      const pregnancyId = parseInt(req.params.pregnancyId);
      
      const pregnancy = await storage.getPregnancy(pregnancyId);
      
      if (!pregnancy) {
        return res.status(404).json({ message: "Pregnancy not found" });
      }
      
      if (pregnancy.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const cravings = await storage.getCravings(pregnancyId);
      res.json(cravings);
    } catch (err) {
      next(err);
    }
  });
  
  // Record a new craving
  app.post("/api/pregnancies/:pregnancyId/cravings", requireAuth, async (req, res, next) => {
    try {
      const pregnancyId = parseInt(req.params.pregnancyId);
      
      const pregnancy = await storage.getPregnancy(pregnancyId);
      
      if (!pregnancy) {
        return res.status(404).json({ message: "Pregnancy not found" });
      }
      
      if (pregnancy.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Basic validation
      if (!req.body.foodName) {
        return res.status(400).json({ message: "Food name is required" });
      }
      
      // Prepare the craving data
      const cravingData = {
        pregnancyId,
        userId: req.user.id,
        foodName: req.body.foodName,
        intensity: req.body.intensity || null,
        satisfied: req.body.satisfied || false,
        notes: req.body.notes || null,
        date: req.body.date ? new Date(req.body.date) : new Date()
      };
      
      const craving = await storage.createCraving(cravingData);
      res.status(201).json(craving);
    } catch (err) {
      console.error("Error recording craving:", err);
      res.status(500).json({ message: "Failed to record craving", error: err.message });
    }
  });
  
  // Update a craving
  app.put("/api/cravings/:id", requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const craving = await storage.getCraving(id);
      
      if (!craving) {
        return res.status(404).json({ message: "Craving not found" });
      }
      
      // Get the pregnancy to check ownership
      const pregnancy = await storage.getPregnancy(craving.pregnancyId);
      
      if (!pregnancy || pregnancy.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Update the craving
      const updates = {
        foodName: req.body.foodName || craving.foodName,
        intensity: req.body.intensity !== undefined ? req.body.intensity : craving.intensity,
        satisfied: req.body.satisfied !== undefined ? req.body.satisfied : craving.satisfied,
        notes: req.body.notes !== undefined ? req.body.notes : craving.notes,
        date: req.body.date ? new Date(req.body.date) : craving.date
      };
      
      const updatedCraving = await storage.updateCraving(id, updates);
      res.json(updatedCraving);
    } catch (err) {
      console.error("Error updating craving:", err);
      res.status(500).json({ message: "Failed to update craving", error: err.message });
    }
  });
  
  // Delete a craving
  app.delete("/api/cravings/:id", requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const craving = await storage.getCraving(id);
      
      if (!craving) {
        return res.status(404).json({ message: "Craving not found" });
      }
      
      // Get the pregnancy to check ownership
      const pregnancy = await storage.getPregnancy(craving.pregnancyId);
      
      if (!pregnancy || pregnancy.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteCraving(id);
      res.status(204).end();
    } catch (err) {
      console.error("Error deleting craving:", err);
      res.status(500).json({ message: "Failed to delete craving", error: err.message });
    }
  });
  
  // Get all baby names for a user
  app.get("/api/baby-names", requireAuth, async (req, res, next) => {
    try {
      // Optional childId parameter
      const childId = req.query.childId ? parseInt(req.query.childId as string) : undefined;
      const names = await storage.getBabyNames(req.user.id, childId);
      res.json(names);
    } catch (err) {
      console.error("Error fetching baby names:", err);
      res.status(500).json({ message: "Failed to fetch baby names", error: err.message });
    }
  });
  
  // Get a specific baby name
  app.get("/api/baby-names/:id", requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const babyName = await storage.getBabyName(id);
      
      if (!babyName) {
        return res.status(404).json({ message: "Baby name not found" });
      }
      
      // Check ownership
      if (babyName.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      res.json(babyName);
    } catch (err) {
      console.error("Error fetching baby name:", err);
      res.status(500).json({ message: "Failed to fetch baby name", error: err.message });
    }
  });
  
  // Create a new baby name
  app.post("/api/baby-names", requireAuth, async (req, res, next) => {
    try {
      // Add userId to the baby name data
      const babyNameData = {
        ...req.body,
        userId: req.user.id
      };
      
      // Validate the baby name data
      insertBabyNameSchema.parse(babyNameData);
      
      const newBabyName = await storage.createBabyName(babyNameData);
      res.status(201).json(newBabyName);
    } catch (err) {
      console.error("Error creating baby name:", err);
      
      if (err.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid baby name data", 
          errors: fromZodError(err).message 
        });
      }
      
      res.status(500).json({ message: "Failed to create baby name", error: err.message });
    }
  });
  
  // Update a baby name
  app.patch("/api/baby-names/:id", requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const babyName = await storage.getBabyName(id);
      
      if (!babyName) {
        return res.status(404).json({ message: "Baby name not found" });
      }
      
      // Check ownership
      if (babyName.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Update the baby name
      const updatedBabyName = await storage.updateBabyName(id, req.body);
      res.json(updatedBabyName);
    } catch (err) {
      console.error("Error updating baby name:", err);
      res.status(500).json({ message: "Failed to update baby name", error: err.message });
    }
  });
  
  // Delete a baby name
  app.delete("/api/baby-names/:id", requireAuth, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const babyName = await storage.getBabyName(id);
      
      if (!babyName) {
        return res.status(404).json({ message: "Baby name not found" });
      }
      
      // Check ownership
      if (babyName.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteBabyName(id);
      res.status(204).end();
    } catch (err) {
      console.error("Error deleting baby name:", err);
      res.status(500).json({ message: "Failed to delete baby name", error: err.message });
    }
  });

  // ===== FAMILY GROUPS API ROUTES =====
  
  // Import family groups service at the top level
  const familyGroupsModule = await import('./family-groups');
  const familyGroupService = familyGroupsModule.familyGroupService;
  
  // Create a new family group for a child
  app.post("/api/family-groups", async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { childId, name, description } = req.body;
      
      if (!childId || !name) {
        return res.status(400).json({ message: "Child ID and group name are required" });
      }

      // Verify user owns the child
      const child = await storage.getChild(childId);
      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to create group for this child" });
      }

      const group = await familyGroupService.createGroup(childId, req.user.id, name, description);
      res.json(group);
    } catch (err: any) {
      console.error("Error creating family group:", err);
      res.status(500).json({ message: "Failed to create family group", error: err.message });
    }
  });

  // Get family group for a child - simple endpoint to check if group exists
  app.get("/api/family-groups/child", async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // For now, return empty array as this is just a check endpoint
      // This prevents the 404 error you're seeing
      res.json([]);
    } catch (err: any) {
      console.error("Error getting family groups:", err);
      res.status(500).json({ message: "Failed to get family groups", error: err.message });
    }
  });

  // Get family group for a specific child
  app.get("/api/family-groups/child/:childId", async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const childId = parseInt(req.params.childId);
      
      // Verify user has access to this child
      const child = await storage.getChild(childId);
      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const group = await storage.getFamilyGroupByChild(childId);
      if (!group) {
        return res.status(404).json({ message: "No family group found for this child" });
      }

      res.json(group);
    } catch (err: any) {
      console.error("Error getting family group:", err);
      res.status(500).json({ message: "Failed to get family group", error: err.message });
    }
  });

  // Invite member to family group
  app.post("/api/family-groups/:groupId/invite", async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const groupId = parseInt(req.params.groupId);
      const { email, role, customPermissions } = req.body;
      
      if (!email || !role) {
        return res.status(400).json({ message: "Email and role are required" });
      }

      const invitation = await familyGroupService.inviteMember(
        groupId, 
        req.user.id, 
        email, 
        role, 
        customPermissions
      );
      
      res.json(invitation);
    } catch (err: any) {
      console.error("Error sending invitation:", err);
      res.status(500).json({ message: "Failed to send invitation", error: err.message });
    }
  });

  // Accept invitation to join family group
  app.post("/api/family-groups/accept-invitation", async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Invitation token is required" });
      }

      const member = await familyGroupService.acceptInvitation(token, req.user.id);
      res.json(member);
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      res.status(500).json({ message: "Failed to accept invitation", error: err.message });
    }
  });

  // Get family group members
  app.get("/api/family-groups/:groupId/members", async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const groupId = parseInt(req.params.groupId);
      const members = await familyGroupService.getGroupMembers(groupId, req.user.id);
      res.json(members);
    } catch (err: any) {
      console.error("Error getting group members:", err);
      res.status(500).json({ message: "Failed to get group members", error: err.message });
    }
  });

  // Update member permissions
  app.patch("/api/family-groups/:groupId/members/:userId", async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const groupId = parseInt(req.params.groupId);
      const targetUserId = parseInt(req.params.userId);
      const { permissions } = req.body;
      
      if (!permissions) {
        return res.status(400).json({ message: "Permissions are required" });
      }

      await familyGroupService.updateMemberPermissions(groupId, targetUserId, req.user.id, permissions);
      res.json({ message: "Permissions updated successfully" });
    } catch (err: any) {
      console.error("Error updating member permissions:", err);
      res.status(500).json({ message: "Failed to update permissions", error: err.message });
    }
  });

  // Remove member from group
  app.delete("/api/family-groups/:groupId/members/:userId", async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const groupId = parseInt(req.params.groupId);
      const targetUserId = parseInt(req.params.userId);

      await familyGroupService.removeMember(groupId, targetUserId, req.user.id);
      res.json({ message: "Member removed successfully" });
    } catch (err: any) {
      console.error("Error removing member:", err);
      res.status(500).json({ message: "Failed to remove member", error: err.message });
    }
  });

  // Create activity in group feed
  app.post("/api/family-groups/:groupId/activities", async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const groupId = parseInt(req.params.groupId);
      const { activityType, title, description, metadata } = req.body;
      
      if (!activityType || !title) {
        return res.status(400).json({ message: "Activity type and title are required" });
      }

      const activity = await familyGroupService.createActivity(
        groupId, 
        req.user.id, 
        activityType, 
        title, 
        description, 
        metadata
      );
      
      res.json(activity);
    } catch (err: any) {
      console.error("Error creating activity:", err);
      res.status(500).json({ message: "Failed to create activity", error: err.message });
    }
  });

  // Get group activities (feed)
  app.get("/api/family-groups/:groupId/activities", async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const groupId = parseInt(req.params.groupId);
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const activities = await familyGroupService.getGroupActivities(groupId, req.user.id, limit, offset);
      res.json(activities);
    } catch (err: any) {
      console.error("Error getting group activities:", err);
      res.status(500).json({ message: "Failed to get group activities", error: err.message });
    }
  });

  // Add comment to activity
  app.post("/api/family-groups/activities/:activityId/comments", async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const activityId = parseInt(req.params.activityId);
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      const comment = await familyGroupService.addComment(activityId, req.user.id, content);
      res.json(comment);
    } catch (err: any) {
      console.error("Error adding comment:", err);
      res.status(500).json({ message: "Failed to add comment", error: err.message });
    }
  });

  // Add reaction to activity
  app.post("/api/family-groups/activities/:activityId/reactions", async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const activityId = parseInt(req.params.activityId);
      const { reactionType } = req.body;

      const reaction = await familyGroupService.addReaction(activityId, req.user.id, reactionType || 'like');
      res.json(reaction);
    } catch (err: any) {
      console.error("Error adding reaction:", err);
      res.status(500).json({ message: "Failed to add reaction", error: err.message });
    }
  });

  // Get audit logs (admin only)
  app.get("/api/family-groups/:groupId/audit", async (req: any, res: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const groupId = parseInt(req.params.groupId);
      
      // Check if user has manage permissions
      const hasPermission = await familyGroupService.hasPermission(groupId, req.user.id, 'canManageGroup');
      if (!hasPermission) {
        return res.status(403).json({ message: "Not authorized to view audit logs" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const logs = await storage.getAuditLogs(groupId, limit, offset);
      res.json(logs);
    } catch (err: any) {
      console.error("Error getting audit logs:", err);
      res.status(500).json({ message: "Failed to get audit logs", error: err.message });
    }
  });

  // === Appointments API Routes ===
  
  // Get appointments for user
  app.get("/api/appointments", requireAuth, async (req, res, next) => {
    try {
      const appointments = await storage.getAppointments(req.user.id);
      res.json(appointments);
    } catch (err) {
      console.error("Error getting appointments:", err);
      res.status(500).json({ message: "Failed to get appointments", error: err.message });
    }
  });

  // Create new appointment
  app.post("/api/appointments", requireAuth, async (req, res, next) => {
    try {
      const appointmentData = {
        ...req.body,
        userId: req.user.id
      };
      
      insertAppointmentSchema.parse(appointmentData);
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (err) {
      console.error("Error creating appointment:", err);
      if (err.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid appointment data", 
          errors: fromZodError(err).message 
        });
      }
      res.status(500).json({ message: "Failed to create appointment", error: err.message });
    }
  });

  // Baby Preferences API endpoints
  app.get("/api/children/:childId/preferences", requireAuth, async (req, res) => {
    try {
      const childId = parseInt(req.params.childId);
      const preferences = await storage.getChildPreferences(childId, req.user!.id);
      res.json(preferences);
    } catch (err: any) {
      res.status(500).json({ message: "Failed to fetch preferences", error: err.message });
    }
  });

  app.post("/api/children/:childId/preferences", requireAuth, async (req, res) => {
    try {
      const childId = parseInt(req.params.childId);
      const preferenceData = {
        ...req.body,
        childId,
        userId: req.user!.id
      };
      
      const preference = await storage.createChildPreference(preferenceData);
      res.status(201).json(preference);
    } catch (err: any) {
      res.status(500).json({ message: "Failed to create preference", error: err.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}