import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPainLogSchema, insertMoodLogSchema, insertInterventionSchema, insertInterventionLogSchema, insertChatMessageSchema } from "@shared/schema";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY 
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    const firebaseUid = req.headers['x-firebase-uid'];
    if (!firebaseUid) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await storage.getUserByFirebaseUid(firebaseUid as string);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  };

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByFirebaseUid(userData.firebaseUid);
      
      if (existingUser) {
        return res.json(existingUser);
      }

      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/users/me", requireAuth, async (req: any, res) => {
    res.json(req.user);
  });

  // Pain log routes
  app.get("/api/pain-logs", requireAuth, async (req: any, res) => {
    try {
      const logs = await storage.getPainLogs(req.user.id);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/pain-logs", requireAuth, async (req: any, res) => {
    try {
      const painLogData = insertPainLogSchema.parse(req.body);
      const painLog = await storage.createPainLog(req.user.id, painLogData);
      res.json(painLog);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Mood log routes
  app.get("/api/mood-logs", requireAuth, async (req: any, res) => {
    try {
      const logs = await storage.getMoodLogs(req.user.id);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/mood-logs", requireAuth, async (req: any, res) => {
    try {
      const moodLogData = insertMoodLogSchema.parse(req.body);
      const moodLog = await storage.createMoodLog(req.user.id, moodLogData);
      res.json(moodLog);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Intervention routes
  app.get("/api/interventions", requireAuth, async (req: any, res) => {
    try {
      const interventions = await storage.getInterventions(req.user.id);
      res.json(interventions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/interventions", requireAuth, async (req: any, res) => {
    try {
      const interventionData = insertInterventionSchema.parse(req.body);
      const intervention = await storage.createIntervention(req.user.id, interventionData);
      res.json(intervention);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/interventions/:id/logs", requireAuth, async (req: any, res) => {
    try {
      const logs = await storage.getInterventionLogs(
        req.user.id,
        parseInt(req.params.id, 10)
      );
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/interventions/:id/logs", requireAuth, async (req: any, res) => {
    try {
      const logData = insertInterventionLogSchema.parse({
        ...req.body,
        interventionId: parseInt(req.params.id, 10),
      });
      const log = await storage.createInterventionLog(req.user.id, logData);
      res.json(log);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Chat routes
  app.get("/api/chat/messages", requireAuth, async (req: any, res) => {
    try {
      const messages = await storage.getChatMessages(req.user.id);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/chat", requireAuth, async (req: any, res) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      
      // Save user message
      await storage.createChatMessage(req.user.id, messageData);

      // Get recent context for AI
      const recentPainLogs = await storage.getPainLogs(req.user.id, 5);
      const recentMoodLogs = await storage.getMoodLogs(req.user.id, 5);
      const interventions = await storage.getInterventions(req.user.id);

      const context = {
        recentPain: recentPainLogs.map(log => ({ level: log.painLevel, date: log.date, notes: log.notes })),
        recentMood: recentMoodLogs.map(log => ({ mood: log.mood, anxiety: log.anxietyLevel, date: log.date })),
        interventions: interventions.map(int => ({ name: int.name, frequency: int.frequency, streak: int.currentStreak }))
      };

      // Generate AI response
      const systemPrompt = `You are Pal, a compassionate AI wellness companion for PainPal app. You help users track chronic pain and mood. 
      Be empathetic, supportive, and provide actionable advice. Keep responses concise but caring.
      
      User context:
      Recent pain levels: ${JSON.stringify(context.recentPain)}
      Recent mood data: ${JSON.stringify(context.recentMood)}
      Active interventions: ${JSON.stringify(context.interventions)}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: messageData.content }
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const aiResponse = completion.choices[0]?.message?.content || "I'm here to help! Could you tell me more?";

      // Save AI response
      const aiMessage = await storage.createChatMessage(req.user.id, {
        content: aiResponse,
        isFromUser: false
      });

      res.json(aiMessage);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Daily summary route
  app.get("/api/summary/daily", requireAuth, async (req: any, res) => {
    try {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const recentPainLogs = await storage.getPainLogs(req.user.id, 7);
      const recentMoodLogs = await storage.getMoodLogs(req.user.id, 7);
      const interventions = await storage.getInterventions(req.user.id);

      const summaryPrompt = `Generate a brief daily wellness summary for the user based on their recent data. 
      Focus on trends, insights, and gentle recommendations. Keep it encouraging and under 150 words.
      
      Pain data: ${JSON.stringify(recentPainLogs)}
      Mood data: ${JSON.stringify(recentMoodLogs)}
      Interventions: ${JSON.stringify(interventions)}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: summaryPrompt }],
        max_tokens: 200,
        temperature: 0.5,
      });

      const summary = completion.choices[0]?.message?.content || "Keep up the great work tracking your wellness journey!";

      res.json({ summary });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/summary/patterns", requireAuth, async (req: any, res) => {
    try {
      const painLogs = await storage.getPainLogs(req.user.id, 30);
      const moodLogs = await storage.getMoodLogs(req.user.id, 30);
      const interventions = await storage.getInterventions(req.user.id);
      const interventionLogs = await Promise.all(
        interventions.map(async (i) => ({
          id: i.id,
          name: i.name,
          logs: await storage.getInterventionLogs(req.user.id, i.id, 30),
        }))
      );

      const patternPrompt = `Analyze the user's recent wellness data to find correlations between interventions, pain levels and mood. Provide a few short insights if any patterns stand out.

Pain logs: ${JSON.stringify(
        painLogs.map((p) => ({ level: p.painLevel, date: p.date, tags: p.tags }))
      )}
Mood logs: ${JSON.stringify(
        moodLogs.map((m) => ({ mood: m.mood, anxiety: m.anxietyLevel, date: m.date }))
      )}
Intervention logs: ${JSON.stringify(
        interventionLogs.map((i) => ({
          name: i.name,
          logs: i.logs.map((l) => ({ pain: l.painLevel, date: l.date })),
        }))
      )}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: patternPrompt }],
        max_tokens: 200,
        temperature: 0.5,
      });

      const insights =
        completion.choices[0]?.message?.content ||
        "No significant patterns detected yet.";

      res.json({ insights });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
