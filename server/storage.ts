import { 
  users, painLogs, moodLogs, interventions, chatMessages,
  type User, type InsertUser, 
  type PainLog, type InsertPainLog,
  type MoodLog, type InsertMoodLog,
  type Intervention, type InsertIntervention,
  type ChatMessage, type InsertChatMessage
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Pain log operations
  getPainLogs(userId: number, limit?: number): Promise<PainLog[]>;
  createPainLog(userId: number, painLog: InsertPainLog): Promise<PainLog>;

  // Mood log operations
  getMoodLogs(userId: number, limit?: number): Promise<MoodLog[]>;
  createMoodLog(userId: number, moodLog: InsertMoodLog): Promise<MoodLog>;

  // Intervention operations
  getInterventions(userId: number): Promise<Intervention[]>;
  createIntervention(userId: number, intervention: InsertIntervention): Promise<Intervention>;
  updateInterventionStreak(id: number, streak: number): Promise<Intervention | undefined>;

  // Chat message operations
  getChatMessages(userId: number, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(userId: number, message: InsertChatMessage): Promise<ChatMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private painLogs: Map<number, PainLog>;
  private moodLogs: Map<number, MoodLog>;
  private interventions: Map<number, Intervention>;
  private chatMessages: Map<number, ChatMessage>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.painLogs = new Map();
    this.moodLogs = new Map();
    this.interventions = new Map();
    this.chatMessages = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.firebaseUid === firebaseUid);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getPainLogs(userId: number, limit: number = 50): Promise<PainLog[]> {
    return Array.from(this.painLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async createPainLog(userId: number, insertPainLog: InsertPainLog): Promise<PainLog> {
    const id = this.currentId++;
    const painLog: PainLog = {
      ...insertPainLog,
      id,
      userId,
      date: new Date()
    };
    this.painLogs.set(id, painLog);
    return painLog;
  }

  async getMoodLogs(userId: number, limit: number = 50): Promise<MoodLog[]> {
    return Array.from(this.moodLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async createMoodLog(userId: number, insertMoodLog: InsertMoodLog): Promise<MoodLog> {
    const id = this.currentId++;
    const moodLog: MoodLog = {
      ...insertMoodLog,
      id,
      userId,
      date: new Date()
    };
    this.moodLogs.set(id, moodLog);
    return moodLog;
  }

  async getInterventions(userId: number): Promise<Intervention[]> {
    return Array.from(this.interventions.values())
      .filter(intervention => intervention.userId === userId && intervention.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createIntervention(userId: number, insertIntervention: InsertIntervention): Promise<Intervention> {
    const id = this.currentId++;
    const intervention: Intervention = {
      ...insertIntervention,
      id,
      userId,
      currentStreak: 0,
      isActive: true,
      createdAt: new Date()
    };
    this.interventions.set(id, intervention);
    return intervention;
  }

  async updateInterventionStreak(id: number, streak: number): Promise<Intervention | undefined> {
    const intervention = this.interventions.get(id);
    if (intervention) {
      intervention.currentStreak = streak;
      this.interventions.set(id, intervention);
      return intervention;
    }
    return undefined;
  }

  async getChatMessages(userId: number, limit: number = 50): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);
  }

  async createChatMessage(userId: number, insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      userId,
      timestamp: new Date()
    };
    this.chatMessages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
