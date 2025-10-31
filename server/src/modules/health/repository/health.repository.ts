import { db } from "../../../app/config/db";
import { healthMetrics } from "../models/health.schema";
import { eq, desc, and, gte, sql, isNotNull } from "drizzle-orm";
import type { InsertHealthMetric, HealthMetric } from "../models/health.schema";

export class HealthRepository {
  async getTodaysMetricCount(userId: string, metricType?: 'glucose' | 'steps' | 'water'): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    let conditions: any[] = [
      eq(healthMetrics.userId, userId),
      gte(healthMetrics.recordedAt, startOfDay)
    ];

    // If metricType is specified, filter by that specific metric
    if (metricType === 'glucose') {
      conditions.push(isNotNull(healthMetrics.bloodSugar));
    } else if (metricType === 'steps') {
      conditions.push(isNotNull(healthMetrics.steps));
    } else if (metricType === 'water') {
      conditions.push(isNotNull(healthMetrics.waterIntake));
    }
    
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(healthMetrics)
      .where(and(...conditions));
    
    return result[0]?.count || 0;
  }

  async createMetric(data: InsertHealthMetric): Promise<HealthMetric> {
    const [metric] = await db.insert(healthMetrics).values({
      userId: data.userId,
      bloodSugar: data.bloodSugar || null,
      steps: data.steps || null,
      waterIntake: data.waterIntake || null,
    }).returning();
    return metric;
  }

  async getLatestMetric(userId: string): Promise<HealthMetric | null> {
    const [metric] = await db
      .select()
      .from(healthMetrics)
      .where(eq(healthMetrics.userId, userId))
      .orderBy(desc(healthMetrics.recordedAt))
      .limit(1);
    return metric || null;
  }

  async getMetricsByUser(
    userId: string,
    limit: number = 30,
    offset: number = 0
  ): Promise<HealthMetric[]> {
    return await db
      .select()
      .from(healthMetrics)
      .where(eq(healthMetrics.userId, userId))
      .orderBy(desc(healthMetrics.recordedAt))
      .limit(limit)
      .offset(offset);
  }

  async getMetricsForChart(
    userId: string,
    days: number = 7
  ): Promise<HealthMetric[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    return await db
      .select()
      .from(healthMetrics)
      .where(
        and(
          eq(healthMetrics.userId, userId),
          gte(healthMetrics.recordedAt, startDate)
        )
      )
      .orderBy(healthMetrics.recordedAt);
  }
}

