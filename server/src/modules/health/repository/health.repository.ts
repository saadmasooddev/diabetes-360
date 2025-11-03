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

  async getAggregatedStatistics(userId: string): Promise<{
    glucose: { daily: number; weekly: number; monthly: number };
    water: { daily: number; weekly: number; monthly: number };
    steps: { daily: number; weekly: number; monthly: number };
  }> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);
    startOfMonth.setHours(0, 0, 0, 0);

    // Daily averages
    const dailyGlucose = await db
      .select({
        avg: sql<number>`COALESCE(AVG(CAST(${healthMetrics.bloodSugar} AS DECIMAL)), 0)`,
      })
      .from(healthMetrics)
      .where(
        and(
          eq(healthMetrics.userId, userId),
          gte(healthMetrics.recordedAt, startOfDay),
          isNotNull(healthMetrics.bloodSugar)
        )
      );

    const dailyWater = await db
      .select({
        avg: sql<number>`COALESCE(AVG(CAST(${healthMetrics.waterIntake} AS DECIMAL)), 0)`,
      })
      .from(healthMetrics)
      .where(
        and(
          eq(healthMetrics.userId, userId),
          gte(healthMetrics.recordedAt, startOfDay),
          isNotNull(healthMetrics.waterIntake)
        )
      );

    const dailySteps = await db
      .select({
        avg: sql<number>`COALESCE(AVG(${healthMetrics.steps}::DECIMAL), 0)`,
      })
      .from(healthMetrics)
      .where(
        and(
          eq(healthMetrics.userId, userId),
          gte(healthMetrics.recordedAt, startOfDay),
          isNotNull(healthMetrics.steps)
        )
      );

    // Weekly averages
    const weeklyGlucose = await db
      .select({
        avg: sql<number>`COALESCE(AVG(CAST(${healthMetrics.bloodSugar} AS DECIMAL)), 0)`,
      })
      .from(healthMetrics)
      .where(
        and(
          eq(healthMetrics.userId, userId),
          gte(healthMetrics.recordedAt, startOfWeek),
          isNotNull(healthMetrics.bloodSugar)
        )
      );

    const weeklyWater = await db
      .select({
        avg: sql<number>`COALESCE(AVG(CAST(${healthMetrics.waterIntake} AS DECIMAL)), 0)`,
      })
      .from(healthMetrics)
      .where(
        and(
          eq(healthMetrics.userId, userId),
          gte(healthMetrics.recordedAt, startOfWeek),
          isNotNull(healthMetrics.waterIntake)
        )
      );

    const weeklySteps = await db
      .select({
        avg: sql<number>`COALESCE(AVG(${healthMetrics.steps}::DECIMAL), 0)`,
      })
      .from(healthMetrics)
      .where(
        and(
          eq(healthMetrics.userId, userId),
          gte(healthMetrics.recordedAt, startOfWeek),
          isNotNull(healthMetrics.steps)
        )
      );

    // Monthly averages
    const monthlyGlucose = await db
      .select({
        avg: sql<number>`COALESCE(AVG(CAST(${healthMetrics.bloodSugar} AS DECIMAL)), 0)`,
      })
      .from(healthMetrics)
      .where(
        and(
          eq(healthMetrics.userId, userId),
          gte(healthMetrics.recordedAt, startOfMonth),
          isNotNull(healthMetrics.bloodSugar)
        )
      );

    const monthlyWater = await db
      .select({
        avg: sql<number>`COALESCE(AVG(CAST(${healthMetrics.waterIntake} AS DECIMAL)), 0)`,
      })
      .from(healthMetrics)
      .where(
        and(
          eq(healthMetrics.userId, userId),
          gte(healthMetrics.recordedAt, startOfMonth),
          isNotNull(healthMetrics.waterIntake)
        )
      );

    const monthlySteps = await db
      .select({
        avg: sql<number>`COALESCE(AVG(${healthMetrics.steps}::DECIMAL), 0)`,
      })
      .from(healthMetrics)
      .where(
        and(
          eq(healthMetrics.userId, userId),
          gte(healthMetrics.recordedAt, startOfMonth),
          isNotNull(healthMetrics.steps)
        )
      );

    return {
      glucose: {
        daily: Math.round(Number(dailyGlucose[0]?.avg || 0)),
        weekly: Math.round(Number(weeklyGlucose[0]?.avg || 0)),
        monthly: Math.round(Number(monthlyGlucose[0]?.avg || 0)),
      },
      water: {
        daily: Number(dailyWater[0]?.avg || 0),
        weekly: Number(weeklyWater[0]?.avg || 0),
        monthly: Number(monthlyWater[0]?.avg || 0),
      },
      steps: {
        daily: Math.round(Number(dailySteps[0]?.avg || 0)),
        weekly: Math.round(Number(weeklySteps[0]?.avg || 0)),
        monthly: Math.round(Number(monthlySteps[0]?.avg || 0)),
      },
    };
  }
}

