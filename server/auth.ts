import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { log } from "./vite";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "babyjourney_dev_secret",
    resave: true,
    saveUninitialized: true,
    rolling: true, // Resets cookie expiration on each request
    name: "babyjourney_sid", // Custom name for the session cookie (no dots due to potential issues)
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: false, // Allow both HTTP and HTTPS in all environments for Replit
      sameSite: "lax",
      httpOnly: true,
      path: "/"
    },
    proxy: true // Trust first proxy - important in Replit environment
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Debug middleware for session tracking
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Only track API requests for session debugging
    if (req.path.startsWith('/api')) {
      log(`Request ${req.method} ${req.path} - SessionID: ${req.sessionID}`);
      
      // Track session changes
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        log(`Response ${req.method} ${req.path} - Status: ${res.statusCode} - SessionID: ${req.sessionID}`);
        return originalEnd.apply(res, args);
      };
    }
    next();
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username is already taken");
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).send("Email is already registered");
      }

      // Create new user
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Create initial pregnancy record if provided
      if (req.body.pregnancy) {
        const child = await storage.createChild({
          userId: user.id,
          name: req.body.pregnancy.babyName || "Baby",
          gender: req.body.pregnancy.gender,
          dueDate: req.body.pregnancy.dueDate ? new Date(req.body.pregnancy.dueDate) : undefined,
          isPregnancy: true
        });
      }

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Force session save before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error during registration:", saveErr);
            return res.status(500).json({ error: "Failed to save session" });
          }
          console.log("Registration successful, session saved:", req.sessionID);
          res.status(201).json(user);
        });
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Force session save before responding
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ error: "Failed to save session" });
      }
      console.log("Login successful, session saved:", req.sessionID);
      res.status(200).json(req.user);
    });
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("GET /api/user - Session ID:", req.sessionID);
    console.log("GET /api/user - isAuthenticated:", req.isAuthenticated());
    console.log("GET /api/user - Session:", req.session);
    
    if (!req.isAuthenticated()) {
      console.log("GET /api/user - Not authenticated");
      return res.sendStatus(401);
    }
    
    console.log("GET /api/user - User:", req.user);
    res.json(req.user);
  });

  // Family members management
  app.get("/api/family-members", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const members = await storage.getFamilyMembers(req.user.id);
      res.json(members);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/family-members", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Check if user already has 3 family members (max 4 total users including the main user)
      const count = await storage.getFamilyMemberCount(req.user.id);
      if (count >= 3 && !req.user.isPremium) {
        return res.status(403).json({ message: "Free accounts are limited to 3 family members. Upgrade to premium for more." });
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

  app.delete("/api/family-members/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const success = await storage.deleteFamilyMember(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Family member not found" });
      }
      
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  // Premium upgrade (mock)
  app.post("/api/upgrade", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // In a real app, this would handle payment processing
      // For this MVP, we'll just upgrade the user immediately
      const updatedUser = await storage.updateUserPremiumStatus(req.user.id, true);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update the user in the session
      req.login(updatedUser, (err) => {
        if (err) return next(err);
        res.status(200).json(updatedUser);
      });
    } catch (err) {
      next(err);
    }
  });
}
