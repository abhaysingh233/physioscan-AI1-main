import dotenv from "dotenv";
dotenv.config();
import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import xss from "xss";
import { createServer as createViteServer } from "vite";
import db from "./server/db/database";
import healthRoutes from "./server/routes/healthRoutes";
import authRoutes from "./server/routes/authRoutes";
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust the first proxy (required for rate limiting behind a reverse proxy)
  app.set('trust proxy', 1);

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for dev/vite compatibility
  }));

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: "Too many requests, please try again later." },
    validate: {
      xForwardedForHeader: false,
      trustProxy: false,
    }
  });
  app.use("/api/", limiter);

  app.use(express.json());
  app.use(session({
    secret: process.env.SESSION_SECRET || "physioscan-secret-key-123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true, // Prevent XSS attacks on session cookie
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  // Auth Middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    if ((req.session as any).userId) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  // Validation Middleware Helper
  const validate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
  };


  // API Routes
  app.use("/api", healthRoutes);
  app.use("/api/auth", authRoutes);

  // Auth Routes
  app.post("/api/auth/signup", [
    body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('name').trim().notEmpty().withMessage('Name is required').customSanitizer(value => xss(value)),
    validate
  ], async (req: any, res: any) => {
    try {
      const { email, password, name } = req.body;

      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)");
      const info = stmt.run(email, hashedPassword, name);
      
      (req.session as any).userId = info.lastInsertRowid as number;
      res.json({ success: true, user: { id: info.lastInsertRowid, email, name } });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", [
    body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    validate
  ], async (req: any, res: any) => {
    try {
      const { email, password } = req.body;
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      (req.session as any).userId = user.id;
      res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!(req.session as any).userId) return res.status(401).json({ error: "Not logged in" });
    const user = db.prepare("SELECT id, email, name FROM users WHERE id = ?").get((req.session as any).userId) as any;
    if (!user) return res.status(401).json({ error: "User not found" });
    res.json({ user });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    res.json({ 
      status: "ok", 
      message: "PhysioScan AI Backend is running",
      apiKeyStatus: apiKey ? "SET" : "UNDEFINED",
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 5) : null
    });
  });

  app.get("/api/user-history", isAuthenticated, (req: any, res) => {
    try {
      const recentSymptoms = db.prepare("SELECT * FROM symptoms WHERE user_id = ? ORDER BY date DESC LIMIT 5").all(req.session.userId);
      res.json({ recentSymptoms });
    } catch (error) {
      console.error("Error fetching user history:", error);
      res.status(500).json({ error: "Failed to fetch user history" });
    }
  });

  app.get("/api/symptoms", isAuthenticated, (req: any, res) => {
    try {
      const stmt = db.prepare("SELECT * FROM symptoms WHERE user_id = ? ORDER BY date DESC");
      const symptoms = stmt.all((req.session as any).userId);
      res.json({ symptoms });
    } catch (error) {
      console.error("Error fetching symptoms:", error);
      res.status(500).json({ error: "Failed to fetch symptoms" });
    }
  });

  app.post("/api/symptoms", isAuthenticated, [
    body('date').isISO8601().withMessage('Valid date is required'),
    body('symptom').trim().notEmpty().withMessage('Symptom is required').customSanitizer(value => xss(value)),
    body('severity').isInt({ min: 1, max: 10 }).withMessage('Severity must be a number between 1 and 10'),
    body('notes').optional().trim().customSanitizer(value => xss(value)),
    validate
  ], (req: any, res: any) => {
    try {
      const { date, symptom, severity, notes } = req.body;

      const stmt = db.prepare("INSERT INTO symptoms (user_id, date, symptom, severity, notes) VALUES (?, ?, ?, ?, ?)");
      const info = stmt.run((req.session as any).userId, date, symptom, severity, notes || "");
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (error) {
      console.error("Error adding symptom:", error);
      res.status(500).json({ error: "Failed to add symptom" });
    }
  });



  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
