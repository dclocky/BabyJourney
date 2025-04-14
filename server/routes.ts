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

  // Child profile management
  app.get("/api/children", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const children = await storage.getChildren(req.user.id);
      res.json(children);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/children/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  app.post("/api/children", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  app.put("/api/children/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  // Pregnancy journal
  app.get("/api/children/:id/pregnancy-journal", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  app.get("/api/children/:id/pregnancy-journal/:week", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  app.post("/api/children/:id/pregnancy-journal", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  app.put("/api/children/:childId/pregnancy-journal/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const childId = parseInt(req.params.childId);
      const journalId = parseInt(req.params.id);
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

  // Symptoms
  app.get("/api/children/:id/symptoms", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  app.post("/api/children/:id/symptoms", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  // Milestones
  app.get("/api/children/:id/milestones", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  app.get("/api/children/:id/milestones/recent", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  app.post("/api/children/:id/milestones", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  // Growth records
  app.get("/api/children/:id/growth", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  app.post("/api/children/:id/growth", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  // Appointments
  app.get("/api/children/:id/appointments", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  app.get("/api/children/:id/appointments/upcoming", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  app.post("/api/children/:id/appointments", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  // Photos
  app.get("/api/children/:id/photos", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  app.get("/api/children/:id/photos/count", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  app.post("/api/children/:id/photos", upload.single('photo'), async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  // Vaccinations
  app.get("/api/children/:id/vaccinations", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  app.post("/api/children/:id/vaccinations", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
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

  const httpServer = createServer(app);
  return httpServer;
}
