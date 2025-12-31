import { db } from "../../../app/config/db";
import { healthMetrics,  exerciseLogs, healthMetricTargets, healthInsights, metricTypes, EXERCISE_TYPE_ENUM, ACTIVITY_TYPE_ENUM } from "../models/health.schema";
import { eq, desc, and, gte, lte, sql, isNotNull, isNull, getTableColumns, asc } from "drizzle-orm";
import type { InsertHealthMetric, HealthMetric, MertricRecord, InsertExerciseLog, ExerciseLog, InsertHealthMetricTarget, HealthMetricTarget, HealthInsight, ExtendedHealthMetric, MetricType, ActivityType } from "../models/health.schema";
import { PgTable } from "drizzle-orm/pg-core";
import { formatDate } from "server/src/shared/utils/utils";

export type ChartData = {
 value: number, recordedAt: Date
}

export type HealthPagination = {
  total: number; limit: number; offset: number
}
export interface HealthInsightsData {
  insights: Array<HealthInsights>;
  overallHealthSummary: string;
  whatToDoNext: Array<HealthTips>;
}
export interface HealthInsights { 
name: MetricType; insight: string
}

export interface HealthTips {
name: string; tip: string
}

export class HealthRepository {
  async getTodaysMetricCount(userId: string, metricType?: MetricType): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    let table :PgTable = healthMetrics
    
    let conditions: any[] = [
      eq(healthMetrics.userId, userId),
      gte(healthMetrics.recordedAt, startOfDay)
    ];

    // If metricType is specified, filter by that specific metric
    if (metricType === EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE) {
      conditions.push(isNotNull(healthMetrics.bloodSugar));
    }else if(metricType === EXERCISE_TYPE_ENUM.STEPS) {
      table = exerciseLogs
      conditions = [
        eq(exerciseLogs.userId, userId),
        gte(exerciseLogs.recordedAt, startOfDay),
        isNotNull(exerciseLogs.steps)
      ]
    } else if (metricType === EXERCISE_TYPE_ENUM.WATER_INTAKE) {
      conditions.push(isNotNull(healthMetrics.waterIntake));
    }
    
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(table)
      .where(and(...conditions));
    
    return result[0]?.count || 0;
  }

  async createMetric(data: InsertHealthMetric): Promise<HealthMetric> {
    const [metric] = await db.insert(healthMetrics).values({
      userId: data.userId,
      bloodSugar: data.bloodSugar?.toString() || null,
      waterIntake: data.waterIntake?.toString() || null,
      heartRate: data.heartRate || null,
      recordedAt: data.recordedAt || new Date()
    }).returning();
    return metric;
  }

  async getTodaysMetricTotal(userId: string, metricType: 'steps' | 'water'): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    // Steps are stored in exercise_logs
    if (metricType === 'steps') {
      const result = await db
        .select({ 
          total: sql<number>`COALESCE(SUM(CAST(${exerciseLogs.steps} AS DECIMAL)), 0)` 
        })
        .from(exerciseLogs)
        .where(
          and(
            eq(exerciseLogs.userId, userId),
            gte(exerciseLogs.recordedAt, startOfDay),
            isNotNull(exerciseLogs.steps)
          )
        );
      return parseFloat(result[0]?.total?.toString() || '0');
    }
    
    // Water intake is in health_metrics
    const result = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${healthMetrics.waterIntake})::numeric, 0)` 
      })
      .from(healthMetrics)
      .where(
        and(
          eq(healthMetrics.userId, userId),
          gte(healthMetrics.recordedAt, startOfDay),
          isNotNull(healthMetrics.waterIntake)
        )
      );
    
    return parseFloat(result[0]?.total?.toString() || '0');
  }

  async getLatestMetric(userId: string): Promise<{ current: Partial<ExtendedHealthMetric>; previous: Partial<ExtendedHealthMetric> }> {
    const latestBloogSugarPromise = db
      .select()
      .from(healthMetrics)
      .where(and(eq(healthMetrics.userId, userId), isNotNull(healthMetrics.bloodSugar)))
      .orderBy(desc(healthMetrics.recordedAt))
      .limit(2);
    
    // Get today's totals for steps and water instead of latest values
    const todaysStepsTotalPromise = this.getTodaysMetricTotal(userId, 'steps');
    const todaysWaterTotalPromise = this.getTodaysMetricTotal(userId, 'water');
    
    // Get previous day totals for comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);
    
    // Steps are in exercise_logs
    const previousStepsPromise = db
      .select({ total: sql<number>`COALESCE(SUM(CAST(${exerciseLogs.steps} AS DECIMAL)), 0)` })
      .from(exerciseLogs)
      .where(
        and(
          eq(exerciseLogs.userId, userId),
          gte(exerciseLogs.recordedAt, yesterday),
          lte(exerciseLogs.recordedAt, endOfYesterday),
          isNotNull(exerciseLogs.steps)
        )
      );
    
    const previousWaterPromise = db
      .select({ total: sql<number>`COALESCE(SUM(${healthMetrics.waterIntake})::numeric, 0)` })
      .from(healthMetrics)
      .where(
        and(
          eq(healthMetrics.userId, userId),
          gte(healthMetrics.recordedAt, yesterday),
          lte(healthMetrics.recordedAt, endOfYesterday),
          isNotNull(healthMetrics.waterIntake)
        )
      );
    
    const latestHeartRatePromise = db
      .select()
      .from(healthMetrics)
      .where(and(eq(healthMetrics.userId, userId), isNotNull(healthMetrics.heartRate)))
      .orderBy(desc(healthMetrics.recordedAt))
      .limit(2);
    
    const [latestBloogSugar, todaysStepsTotal, todaysWaterTotal, previousSteps, previousWater, latestHeartRate] = await Promise.all([
      latestBloogSugarPromise,
      todaysStepsTotalPromise,
      todaysWaterTotalPromise,
      previousStepsPromise,
      previousWaterPromise,
      latestHeartRatePromise
    ]);
    
    const previousStepsTotal = parseFloat(previousSteps[0]?.total?.toString() || '0');
    const previousWaterTotal = parseFloat(previousWater[0]?.total?.toString() || '0');
    
    return {
      current: {
        bloodSugar: latestBloogSugar[0]?.bloodSugar || null,
        waterIntake: todaysWaterTotal.toString(),
        heartRate: latestHeartRate[0]?.heartRate || null,
        steps: Math.round(todaysStepsTotal),
      },
      previous: {
        bloodSugar: latestBloogSugar[1]?.bloodSugar || null,
        waterIntake: previousWaterTotal.toString(),
        heartRate: latestHeartRate[1]?.heartRate || null,
        steps: Math.round(previousStepsTotal),
      } 
    } 
  }


  async getAggregatedStatistics(userId: string, total: boolean): Promise<{
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

    // Steps are in exercise_logs
    const dailySteps = await db
      .select({
        avg: sql<number>`COALESCE(AVG(CAST(${exerciseLogs.steps} AS DECIMAL)), 0)`,
      })
      .from(exerciseLogs)
      .where(
        and(
          eq(exerciseLogs.userId, userId),
          gte(exerciseLogs.recordedAt, startOfDay),
          isNotNull(exerciseLogs.steps)
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

    // Steps are in exercise_logs
    const weeklySteps = await db
      .select({
        avg: sql<number>`COALESCE(AVG(CAST(${exerciseLogs.steps} AS DECIMAL)), 0)`,
      })
      .from(exerciseLogs)
      .where(
        and(
          eq(exerciseLogs.userId, userId),
          gte(exerciseLogs.recordedAt, startOfWeek),
          isNotNull(exerciseLogs.steps)
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

    // Steps are in exercise_logs
    const monthlySteps = await db
      .select({
        avg: sql<number>`COALESCE(AVG(CAST(${exerciseLogs.steps} AS DECIMAL)), 0)`,
      })
      .from(exerciseLogs)
      .where(
        and(
          eq(exerciseLogs.userId, userId),
          gte(exerciseLogs.recordedAt, startOfMonth),
          isNotNull(exerciseLogs.steps)
        )
      );
    

    const monthlyHeartRate = await db
      .select({
        avg: sql<number>`COALESCE(AVG(${healthMetrics.heartRate}::DECIMAL), 0)`,
      })
      .from(healthMetrics)
      .where(and(eq(healthMetrics.userId, userId), gte(healthMetrics.recordedAt, startOfMonth), isNotNull(healthMetrics.heartRate)));

    
    

    const result = {
      glucose: {
        daily: Math.round(Number(dailyGlucose[0]?.avg || 0)),
        weekly: Math.round(Number(weeklyGlucose[0]?.avg || 0)),
        monthly: Math.round(Number(monthlyGlucose[0]?.avg || 0)),
        total: 0,
      },
      water: {
        daily: Number(dailyWater[0]?.avg || 0),
        weekly: Number(weeklyWater[0]?.avg || 0),
        monthly: Number(monthlyWater[0]?.avg || 0),
        total: 0,
      },
      steps: {
        daily: Math.round(Number(dailySteps[0]?.avg || 0)),
        weekly: Math.round(Number(weeklySteps[0]?.avg || 0)),
        monthly: Math.round(Number(monthlySteps[0]?.avg || 0)),
        total: 0,
      },
      heartRate: {
        daily: Math.round(Number(dailyHeartRate[0]?.avg || 0)),
        weekly: Math.round(Number(weeklyHeartRate[0]?.avg || 0)),
        monthly: Math.round(Number(monthlyHeartRate[0]?.avg || 0)),
        total: 0,
      },
    }
    if(total){
      const totalGlucose = await db
        .select({
          total: sql<number>`COALESCE(AVG(CAST(${healthMetrics.bloodSugar} AS DECIMAL)), 0)`,
        })
        .from(healthMetrics)
        .where(and(eq(healthMetrics.userId, userId), isNotNull(healthMetrics.bloodSugar)));
      
      const totalWater = await db
        .select({
          total: sql<number>`COALESCE(AVG(CAST(${healthMetrics.waterIntake} AS DECIMAL)), 0)`,
        })
        .from(healthMetrics)
        .where(and(eq(healthMetrics.userId, userId), isNotNull(healthMetrics.waterIntake)));
      
      // Steps are in exercise_logs
      const totalSteps = await db
        .select({
          total: sql<number>`COALESCE(AVG(CAST(${exerciseLogs.steps} AS DECIMAL)), 0)`,
        })
        .from(exerciseLogs)
        .where(and(eq(exerciseLogs.userId, userId), isNotNull(exerciseLogs.steps)));

      const totalHeartRate = await db
        .select({
          total: sql<number>`COALESCE(AVG(${healthMetrics.heartRate}::DECIMAL), 0)`,
        })
        .from(healthMetrics)
        .where(and(eq(healthMetrics.userId, userId), isNotNull(healthMetrics.heartRate)));
      
      result.glucose.total = Number(totalGlucose[0]?.total);
      result.water.total = Number(totalWater[0]?.total);
      result.steps.total = Number(totalSteps[0]?.total);
      result.heartRate.total = Number(totalHeartRate[0]?.total);
    }

    return result;
  }

  async getFilteredMetrics(
    userId: string,
    startDate: Date,
    endDate: Date,
    types: string[],
    limit?: number,
    offset?: number
  ): Promise<{
    bloodSugarRecords: MertricRecord[];
    waterIntakeRecords: MertricRecord[];
    stepsRecords: MertricRecord[];
    heartBeatRecords: MertricRecord[];
    pagination: {
      bloodSugar: HealthPagination;
      waterIntake: HealthPagination;
      steps: HealthPagination;
      heartBeat: HealthPagination;
    };
  }> {

    const baseConditions = [
      eq(healthMetrics.userId, userId),
      sql`${healthMetrics.recordedAt} between ${startDate} and ${endDate}`,
    ];

    const result = {
      bloodSugarRecords: [] as MertricRecord[],
      waterIntakeRecords: [] as MertricRecord[],
      stepsRecords: [] as MertricRecord[],
      heartBeatRecords: [] as MertricRecord[],
      pagination: {
        bloodSugar: { total: 0, limit: limit || 0, offset: offset || 0 },
        waterIntake: { total: 0, limit: limit || 0, offset: offset || 0 },
        steps: { total: 0, limit: limit || 0, offset: offset || 0 },
        heartBeat: { total: 0, limit: limit || 0, offset: offset || 0 },
      }
    };

    // If no types specified, return all types
    const requestedTypes = types.length > 0 ? types : metricTypes;

    // Fetch blood sugar records
    if (requestedTypes.includes(EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE)) {
      const bloodSugarQuery = db
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
        .orderBy(desc(healthMetrics.recordedAt));

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(healthMetrics)
        .where(
          and(
            ...baseConditions,
            isNotNull(healthMetrics.bloodSugar)
          )
        );
      
      result.pagination.bloodSugar.total = count;

      // Apply pagination if provided
      if (limit !== undefined && offset !== undefined) {
        result.bloodSugarRecords = await bloodSugarQuery.limit(limit).offset(offset) as MertricRecord[];
      } else {
        result.bloodSugarRecords = await bloodSugarQuery as MertricRecord[];
      }
    }

    // Fetch water intake records
    if (requestedTypes.includes(EXERCISE_TYPE_ENUM.WATER_INTAKE)) {
      const waterIntakeQuery = db
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
        .orderBy(desc(healthMetrics.recordedAt));

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(healthMetrics)
        .where(
          and(
            ...baseConditions,
            isNotNull(healthMetrics.waterIntake)
          )
        );
      
      result.pagination.waterIntake.total = count;

      // Apply pagination if provided
      if (limit !== undefined && offset !== undefined) {
        result.waterIntakeRecords = await waterIntakeQuery.limit(limit).offset(offset) as MertricRecord[];
      } else {
        result.waterIntakeRecords = await waterIntakeQuery as MertricRecord[];
      }
    }

    // Fetch steps records - steps are in exercise_logs
    if (requestedTypes.includes(EXERCISE_TYPE_ENUM.STEPS)) {
      const stepsBaseConditions = [
        eq(exerciseLogs.userId, userId),
        sql`${exerciseLogs.recordedAt} between ${startDate} and ${endDate}`,
      ];

      const stepsQuery = db
        .select({
          id: exerciseLogs.id,
          userId: exerciseLogs.userId,
          value: exerciseLogs.steps,
          recordedAt: exerciseLogs.recordedAt,
        })
        .from(exerciseLogs)
        .where(
          and(
            ...stepsBaseConditions,
            isNotNull(exerciseLogs.steps)
          )
        )
        .orderBy(desc(exerciseLogs.recordedAt));

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(exerciseLogs)
        .where(
          and(
            ...stepsBaseConditions,
            isNotNull(exerciseLogs.steps)
          )
        );
      
      result.pagination.steps.total = count;

      // Apply pagination if provided
      if (limit !== undefined && offset !== undefined) {
        result.stepsRecords = await stepsQuery.limit(limit).offset(offset) as MertricRecord[];
      } else {
        result.stepsRecords = await stepsQuery as MertricRecord[];
      }
    }

    // Fetch heart rate records
    if (requestedTypes.includes(EXERCISE_TYPE_ENUM.HEART_RATE)) {
      const heartBeatQuery = db
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
        .orderBy(desc(healthMetrics.recordedAt));

      // Get total count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(healthMetrics)
        .where(
          and(
            ...baseConditions,
            isNotNull(healthMetrics.heartRate)
          )
        );
      
      result.pagination.heartBeat.total = count;

      // Apply pagination if provided
      if (limit !== undefined && offset !== undefined) {
        result.heartBeatRecords = await heartBeatQuery.limit(limit).offset(offset) as MertricRecord[];
      } else {
        result.heartBeatRecords = await heartBeatQuery as MertricRecord[];
      }
    }

    return result 
  }

  async createExerciseLogsBatch(data: InsertExerciseLog[]): Promise<ExerciseLog[]> {
    if (data.length === 0) return [];
    
    const logs = await db.insert(exerciseLogs).values(
      data.map(d => ({
        userId: d.userId,
        exerciseType: d.exerciseType,
        exerciseName: d.exerciseName,
        calories: d.calories,
        activityType: d.activityType,
        pace: d.pace || null,
        sets: d.sets || null,
        weight: d.weight || null,
        steps: d.steps ? d.steps.toString() : null,
        muscle: d.muscle || null,
        duration: Number(d.duration) || null,
        repitition: d.repitition || null,
        recordedAt: d.recordedAt ? new Date(d.recordedAt) : new Date()
      }))
    ).returning();
    return logs;
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
    // Note: The exercise_logs structure has changed and no longer uses count-based exercises
    // This method returns 0 as the structure now uses calories, activityType, etc.
    return 0;
  }

  async getStrengthProgressLogs(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ recordedAt: string; value: number; pushups: number; squats: number; chinups: number; situps: number }>> {
    // Note: The exercise_logs structure has changed and no longer uses count-based exercises
    // This method returns empty array as the structure now uses calories, activityType, etc.
    return [];
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
    metricType: MetricType 
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

  async deleteUserTarget(userId: string, metricType: MetricType): Promise<void> {
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

  // Health Insights Methods
  async getHealthInsightsByUserId(userId: string): Promise<HealthInsight | null> {
    const [insight] = await db
      .select()
      .from(healthInsights)
      .where(eq(healthInsights.userId, userId))
      .orderBy(desc(healthInsights.updatedAt))
      .limit(1);
    
    return insight || null;
  }

  async createOrUpdateHealthInsights(
    userId: string,
    data: HealthInsightsData 
  ): Promise<HealthInsight> {
    const existing = await this.getHealthInsightsByUserId(userId);

    if (existing) {
      const [updated] = await db
        .update(healthInsights)
        .set({
          insights: data.insights,
          overallHealthSummary: data.overallHealthSummary,
          whatToDoNext: data.whatToDoNext,
          updatedAt: new Date(),
        })
        .where(eq(healthInsights.id, existing.id))
        .returning();
      
      return updated;
    } else {
      const [created] = await db
        .insert(healthInsights)
        .values({
          userId,
          insights: data.insights,
          overallHealthSummary: data.overallHealthSummary,
          whatToDoNext: data.whatToDoNext,
        })
        .returning();
      
      return created;
    }
  }

  async getCaloriesByActivityType(
    userId: string,
    startDate: Date,
    endDate: Date,
    sameDates: boolean
  ): Promise<{
      totals: {
        cardio: number;
        strength_training: number;
        stretching: number;
        total: number;
      };
      chartData: {
        cardio: Array<ChartData>;
        strength_training: Array<ChartData>;
        stretching: Array<ChartData>;
      };
  }> {

    const caloriesSum =sql<number>`CAST(SUM(${exerciseLogs.calories}) AS INTEGER)` 
    const recordedAtCast = sql<Date>`CAST(${exerciseLogs.recordedAt} AS DATE)`.as('rec') 

    const groupBy = [
      recordedAtCast,
    ]

    const columns =  {
      value: sameDates ? exerciseLogs.calories : caloriesSum,
      recordedAt: sameDates ? exerciseLogs.recordedAt : recordedAtCast
    } 

    const condition = [and(
      eq(exerciseLogs.userId, userId),
      gte(exerciseLogs.recordedAt, startDate)
    )]

     if(!sameDates){
      condition.push(
        lte(exerciseLogs.recordedAt, endDate),
      )
     }

    const promises = []

    const cardioPromise = db
      .select(columns)
      .from(exerciseLogs) 
      .where(and(
        ...condition, 
        eq(exerciseLogs.activityType, ACTIVITY_TYPE_ENUM.CARDIO
      )))

    const strengthTrainingPromise = db
      .select(columns)
      .from(exerciseLogs) 
      .where(and(
        ...condition, 
        eq(exerciseLogs.activityType, ACTIVITY_TYPE_ENUM.STRENGTH_TRAINING
      )))
    
    const stretchingPromise = db
      .select(columns)
      .from(exerciseLogs) 
      .where(and(
        ...condition, 
        eq(exerciseLogs.activityType, ACTIVITY_TYPE_ENUM.STRETCHING
      )))
    
    promises.push(cardioPromise, strengthTrainingPromise, stretchingPromise)
    
    if(!sameDates) {
      for (const promise of promises) {
        promise.groupBy(...groupBy).orderBy(recordedAtCast)
      }
    }


    const [cardio, strengthTraining, stretching] = await Promise.all(promises)


    const cardioCaloriesBurnt = cardio.reduce((acc, curr) => acc + curr.value , 0)
    const strengthTrainingCaloriesBurnt = strengthTraining.reduce((acc, curr) => acc + curr.value , 0)
    const stretchingCaloriesBurnt = stretching.reduce((acc, curr) => acc + curr.value, 0)

    const totalCaloriesBurnt = cardioCaloriesBurnt + strengthTrainingCaloriesBurnt + stretchingCaloriesBurnt

    return {
      totals: {
        cardio: cardioCaloriesBurnt,
        strength_training: strengthTrainingCaloriesBurnt,
        stretching: stretchingCaloriesBurnt,
        total: totalCaloriesBurnt
      },
      chartData :{
        cardio,
        strength_training: strengthTraining,
        stretching: stretching
      }
    }
  }

}

