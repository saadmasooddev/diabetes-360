import { type User, type InsertUser, type HealthMetric, type InsertHealthMetric } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getLatestHealthMetric(userId: string): Promise<HealthMetric | undefined>;
  getHealthMetrics(userId: string, limit: number): Promise<HealthMetric[]>;
  addHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private healthMetrics: Map<string, HealthMetric>;

  constructor() {
    this.users = new Map();
    this.healthMetrics = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      fullName: insertUser.fullName || null,
    };
    this.users.set(id, user);
    return user;
  }

  async getLatestHealthMetric(userId: string): Promise<HealthMetric | undefined> {
    const userMetrics = Array.from(this.healthMetrics.values())
      .filter(metric => metric.userId === userId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
    
    return userMetrics[0];
  }

  async getHealthMetrics(userId: string, limit: number = 10): Promise<HealthMetric[]> {
    return Array.from(this.healthMetrics.values())
      .filter(metric => metric.userId === userId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
      .slice(0, limit);
  }

  async addHealthMetric(insertMetric: InsertHealthMetric): Promise<HealthMetric> {
    const id = randomUUID();
    const metric: HealthMetric = {
      id,
      userId: insertMetric.userId,
      bloodSugar: insertMetric.bloodSugar ?? null,
      bloodPressureSystolic: insertMetric.bloodPressureSystolic ?? null,
      bloodPressureDiastolic: insertMetric.bloodPressureDiastolic ?? null,
      heartRate: insertMetric.heartRate ?? null,
      weight: insertMetric.weight ?? null,
      steps: insertMetric.steps ?? null,
      recordedAt: new Date(),
    };
    this.healthMetrics.set(id, metric);
    return metric;
  }
}

export const storage = new MemStorage();
