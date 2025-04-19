import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import { randomBytes } from "crypto";
import { format } from "date-fns";

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
      const pregnancy = await storage.createPregnancy({
        userId: req.user.id,
        name: req.body.babyName || "Baby",
        dueDate: new Date(req.body.dueDate),
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

      const child = await storage.createChild({
        ...req.body,
        userId: req.user.id
      });

      res.status(201).json(child);
    } catch (err) {
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

      const milestones = await storage.getRecentMilestones(childId, limit);
      res.json(milestones);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/children/:id/milestones", requireAuth, async (req, res, next) => {
    try {
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const milestone = await storage.createMilestone({
        ...req.body,
        childId,
        userId: req.user.id,
        date: new Date(req.body.date)
      });

      res.status(201).json(milestone);
    } catch (err) {
      next(err);
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
      const childId = parseInt(req.params.id);
      const child = await storage.getChild(childId);

      if (!child || child.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const appointment = await storage.createAppointment({
        ...req.body,
        childId,
        userId: req.user.id,
        date: new Date(req.body.date)
      });

      res.status(201).json(appointment);
    } catch (err) {
      next(err);
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
      const registry = await storage.createRegistry({
        ...req.body,
        userId: req.user.id
      });
      
      res.status(201).json(registry);
    } catch (err) {
      next(err);
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
      const registryId = parseInt(req.params.registryId);
      const registry = await storage.getRegistry(registryId);
      
      if (!registry) {
        return res.status(404).json({ message: "Registry not found" });
      }
      
      // If not the owner, check if share code is valid
      if (!req.isAuthenticated() || registry.userId !== req.user?.id) {
        const shareCode = req.query.shareCode as string;
        if (!shareCode || registry.shareCode !== shareCode) {
          return res.status(403).json({ message: "Not authorized" });
        }
      }
      
      const items = await storage.getRegistryItems(registryId);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  // Add an item to a registry
  app.post("/api/registry-items", requireAuth, async (req, res, next) => {
    try {
      const registryId = parseInt(req.body.registryId);
      const registry = await storage.getRegistry(registryId);
      
      if (!registry) {
        return res.status(404).json({ message: "Registry not found" });
      }
      
      if (registry.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const item = await storage.createRegistryItem(req.body);
      res.status(201).json(item);
    } catch (err) {
      next(err);
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

  const httpServer = createServer(app);
  return httpServer;
}