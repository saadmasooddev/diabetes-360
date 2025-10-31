import { db } from "../../../app/config/db";
import { freeTierLimits } from "../models/settings.schema";
import type { InsertFreeTierLimits, UpdateFreeTierLimits, FreeTierLimits } from "../models/settings.schema";

export class SettingsRepository {
  async getFreeTierLimits(): Promise<FreeTierLimits | null> {
    const [limits] = await db
      .select()
      .from(freeTierLimits)
      .limit(1);
    
    return limits || null;
  }


  async createFreeTierLimits(data: InsertFreeTierLimits): Promise<FreeTierLimits> {
    const [limits] = await db
      .insert(freeTierLimits)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();
    
    return limits;
  }

  async updateFreeTierLimits(data: UpdateFreeTierLimits): Promise<FreeTierLimits> {
    const [limits] = await db
      .update(freeTierLimits)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .returning();
    
    if (!limits) {
      throw new Error("Free tier limits not found");
    }
    
    return limits;
  }

  async upsertFreeTierLimits(data: InsertFreeTierLimits): Promise<FreeTierLimits> {
    const existing = await this.getFreeTierLimits();
    
    if (existing) {
      return await this.updateFreeTierLimits(data);
    } else {
      return await this.createFreeTierLimits(data);
    }
  }
}

