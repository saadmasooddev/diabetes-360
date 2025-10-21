import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth Routes
  
  // Signup endpoint
  app.post("/api/auth/signup", async (req, res) => {
    try {
      // Validate request body
      const validatedData = insertUserSchema.parse({
        username: req.body.email,
        fullName: req.body.fullName,
        password: req.body.password,
      });

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ 
          message: "An account with this email already exists" 
        });
      }

      // Hash password before storing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);

      // Create user with hashed password
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Return success response (without password)
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ 
        user: userWithoutPassword,
        message: "Account created successfully" 
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromError(error);
        return res.status(400).json({ 
          message: validationError.message 
        });
      }
      
      console.error("Signup error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to create account" 
      });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          message: "Email and password are required" 
        });
      }

      const user = await storage.getUserByUsername(email);
      
      if (!user) {
        return res.status(401).json({ 
          message: "Invalid credentials" 
        });
      }

      // Compare hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ 
          message: "Invalid credentials" 
        });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        user: userWithoutPassword,
        message: "Login successful" 
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ 
        message: "Login failed" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
