import { db } from "../../../app/config/db";
import { healthMetrics, activityLogs, exerciseLogs, healthMetricTargets } from "../models/health.schema";
import { eq, desc, and, gte, lte, sql, isNotNull, isNull } from "drizzle-orm";
import type { InsertHealthMetric, HealthMetric, MertricRecord, InsertActivityLog, ActivityLog, InsertExerciseLog, ExerciseLog, InsertHealthMetricTarget, UpdateHealthMetricTarget, HealthMetricTarget } from "../models/health.schema";

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
      bloodSugar: data.bloodSugar,
      steps: data.steps,
      waterIntake: data.waterIntake,
      heartRate: data.heartRate,
      recordedAt: data.recordedAt
    }).returning();
    return metric;
  }

  async getLatestMetric(userId: string): Promise<{ current: Partial<HealthMetric>; previous: Partial<HealthMetric> }> {
    const latestBloogSugarPromise = db
      .select()
      .from(healthMetrics)
      .where(and(eq(healthMetrics.userId, userId), isNotNull(healthMetrics.bloodSugar)))
      .orderBy(desc(healthMetrics.recordedAt))
      .limit(2);
    const latestWaterIntakePromise = db
      .select()
      .from(healthMetrics)
      .where(and(eq(healthMetrics.userId, userId), isNotNull(healthMetrics.waterIntake)))
      .orderBy(desc(healthMetrics.recordedAt))
      .limit(2);
    const latestStepsPromise = db
      .select()
      .from(healthMetrics)
      .where(and(eq(healthMetrics.userId, userId), isNotNull(healthMetrics.steps)))
      .orderBy(desc(healthMetrics.recordedAt))
      .limit(2);
    const latestHeartRatePromise = db
      .select()
      .from(healthMetrics)
      .where(and(eq(healthMetrics.userId, userId), isNotNull(healthMetrics.heartRate)))
      .orderBy(desc(healthMetrics.recordedAt))
      .limit(2);
    
    const [latestBloogSugar, latestWaterIntake, latestSteps, latestHeartRate] = await Promise.all([latestBloogSugarPromise, latestWaterIntakePromise, latestStepsPromise, latestHeartRatePromise]);
    return {
      current: {
        bloodSugar: latestBloogSugar[0]?.bloodSugar || null,
        waterIntake: latestWaterIntake[0]?.waterIntake || null,
        steps: latestSteps[0]?.steps || null,
        heartRate: latestHeartRate[0]?.heartRate || null,
      },
      previous: {
        bloodSugar: latestBloogSugar[1]?.bloodSugar || null,
        waterIntake: latestWaterIntake[1]?.waterIntake || null,
        steps: latestSteps[1]?.steps || null,
        heartRate: latestHeartRate[1]?.heartRate || null,
      }
    } 
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
    heartRate: { daily: number; weekly: number; monthly: number };
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
    
    const dailyHeartRate = await db
      .select({
        avg: sql<number>`COALESCE(AVG(${healthMetrics.heartRate}::DECIMAL), 0)`,
      })
      .from(healthMetrics)
      .where(
        and(
          eq(healthMetrics.userId, userId),
          gte(healthMetrics.recordedAt, startOfDay),
          isNotNull(healthMetrics.heartRate)
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

    const weeklyHeartRate = await db
      .select({
        avg: sql<number>`COALESCE(AVG(${healthMetrics.heartRate}::DECIMAL), 0)`,
      })
      .from(healthMetrics)
      .where(and(eq(healthMetrics.userId, userId), gte(healthMetrics.recordedAt, startOfWeek), isNotNull(healthMetrics.heartRate)));

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

    const monthlyHeartRate = await db
      .select({
        avg: sql<number>`COALESCE(AVG(${healthMetrics.heartRate}::DECIMAL), 0)`,
      })
      .from(healthMetrics)
      .where(and(eq(healthMetrics.userId, userId), gte(healthMetrics.recordedAt, startOfMonth), isNotNull(healthMetrics.heartRate)));

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
      heartRate: {
        daily: Math.round(Number(dailyHeartRate[0]?.avg || 0)),
        weekly: Math.round(Number(weeklyHeartRate[0]?.avg || 0)),
        monthly: Math.round(Number(monthlyHeartRate[0]?.avg || 0)),
      },
    };
  }

  async getFilteredMetrics(
    userId: string,
    startDate: Date,
    endDate: Date,
    types: string[]
  ): Promise<{
    bloodSugarRecords: MertricRecord[];
    waterIntakeRecords: MertricRecord[];
    stepsRecords: MertricRecord[];
    heartBeatRecords: MertricRecord[];
  }> {

    const baseConditions = [
      eq(healthMetrics.userId, userId),
      sql`${healthMetrics.recordedAt} between ${startDate} and ${endDate}`,
    ];

    const result = {
      bloodSugarRecords: [] as MertricRecord[],
      waterIntakeRecords: [] as MertricRecord[],
      stepsRecords: [] as MertricRecord[],
      heartBeatRecords: [] as MertricRecord[] 
    };

    // If no types specified, return all types
    const requestedTypes = types.length > 0 ? types : ['blood_sugar', 'water_intake', 'steps', 'heart_beat'];

    // Fetch blood sugar records
    if (requestedTypes.includes('blood_sugar')) {
      result.bloodSugarRecords = await db
        .select({
          id: healthMetrics.id,
          userId: healthMetrics.userId,
          value: healthMetrics.bloodSugar,
          recordedAt: healthMetrics.recordedAt,
        })
        .from(healthMetrics)
        .where(
          and(
            ...baseConditions,
            isNotNull(healthMetrics.bloodSugar)
          )
        )
        .orderBy(desc(healthMetrics.recordedAt)) as MertricRecord[]
    }

    // Fetch water intake records
    if (requestedTypes.includes('water_intake')) {
      result.waterIntakeRecords = await db
        .select({
          id: healthMetrics.id,
          userId: healthMetrics.userId,
          value: healthMetrics.waterIntake,
          recordedAt: healthMetrics.recordedAt,
        })
        .from(healthMetrics)
        .where(
          and(
            ...baseConditions,
            isNotNull(healthMetrics.waterIntake)
          )
        )
        .orderBy(desc(healthMetrics.recordedAt)) as MertricRecord[]
    }

    // Fetch steps records
    if (requestedTypes.includes('steps')) {
      result.stepsRecords = await db
        .select({
          id: healthMetrics.id,
          userId: healthMetrics.userId,
          value: healthMetrics.steps,
          recordedAt: healthMetrics.recordedAt,
        })
        .from(healthMetrics)
        .where(
          and(
            ...baseConditions,
            isNotNull(healthMetrics.steps)
          )
        )
        .orderBy(desc(healthMetrics.recordedAt)) as MertricRecord[]
    }

    // Fetch heart rate records
    if (requestedTypes.includes('heart_beat')) {
      result.heartBeatRecords = await db
        .select({
          id: healthMetrics.id,
          userId: healthMetrics.userId,
          value: healthMetrics.heartRate,
          recordedAt: healthMetrics.recordedAt,
        })
        .from(healthMetrics)
        .where(
          and(
            ...baseConditions,
            isNotNull(healthMetrics.heartRate)
          )
        )
        .orderBy(desc(healthMetrics.recordedAt)) as MertricRecord[]
    }

    return result 
  }

  // Activity Logs Methods
  async createActivityLog(data: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs).values({
      userId: data.userId,
      activityType: data.activityType,
      durationMinutes: data.durationMinutes,
      recordedAt: data.recordedAt
    }).returning();
    return log;
  }

  async getActivityLogsByUser(
    userId: string,
    activityType?: "walking" | "yoga",
    limit: number = 30,
    offset: number = 0
  ): Promise<ActivityLog[]> {
    const conditions: any[] = [eq(activityLogs.userId, userId)];
    if (activityType) {
      conditions.push(eq(activityLogs.activityType, activityType));
    }
    
    return await db
      .select()
      .from(activityLogs)
      .where(and(...conditions))
      .orderBy(desc(activityLogs.recordedAt))
      .limit(limit)
      .offset(offset);
  }

  async getTodayActivityLogs(userId: string, activityType?: "walking" | "yoga"): Promise<ActivityLog[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const conditions: any[] = [
      eq(activityLogs.userId, userId),
      gte(activityLogs.recordedAt, startOfDay)
    ];
    
    if (activityType) {
      conditions.push(eq(activityLogs.activityType, activityType));
    }
    
    return await db
      .select()
      .from(activityLogs)
      .where(and(...conditions))
      .orderBy(desc(activityLogs.recordedAt));
  }

  async getActivityLogsForChart(
    userId: string,
    activityType: "walking" | "yoga",
    days: number = 7
  ): Promise<ActivityLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    return await db
      .select()
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.userId, userId),
          eq(activityLogs.activityType, activityType),
          gte(activityLogs.recordedAt, startDate)
        )
      )
      .orderBy(activityLogs.recordedAt);
  }

  async getTotalActivityMinutesToday(userId: string, activityType?: "walking" | "yoga"): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const conditions: any[] = [
      eq(activityLogs.userId, userId),
      gte(activityLogs.recordedAt, startOfDay)
    ];
    
    if (activityType) {
      conditions.push(eq(activityLogs.activityType, activityType));
    }
    
    const result = await db
      .select({
        total: sql<number>`COALESCE(SUM(${activityLogs.durationMinutes}), 0)::int`,
      })
      .from(activityLogs)
      .where(and(...conditions));
    
    return result[0]?.total || 0;
  }

  async createExerciseLogsBatch(data: InsertExerciseLog[]): Promise<ExerciseLog[]> {
    if (data.length === 0) return [];
    
    const logs = await db.insert(exerciseLogs).values(
      data.map(d => ({
        userId: d.userId,
        exerciseType: d.exerciseType,
        count: d.count,
        recordedAt: d.recordedAt
      }))
    ).returning();
    return logs;
  }

  async getExerciseLogsByUser(
    userId: string,
    exerciseType?: "pushups" | "squats" | "chinups" | "situps",
    limit: number = 30,
    offset: number = 0
  ): Promise<ExerciseLog[]> {
    const conditions: any[] = [eq(exerciseLogs.userId, userId)];
    if (exerciseType) {
      conditions.push(eq(exerciseLogs.exerciseType, exerciseType));
    }
    
    return await db
      .select()
      .from(exerciseLogs)
      .where(and(...conditions))
      .orderBy(desc(exerciseLogs.recordedAt))
      .limit(limit)
      .offset(offset);
  }

  async getTodayExerciseLogs(userId: string): Promise<ExerciseLog[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    return await db
      .select()
      .from(exerciseLogs)
      .where(
        and(
          eq(exerciseLogs.userId, userId),
          gte(exerciseLogs.recordedAt, startOfDay)
        )
      )
      .orderBy(desc(exerciseLogs.recordedAt));
  }

  async getTodayExerciseTotals(userId: string): Promise<{
    pushups: number;
    squats: number;
    chinups: number;
    situps: number;
  }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const logs = await db
      .select()
      .from(exerciseLogs)
      .where(
        and(
          eq(exerciseLogs.userId, userId),
          gte(exerciseLogs.recordedAt, startOfDay)
        )
      );
    
    const totals = {
      pushups: 0,
      squats: 0,
      chinups: 0,
      situps: 0,
    };
    
    logs.forEach(log => {
      if (log.exerciseType === "pushups") totals.pushups += log.count;
      else if (log.exerciseType === "squats") totals.squats += log.count;
      else if (log.exerciseType === "chinups") totals.chinups += log.count;
      else if (log.exerciseType === "situps") totals.situps += log.count;
    });
    
    return totals;
  }

  async getExerciseLogsForChart(
    userId: string,
    exerciseType: "pushups" | "squats" | "chinups" | "situps",
    days: number = 7
  ): Promise<ExerciseLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    return await db
      .select()
      .from(exerciseLogs)
      .where(
        and(
          eq(exerciseLogs.userId, userId),
          eq(exerciseLogs.exerciseType, exerciseType),
          gte(exerciseLogs.recordedAt, startDate)
        )
      )
      .orderBy(exerciseLogs.recordedAt);
  }

  async getStrengthProgressPercentage(userId: string, days: number = 30): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    // Get average total exercises per day over the period
    const logs = await db
      .select()
      .from(exerciseLogs)
      .where(
        and(
          eq(exerciseLogs.userId, userId),
          gte(exerciseLogs.recordedAt, startDate)
        )
      );
    
    if (logs.length === 0) return 0;
    
    // Group by day and calculate daily totals
    const dailyTotals: { [key: string]: number } = {};
    logs.forEach(log => {
      const day = log.recordedAt.toISOString().split('T')[0];
      if (!dailyTotals[day]) dailyTotals[day] = 0;
      dailyTotals[day] += log.count;
    });
    
    const avgDailyTotal = Object.values(dailyTotals).reduce((a, b) => a + b, 0) / Object.keys(dailyTotals).length;
    
    // Calculate percentage based on a target (e.g., 100 exercises per day = 100%)
    const target = 100;
    const percentage = Math.min(100, Math.round((avgDailyTotal / target) * 100));
    
    return percentage;
  }

  // Health Metric Targets Methods
  async getRecommendedTargets(): Promise<HealthMetricTarget[]> {
    return await db
      .select()
      .from(healthMetricTargets)
      .where(isNull(healthMetricTargets.userId));
  }

  async getUserTargets(userId: string): Promise<HealthMetricTarget[]> {
    return await db
      .select()
      .from(healthMetricTargets)
      .where(eq(healthMetricTargets.userId, userId));
  }

  async getTargetsForUser(userId: string): Promise<{
    recommended: HealthMetricTarget[];
    user: HealthMetricTarget[];
  }> {
    const [recommended, user] = await Promise.all([
      this.getRecommendedTargets(),
      this.getUserTargets(userId),
    ]);
    return { recommended, user };
  }

  async getTargetByMetricType(
    userId: string | null,
    metricType: "glucose" | "steps" | "water_intake" | "heart_rate"
  ): Promise<HealthMetricTarget | null> {
    const conditions: any[] = [eq(healthMetricTargets.metricType, metricType)];
    
    if (userId === null) {
      conditions.push(isNull(healthMetricTargets.userId));
    } else {
      conditions.push(eq(healthMetricTargets.userId, userId));
    }

    const [target] = await db
      .select()
      .from(healthMetricTargets)
      .where(and(...conditions))
      .limit(1);

    return target || null;
  }

  async upsertTarget(data: InsertHealthMetricTarget): Promise<HealthMetricTarget> {
    const existing = await this.getTargetByMetricType(data.userId || null, data.metricType);

    if (existing) {
      const [updated] = await db
        .update(healthMetricTargets)
        .set({
          targetValue: data.targetValue.toString(),
          updatedAt: new Date(),
        })
        .where(eq(healthMetricTargets.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(healthMetricTargets)
        .values({
          userId: data.userId || null,
          metricType: data.metricType,
          targetValue: data.targetValue.toString(),
        })
        .returning();
      return created;
    }
  }

  async deleteUserTarget(userId: string, metricType: "glucose" | "steps" | "water_intake" | "heart_rate"): Promise<void> {
    await db
      .delete(healthMetricTargets)
      .where(
        and(
          eq(healthMetricTargets.userId, userId),
          eq(healthMetricTargets.metricType, metricType)
        )
      );
  }

  async upsertTargetsBatch(targets: InsertHealthMetricTarget[]): Promise<HealthMetricTarget[]> {
    const results: HealthMetricTarget[] = [];
    
    for (const target of targets) {
      const result = await this.upsertTarget(target);
      results.push(result);
    }
    
    return results;
  }
}

