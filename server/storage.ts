import {
  users, painLogs, moodLogs, interventions, chatMessages,
  type User, type InsertUser,
  type PainLog, type InsertPainLog,
  type MoodLog, type InsertMoodLog,
  type Intervention, type InsertIntervention,
  type ChatMessage, type InsertChatMessage,
  type InterventionLog, type InsertInterventionLog
} from "@shared/schema";
import admin from "firebase-admin";


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

  // Intervention log operations
  getInterventionLogs(userId: number, interventionId: number, limit?: number): Promise<InterventionLog[]>;
  createInterventionLog(userId: number, log: InsertInterventionLog): Promise<InterventionLog>;

  // Chat message operations
  getChatMessages(userId: number, limit?: number): Promise<ChatMessage[]>;
  createChatMessage(userId: number, message: InsertChatMessage): Promise<ChatMessage>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private painLogs: Map<number, PainLog>;
  private moodLogs: Map<number, MoodLog>;
  private interventions: Map<number, Intervention>;
  private interventionLogs: Map<number, InterventionLog>;
  private chatMessages: Map<number, ChatMessage>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.painLogs = new Map();
    this.moodLogs = new Map();
    this.interventions = new Map();
    this.interventionLogs = new Map();
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
      tags: insertPainLog.tags ?? [],
      notes: insertPainLog.notes ?? null,
      id,
      userId,
      date: new Date(),
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
      notes: insertMoodLog.notes ?? null,
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

  async getInterventionLogs(userId: number, interventionId: number, limit: number = 50): Promise<InterventionLog[]> {
    return Array.from(this.interventionLogs.values())
      .filter(log => log.userId === userId && log.interventionId === interventionId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async createInterventionLog(userId: number, insertLog: InsertInterventionLog): Promise<InterventionLog> {
    const id = this.currentId++;
    const log: InterventionLog = {
      ...insertLog,
      notes: insertLog.notes ?? null,
      id,
      userId,
      date: new Date(),
    };
    this.interventionLogs.set(id, log);

    // update streak for intervention
    const logs = await this.getInterventionLogs(userId, insertLog.interventionId, 1000);
    let streak = 0;
    const dates = new Set(logs.map(l => new Date(l.date).toDateString()));
    const day = new Date();
    while (dates.has(day.toDateString())) {
      streak += 1;
      day.setDate(day.getDate() - 1);
    }
    await this.updateInterventionStreak(insertLog.interventionId, streak);

    return log;
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

class FirestoreStorage implements IStorage {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
    this.db = admin.firestore();
  }

  private async nextId(name: string): Promise<number> {
    const ref = this.db.collection("meta").doc(name);
    let next = 1;
    await this.db.runTransaction(async (tx) => {
      const doc = await tx.get(ref);
      next = ((doc.data()?.value as number) || 0) + 1;
      tx.set(ref, { value: next });
    });
    return next;
  }

  private userRef(id: number) {
    return this.db.collection("users").doc(String(id));
  }

  async getUser(id: number): Promise<User | undefined> {
    const doc = await this.userRef(id).get();
    return doc.exists ? (doc.data() as User) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const snap = await this.db.collection("users").where("email", "==", email).limit(1).get();
    if (snap.empty) return undefined;
    return snap.docs[0].data() as User;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const snap = await this.db.collection("users").where("firebaseUid", "==", firebaseUid).limit(1).get();
    if (snap.empty) return undefined;
    return snap.docs[0].data() as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = await this.nextId("users");
    const newUser: User = { ...user, id, createdAt: new Date() };
    await this.userRef(id).set(newUser);
    return newUser;
  }

  async getPainLogs(userId: number, limit: number = 50): Promise<PainLog[]> {
    const snap = await this.userRef(userId)
      .collection("painLogs")
      .orderBy("date", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((d) => d.data() as PainLog);
  }

  async createPainLog(userId: number, painLog: InsertPainLog): Promise<PainLog> {
    const id = await this.nextId("painLogs");
    const log: PainLog = {
      ...painLog,
      tags: painLog.tags ?? [],
      notes: painLog.notes ?? null,
      id,
      userId,
      date: new Date(),
    };
    await this.userRef(userId).collection("painLogs").doc(String(id)).set(log);
    return log;
  }

  async getMoodLogs(userId: number, limit: number = 50): Promise<MoodLog[]> {
    const snap = await this.userRef(userId)
      .collection("moodLogs")
      .orderBy("date", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((d) => d.data() as MoodLog);
  }

  async createMoodLog(userId: number, moodLog: InsertMoodLog): Promise<MoodLog> {
    const id = await this.nextId("moodLogs");
    const log: MoodLog = {
      ...moodLog,
      notes: moodLog.notes ?? null,
      id,
      userId,
      date: new Date(),
    };
    await this.userRef(userId).collection("moodLogs").doc(String(id)).set(log);
    return log;
  }

  async getInterventions(userId: number): Promise<Intervention[]> {
    const snap = await this.userRef(userId).collection("interventions").where("isActive", "==", true).orderBy("createdAt", "desc").get();
    return snap.docs.map((d) => d.data() as Intervention);
  }

  async createIntervention(userId: number, intervention: InsertIntervention): Promise<Intervention> {
    const id = await this.nextId("interventions");
    const data: Intervention = {
      ...intervention,
      id,
      userId,
      currentStreak: 0,
      isActive: true,
      createdAt: new Date(),
    };
    await this.userRef(userId).collection("interventions").doc(String(id)).set(data);
    return data;
  }

  async updateInterventionStreak(id: number, streak: number): Promise<Intervention | undefined> {
    const snap = await this.db.collectionGroup("interventions").where("id", "==", id).limit(1).get();
    if (snap.empty) return undefined;
    const doc = snap.docs[0];
    await doc.ref.update({ currentStreak: streak });
    return { ...(doc.data() as Intervention), currentStreak: streak };
  }

  async getInterventionLogs(userId: number, interventionId: number, limit: number = 50): Promise<InterventionLog[]> {
    const snap = await this.userRef(userId)
      .collection("interventionLogs")
      .where("interventionId", "==", interventionId)
      .orderBy("date", "desc")
      .limit(limit)
      .get();
    return snap.docs.map((d) => d.data() as InterventionLog);
  }

  async createInterventionLog(userId: number, logData: InsertInterventionLog): Promise<InterventionLog> {
    const id = await this.nextId("interventionLogs");
    const log: InterventionLog = {
      ...logData,
      notes: logData.notes ?? null,
      id,
      userId,
      date: new Date(),
    };
    await this.userRef(userId).collection("interventionLogs").doc(String(id)).set(log);

    // update streak
    const logs = await this.getInterventionLogs(userId, logData.interventionId, 1000);
    let streak = 0;
    const dates = new Set(logs.map((l) => new Date(l.date).toDateString()));
    const day = new Date();
    while (dates.has(day.toDateString())) {
      streak += 1;
      day.setDate(day.getDate() - 1);
    }
    await this.updateInterventionStreak(logData.interventionId, streak);

    return log;
  }

  async getChatMessages(userId: number, limit: number = 50): Promise<ChatMessage[]> {
    const snap = await this.userRef(userId)
      .collection("chatMessages")
      .orderBy("timestamp")
      .limitToLast(limit)
      .get();
    return snap.docs.map((d) => d.data() as ChatMessage);
  }

  async createChatMessage(userId: number, message: InsertChatMessage): Promise<ChatMessage> {
    const id = await this.nextId("chatMessages");
    const data: ChatMessage = { ...message, id, userId, timestamp: new Date() };
    await this.userRef(userId).collection("chatMessages").doc(String(id)).set(data);
    return data;
  }
}

export const storage: IStorage = process.env.FIREBASE_PROJECT_ID
  ? new FirestoreStorage()
  : new MemStorage();
