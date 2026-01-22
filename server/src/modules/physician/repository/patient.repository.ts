import { db } from "../../../app/config/db";
import { eq, and, or, ilike, sql, count, desc, inArray, isNotNull } from "drizzle-orm";
import { users, customerData, diabetesTypeEnum, DIABETES_TYPE } from "../../auth/models/user.schema";
import { USER_ROLES } from "../../auth/models/user.schema";
import { HealthRepository } from "../../health/repository/health.repository";
import { EXERCISE_TYPE_ENUM } from "../../health/models/health.schema";
import { BookingRepository } from "../../booking/repository/booking.repository";
import { bookedSlots, slots, availabilityDate, BOOKING_STATUS_ENUM } from "../../booking/models/booking.schema";
import { FoodRepository } from "../../food/repository/food.repository";
import { PgColumn } from "drizzle-orm/pg-core";
import { physicianData } from "../../auth/models/user.schema";
import {
	getIndicationColor,
	getStatusColor,
	getAlertTagColor,
	INDICATION_COLORS,
	PATIENT_INDICATION,
} from "../utils/patientColors";

export interface PatientListItem {
	id: string;
	name: string;
	age: number;
	condition: string;
	indication: "Needs Attention" | "Stable" | "High Risk";
	indicationColor: string;
}

export interface PatientStats {
	diseaseDistribution: Array<{
		name: string;
		percentage: number;
		color: string;
	}>;
	indicationDistribution: Array<{
		name: string;
		percentage: number;
		color: string;
	}>;
}

export class PatientRepository {
	private healthRepository: HealthRepository;
	private bookingRepository: BookingRepository;
	private foodRepository: FoodRepository;

  private conditionSql = (column: PgColumn) =>sql<string>`
    CASE ${column}
      WHEN 'type1' THEN 'Diabetes Type 1'
      WHEN 'type2' THEN 'Diabetes Type 2'
      WHEN 'gestational' THEN 'Gestational Diabetes'
      WHEN 'prediabetes' THEN 'Prediabetes'
      ELSE ${column}
    END
  `
  private ageSql = sql<number>`EXTRACT(YEAR FROM AGE(${customerData.birthday}))::int`
  private indicationDistirbution = [
    { name: "Stable", percentage: 0, color: "#B2DFDB" },
    { name: "High Risk", percentage: 0, color: "#00856F" },
    { name: "Needs Attention", percentage: 0, color: "#00453A" },
  ]

	constructor() {
		this.healthRepository = new HealthRepository();
		this.bookingRepository = new BookingRepository();
		this.foodRepository = new FoodRepository();
	}

	/**
	 * Get patient IDs where the specified physician is the latest consulting physician.
	 * Only returns patients who have had at least one consultation with the physician,
	 * and the physician is the most recent one to consult with them.
	 * Uses CAST to date for consistent timestamp comparison.
	 */
	private async getPatientIdsWithLatestPhysician(
		physicianId: string,
	): Promise<string[]> {
		// Get all consultations with their dates and physicians
    const latestConsultations = db.$with("latest_consultations").as(
      db.select({
        customerId: bookedSlots.customerId,
        consultationDate: sql`DATE(${availabilityDate.date})`,
        physicianId: availabilityDate.physicianId,
        createdAt: bookedSlots.createdAt,
        rank: sql`
          ROW_NUMBER() OVER (PARTITION BY ${bookedSlots.customerId} ORDER BY ${bookedSlots.createdAt} DESC,
          ${availabilityDate.date} DESC, ${bookedSlots.createdAt} DESC)`.as("rank")
      })
      .from(bookedSlots)
      .innerJoin(slots, eq(bookedSlots.slotId, slots.id))
      .innerJoin(availabilityDate, eq(slots.availabilityId, availabilityDate.id))
      .where(and(
        inArray(bookedSlots.status, [BOOKING_STATUS_ENUM.COMPLETED, BOOKING_STATUS_ENUM.CONFIRMED]),
        eq(availabilityDate.physicianId, physicianId),
      ))
    )

    const consultations = await db
    .with(latestConsultations)
    .select(
      {
        patientId: latestConsultations.customerId
      }
    )
    .from(latestConsultations)

		return consultations.map(c => c.patientId);
	}

	async getPatientsPaginated(params: {
		page: number;
		limit: number;
		search?: string;
		physicianId?: string;
	}): Promise<{
		patients: PatientListItem[];
		total: number;
		page: number;
		limit: number;
	}> {
		const { page, limit, search, physicianId } = params;
		const offset = (page - 1) * limit;

		// Build base where conditions
		let whereCondition = eq(users.role, USER_ROLES.CUSTOMER);

		// If physicianId is provided, filter by latest consulting physician
		if (physicianId) {
			const patientIds = await this.getPatientIdsWithLatestPhysician(physicianId);
			if (patientIds.length === 0) {
				// No patients found for this physician
				return {
					patients: [],
					total: 0,
					page,
					limit,
				};
			}
			whereCondition = and(whereCondition, inArray(users.id, patientIds))!;
		}

		// Add search condition if provided
		if (search) {
			whereCondition = and(
				whereCondition,
				or(
					ilike(users.firstName, `%${search}%`),
					ilike(users.lastName, `%${search}%`),
					ilike(
						sql`${users.firstName} || ' ' || ${users.lastName}`,
						`%${search}%`,
					),
				)!,
			)!;
		}

		// Get total count
		const totalResultPromise = db
			.select({ count: count() })
			.from(users)
			.innerJoin(customerData, eq(users.id, customerData.userId))
			.where(whereCondition);


		// Get paginated results
		const patientsPromise = db
			.select({
				id: users.id,
        name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        indication: sql<PATIENT_INDICATION>`
          CASE ${customerData.diabetesType}
            WHEN 'type1' THEN 'Needs Attention'
            WHEN 'type2' THEN 'Stable'
            WHEN 'gestational' THEN 'High Risk'
            WHEN 'prediabetes' THEN 'Needs Attention'
            ELSE 'Stable'
          END
        `,
				age: this.ageSql ,
				condition: this.conditionSql(customerData.diabetesType) ,
			})
			.from(users)
			.innerJoin(customerData, eq(users.id, customerData.userId))
			.where(whereCondition)
			.limit(limit)
			.offset(offset)
			.orderBy(desc(users.createdAt));

		const [totalResult, patients] = await Promise.all([totalResultPromise, patientsPromise]);
		const total = totalResult[0]?.count || 0;

		// Add colors to patients
		const patientsWithColors: PatientListItem[] = patients.map((patient) => ({
			...patient,
			indicationColor: getIndicationColor(
				patient.indication,
			),
		}));

		return {
			patients: patientsWithColors,
			total,
			page,
			limit,
		};
	}

	async getPatientStats(physicianId?: string): Promise<PatientStats> {
		// Build base where condition
		let whereCondition = eq(users.role, USER_ROLES.CUSTOMER);

		// If physicianId is provided, filter by latest consulting physician
		if (physicianId) {
			const patientIds = await this.getPatientIdsWithLatestPhysician(physicianId);
			if (patientIds.length === 0) {
				// No patients found for this physician
				return {
					diseaseDistribution: [],
          indicationDistribution: this.indicationDistirbution
				};
			}
			whereCondition = and(whereCondition, inArray(users.id, patientIds))!;
		}
		console.log("THe here")

    const totalPatients = db.$with("total_patients").as(
      db.select({
        total: count().as("total")
      })
      .from(users)
      .where(whereCondition)
    )

    const diseaseDistribution= await 
      db
      .with(totalPatients)
      .select({
        name: this.conditionSql(customerData.diabetesType),
				diabetesType: customerData.diabetesType,
        color: sql<string>`
          CASE ${customerData.diabetesType}
            WHEN ${DIABETES_TYPE.TYPE1} THEN '#B2DFDB'
            WHEN ${DIABETES_TYPE.TYPE2} THEN '#00856F'
            WHEN ${DIABETES_TYPE.GESTATIONAL} THEN '#00453A'
            WHEN ${DIABETES_TYPE.PREDIABETES} THEN '#E0F2F1'
            ELSE '#B2DFDB'
          END
        `,
        percentage: sql<number>`
          COALESCE(
            ROUND(
              count(*) * 100 / NULLIF(${totalPatients.total},0)
            ),
            0
          )
        `
      })
			.from(users)
			.innerJoin(customerData, eq(users.id, customerData.userId))
      .crossJoin(totalPatients)
			.where(whereCondition)
			.groupBy(customerData.diabetesType, totalPatients.total)

		return {
			diseaseDistribution,
			indicationDistribution: this.indicationDistirbution,
		};
	}

	/**
	 * Get consultation summaries for a patient
	 * For physicians: returns summaries from consultations with that physician only
	 * For admins: returns summaries from all physicians with physician names
	 */
	private async getConsultationSummaries(
		patientId: string,
		physicianId?: string,
		limit: number = 3,
	): Promise<Array<{
		summary: string;
		date: string;
		physicianName?: string;
	}>> {
		// Base query conditions
		const conditions = [
			eq(bookedSlots.customerId, patientId),
			eq(bookedSlots.status, BOOKING_STATUS_ENUM.COMPLETED),
			isNotNull(bookedSlots.summary),
		];

		// If physicianId is provided, filter by that physician
		if (physicianId) {
			conditions.push(eq(availabilityDate.physicianId, physicianId));
		}

		// Query consultations with summaries
		const consultations = await db
			.select({
				summary: bookedSlots.summary,
				date: availabilityDate.date,
				physicianName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`
			})
			.from(bookedSlots)
			.innerJoin(slots, eq(bookedSlots.slotId, slots.id))
			.innerJoin(availabilityDate, eq(slots.availabilityId, availabilityDate.id))
			.innerJoin(users, eq(availabilityDate.physicianId, users.id))
			.where(and(...conditions))
			.orderBy(desc(availabilityDate.date), desc(bookedSlots.createdAt))
			.limit(limit);


		return consultations
	
		
	}

	async getPatientById(
		patientId: string,
		startDate: string,
		endDate: string,
		physicianId?: string,
	) {
		const [patient] = await db
			.select({
				id: users.id,
				firstName: users.firstName,
				lastName: users.lastName,
				email: users.email,
				birthday: customerData.birthday,
				diagnosisDate: customerData.diagnosisDate,
        age: this.ageSql,
        condition: this.conditionSql(customerData.diabetesType),
				weight: customerData.weight,
				height: customerData.height,
				diabetesType: customerData.diabetesType,
				gender: customerData.gender,
        indication: sql<PATIENT_INDICATION>`
          CASE ${customerData.diabetesType}
            WHEN 'type1' THEN 'Needs Attention'
            WHEN 'type2' THEN 'Stable'
            WHEN 'gestational' THEN 'High Risk'
            WHEN 'prediabetes' THEN 'Needs Attention'
            ELSE 'Stable'
          END
        `,
			})
			.from(users)
			.innerJoin(customerData, eq(users.id, customerData.userId))
			.where(and(eq(users.id, patientId), eq(users.role, USER_ROLES.CUSTOMER)))
			.limit(1);

		if (!patient) {
			return null;
		}

		
		// Calculate alerts dynamically
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const alerts: string[] = [];

		// Check glucose spikes
		const glucoseData = await this.healthRepository.getFilteredMetrics(
			patient.id,
			yesterday.toISOString().split("T")[0],
			new Date().toISOString().split("T")[0],
			[EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE],
		);

		if (glucoseData.bloodSugarRecords.length > 0) {
			const highReadings = glucoseData.bloodSugarRecords.filter((record) => {
				const value =
					typeof record.value === "string"
						? parseFloat(record.value)
						: record.value || 0;
				return value > 180;
			});
			if (highReadings.length > 0) {
				alerts.push("Glucose Spikes");
			}
		}

		// Check activity
		const activityData = await this.healthRepository.getFilteredMetrics(
			patient.id,
			yesterday.toISOString().split("T")[0],
			new Date().toISOString().split("T")[0],
			[EXERCISE_TYPE_ENUM.STEPS],
		);
		if (activityData.stepsRecords.length === 0) {
			alerts.push("No Activity in last 24hrs");
		}

		// Check missed meals
		const today = new Date();
		const todayFoodScan = await this.foodRepository.getConsumedNutrients(
			patient.id,
			today,
		);
		const yesterdayFoodScan = await this.foodRepository.getConsumedNutrients(
			patient.id,
			yesterday,
		);
		if (!todayFoodScan && !yesterdayFoodScan) {
			alerts.push("Missed Meals");
		}

		// Add colors to alerts
		const alertsWithColors = alerts.map((alert) => ({
			text: alert,
			color: getAlertTagColor(alert),
		}));

    const [glucoseTrend, appointments, consultationSummaries] = await Promise.all([
		 await this.healthRepository.getFilteredMetrics(
			patient.id,
			startDate,
			endDate,
			[EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE],
     ),
		 await this.bookingRepository.getUserConsultations(
			patient.id,
			{
				limit: 3,
				skip: 0,
				type: "past",
				physicianId,
			},
		),
		this.getConsultationSummaries(patient.id, physicianId, 100), // Fetch all summaries for "See All" dialog
  ])

		// Format recent notes from consultation summaries
		const recentNotes = consultationSummaries.map((cs) => cs.summary);

		return {
			id: patient.id,
			name: `${patient.firstName} ${patient.lastName}`,
			age: patient.age,
			condition: patient.condition,
			email: patient.email,
			birthday: patient.birthday,
			diagnosisDate: patient.diagnosisDate,
			weight: patient.weight,
			height: patient.height,
			diabetesType: patient.diabetesType,
			gender: patient.gender,
			indication: patient.indication,
			indicationColor: getIndicationColor(patient.indication),
			riskLevel: patient.indication,
			riskLevelColor: getIndicationColor(patient.indication),
			alerts: alertsWithColors,
			glucoseSummary: {
				highs: 67,
				lows: 12,
				timeInRange: 35,
			},
			recentNotes,
			consultationSummaries,
			appointments: appointments.consultations,
			glucoseTrend: glucoseTrend.bloodSugarRecords,
		};
	}

 // TODO: optimize
	async getPatientAlerts(physicianId?: string): Promise<{
		highRisk: Array<{
			id: string;
			name: string;
			age: number;
			diabetesType: string;
			tags: Array<{ text: string; color: string }>;
			status: PATIENT_INDICATION; 
			statusColor: string;
		}>;
		stable: Array<{
			id: string;
			name: string;
			age: number;
			diabetesType: string;
			tags: Array<{ text: string; color: string }>;
			status: PATIENT_INDICATION; 
			statusColor: string;
		}>;
		needsAttention: Array<{
			id: string;
			name: string;
			age: number;
			diabetesType: string;
			tags: Array<{ text: string; color: string }>;
			status: PATIENT_INDICATION; 
			statusColor: string;
		}>;
	}> {
		// Build base where condition
		let whereCondition = eq(users.role, USER_ROLES.CUSTOMER);

		// If physicianId is provided, filter by latest consulting physician
		let patientIds: string[] | null = null;
		if (physicianId) {
			patientIds = await this.getPatientIdsWithLatestPhysician(physicianId);
			if (patientIds.length === 0) {
				return {
				highRisk: [
					{
						id: "hardcoded-1",
						name: "John Smith",
						age: 52,
						diabetesType: "Gestational Diabetes",
						tags: [
							{ text: "Glucose Spikes", color: getAlertTagColor("Glucose Spikes") },
							{ text: "No Activity in last 24hrs", color: getAlertTagColor("No Activity in last 24hrs") },
						],
						status: PATIENT_INDICATION.HIGH_RISK,
						statusColor: getStatusColor(PATIENT_INDICATION.HIGH_RISK),
					},
					{
						id: "hardcoded-2",
						name: "Sarah Johnson",
						age: 45,
						diabetesType: "Gestational Diabetes",
						tags: [
							{ text: "Missed Meals", color: getAlertTagColor("Missed Meals") },
							{ text: "Glucose Spikes", color: getAlertTagColor("Glucose Spikes") },
						],
						status: PATIENT_INDICATION.HIGH_RISK,
						statusColor: getStatusColor(PATIENT_INDICATION.HIGH_RISK),
					},
				],
				stable: [
					{
						id: "hardcoded-3",
						name: "Michael Brown",
						age: 38,
						diabetesType: "Diabetes Type 2",
						tags: [{ text: "No Alerts", color: getAlertTagColor("No Alerts") }],
						status: PATIENT_INDICATION.STABLE,
						statusColor: getStatusColor(PATIENT_INDICATION.STABLE),
					},
					{
						id: "hardcoded-4",
						name: "Emily Davis",
						age: 41,
						diabetesType: "Diabetes Type 2",
						tags: [{ text: "No Alerts", color: getAlertTagColor("No Alerts") }],
						status: PATIENT_INDICATION.STABLE,
						statusColor: getStatusColor(PATIENT_INDICATION.STABLE),
					},
				],
				needsAttention: [
					{
						id: "hardcoded-5",
						name: "David Wilson",
						age: 35,
						diabetesType: "Diabetes Type 1",
						tags: [
							{ text: "No Activity in last 24hrs", color: getAlertTagColor("No Activity in last 24hrs") },
							{ text: "Missed Meals", color: getAlertTagColor("Missed Meals") },
						],
						status: PATIENT_INDICATION.NEEDS_ATTENTION,
						statusColor: getStatusColor(PATIENT_INDICATION.NEEDS_ATTENTION),
					},
					{
						id: "hardcoded-6",
						name: "Lisa Anderson",
						age: 29,
						diabetesType: "Prediabetes",
						tags: [{ text: "Glucose Spikes", color: getAlertTagColor("Glucose Spikes") }],
						status: PATIENT_INDICATION.NEEDS_ATTENTION,
						statusColor: getStatusColor(PATIENT_INDICATION.NEEDS_ATTENTION),
					},
				],
			
				};
			}
			whereCondition = and(whereCondition, inArray(users.id, patientIds))!;
		}

		// Get all patients with their indication
		const allPatients = await db
			.select({
				id: users.id,
				firstName: users.firstName,
				lastName: users.lastName,
				age: this.ageSql,
				diabetesType: customerData.diabetesType,
				condition: this.conditionSql(customerData.diabetesType),
				indication: sql<string>`
					CASE ${customerData.diabetesType}
						WHEN 'type1' THEN 'Needs Attention'
						WHEN 'type2' THEN 'Stable'
						WHEN 'gestational' THEN 'High Risk'
						WHEN 'prediabetes' THEN 'Needs Attention'
						ELSE 'Stable'
					END
				`,
			})
			.from(users)
			.innerJoin(customerData, eq(users.id, customerData.userId))
			.where(whereCondition);

		// Calculate alerts for each patient
		const patientsWithAlerts = await Promise.all(
			allPatients.map(async (patient) => {
				const alerts: string[] = [];

				// Check glucose spikes (last 24 hours)
				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				const glucoseData = await this.healthRepository.getFilteredMetrics(
					patient.id,
					yesterday.toISOString().split("T")[0],
					new Date().toISOString().split("T")[0],
					[EXERCISE_TYPE_ENUM.BLOOD_GLUCOSE],
				);

				if (glucoseData.bloodSugarRecords.length > 0) {
					const highReadings = glucoseData.bloodSugarRecords.filter(
						(record) => {
							const value =
								typeof record.value === "string"
									? parseFloat(record.value)
									: record.value || 0;
							return value > 180; // High threshold
						},
					);
					if (highReadings.length > 0) {
						alerts.push("Glucose Spikes");
					}
				}

				// Check activity in last 24 hours (check steps)
				const activityData = await this.healthRepository.getFilteredMetrics(
					patient.id,
					yesterday.toISOString().split("T")[0],
					new Date().toISOString().split("T")[0],
					[EXERCISE_TYPE_ENUM.STEPS],
				);
				if (activityData.stepsRecords.length === 0) {
					alerts.push("No Activity in last 24hrs");
				}

				// Check missed meals - check if there are food scans in the last 24 hours
				const today = new Date();
				const todayStr = today.toISOString().split("T")[0];
				const yesterdayStr = yesterday.toISOString().split("T")[0];
				
				// Check food scans for today and yesterday
				const todayFoodScan = await this.foodRepository.getConsumedNutrients(patient.id, today);
				const yesterdayFoodScan = await this.foodRepository.getConsumedNutrients(patient.id, yesterday);
				
				// If no food scans in last 24 hours, consider meals missed
				if (!todayFoodScan && !yesterdayFoodScan) {
					alerts.push("Missed Meals");
				}

				const status = patient.indication as PATIENT_INDICATION

				const tags = alerts.length > 0 ? alerts : ["No Alerts"];
				const tagsWithColors = tags.map((tag) => ({
					text: tag,
					color: getAlertTagColor(tag),
				}));

				return {
					id: patient.id,
					name: `${patient.firstName} ${patient.lastName}`,
					age: patient.age,
					diabetesType: patient.condition as string,
					tags: tagsWithColors,
					status,
					statusColor: getStatusColor(status),
					indication: patient.indication,
				};
			}),
		);

		// Group by indication and limit to 4 per group with random selection
		const highRisk = patientsWithAlerts
			.filter((p) => p.indication === PATIENT_INDICATION.HIGH_RISK)
			.sort(() => Math.random() - 0.5)
			.slice(0, 4)
			.map((p) => ({
				id: p.id,
				name: p.name,
				age: p.age,
				diabetesType: p.diabetesType as string,
				tags: p.tags,
				status: PATIENT_INDICATION.HIGH_RISK, 
				statusColor: p.statusColor,
			}));

		const stable = patientsWithAlerts
			.filter((p) => p.indication === PATIENT_INDICATION.STABLE)
			.sort(() => Math.random() - 0.5)
			.slice(0, 4)
			.map((p) => ({
				id: p.id,
				name: p.name,
				age: p.age,
				diabetesType: p.diabetesType as string,
				tags: p.tags,
				status: PATIENT_INDICATION.STABLE,
				statusColor: p.statusColor,
			}));

		const needsAttention = patientsWithAlerts
			.filter((p) => p.indication === PATIENT_INDICATION.NEEDS_ATTENTION)
			.sort(() => Math.random() - 0.5)
			.slice(0, 4)
			.map((p) => ({
				id: p.id,
				name: p.name,
				age: p.age,
				diabetesType: p.diabetesType as string,
				tags: p.tags,
				status: PATIENT_INDICATION.NEEDS_ATTENTION,
				statusColor: p.statusColor,
			}));

		// If no data found, return hardcoded sample data
		if (
			highRisk.length === 0 &&
			stable.length === 0 &&
			needsAttention.length === 0
		) {
			return {
				highRisk: [
					{
						id: "hardcoded-1",
						name: "John Smith",
						age: 52,
						diabetesType: "Gestational Diabetes",
						tags: [
							{ text: "Glucose Spikes", color: getAlertTagColor("Glucose Spikes") },
							{ text: "No Activity in last 24hrs", color: getAlertTagColor("No Activity in last 24hrs") },
						],
						status: PATIENT_INDICATION.HIGH_RISK,
						statusColor: getStatusColor(PATIENT_INDICATION.HIGH_RISK),
					},
					{
						id: "hardcoded-2",
						name: "Sarah Johnson",
						age: 45,
						diabetesType: "Gestational Diabetes",
						tags: [
							{ text: "Missed Meals", color: getAlertTagColor("Missed Meals") },
							{ text: "Glucose Spikes", color: getAlertTagColor("Glucose Spikes") },
						],
						status: PATIENT_INDICATION.HIGH_RISK,
						statusColor: getStatusColor(PATIENT_INDICATION.HIGH_RISK),
					},
				],
				stable: [
					{
						id: "hardcoded-3",
						name: "Michael Brown",
						age: 38,
						diabetesType: "Diabetes Type 2",
						tags: [{ text: "No Alerts", color: getAlertTagColor("No Alerts") }],
						status: PATIENT_INDICATION.STABLE,
						statusColor: getStatusColor(PATIENT_INDICATION.STABLE),
					},
					{
						id: "hardcoded-4",
						name: "Emily Davis",
						age: 41,
						diabetesType: "Diabetes Type 2",
						tags: [{ text: "No Alerts", color: getAlertTagColor("No Alerts") }],
						status: PATIENT_INDICATION.STABLE,
						statusColor: getStatusColor(PATIENT_INDICATION.STABLE),
					},
				],
				needsAttention: [
					{
						id: "hardcoded-5",
						name: "David Wilson",
						age: 35,
						diabetesType: "Diabetes Type 1",
						tags: [
							{ text: "No Activity in last 24hrs", color: getAlertTagColor("No Activity in last 24hrs") },
							{ text: "Missed Meals", color: getAlertTagColor("Missed Meals") },
						],
						status: PATIENT_INDICATION.NEEDS_ATTENTION,
						statusColor: getStatusColor(PATIENT_INDICATION.NEEDS_ATTENTION),
					},
					{
						id: "hardcoded-6",
						name: "Lisa Anderson",
						age: 29,
						diabetesType: "Prediabetes",
						tags: [{ text: "Glucose Spikes", color: getAlertTagColor("Glucose Spikes") }],
						status: PATIENT_INDICATION.NEEDS_ATTENTION,
						statusColor: getStatusColor(PATIENT_INDICATION.NEEDS_ATTENTION),
					},
				],
			};
		}

		return {
			highRisk,
			stable,
			needsAttention,
		};
	}
}
