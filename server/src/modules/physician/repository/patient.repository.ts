import { db } from "../../../app/config/db";
import {
	eq,
	and,
	or,
	ilike,
	sql,
	count,
	desc,
	inArray,
	isNotNull,
} from "drizzle-orm";
import {
	users,
	customerData,
	diabetesTypeEnum,
	DIABETES_TYPE,
} from "../../auth/models/user.schema";
import { USER_ROLES } from "../../auth/models/user.schema";
import { HealthRepository } from "../../health/repository/health.repository";
import {
	METRIC_TYPE_ENUM,
	MertricRecord,
	healthMetrics,
} from "../../health/models/health.schema";
import { BookingRepository } from "../../booking/repository/booking.repository";
import {
	bookedSlots,
	slots,
	availabilityDate,
	BOOKING_STATUS_ENUM,
	BOOKING_TYPE_QUERY_ENUM,
} from "../../booking/models/booking.schema";
import { FoodRepository } from "../../food/repository/food.repository";
import { PgColumn } from "drizzle-orm/pg-core";
import {
	getIndicationColor,
	getStatusColor,
	getAlertTagColor,
	PATIENT_INDICATION,
	getDiseaseColor,
} from "../utils/patientColors";
import { config } from "server/src/app/config";
import { MedicalRepository } from "../../medical/repository/medical.repository";
import { medications } from "../../medical/models/medical.schema";

export interface PatientListItem {
	id: string;
	name: string;
	age: number;
	condition: string;
	status: "Needs Attention" | "Stable" | "High Risk";
	statusColor: string;
	latestBloodGlucose?: number | null;
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

export interface PatientAlert {
	id: string;
	name: string;
	age: number;
	diabetesType: string;
	tags: Array<{ text: string; color: string }>;
	status: PATIENT_INDICATION;
	statusColor: string;
}

export class PatientRepository {
	private healthRepository: HealthRepository;
	private bookingRepository: BookingRepository;
	private foodRepository: FoodRepository;
	private static readonly MIN_STEPS_FOR_ACTIVITY = 500;
	private static readonly OVER_EATING_RATIO = 1.2;
	private static readonly UNDER_EATING_RATIO = 0.7;

	static bloodSugarAlert = (value: number): PATIENT_INDICATION => {
		if (value >= 250 || value <= 54) {
			return PATIENT_INDICATION.HIGH_RISK;
		}
		if ((value >= 180 && value <= 250) || (value <= 70 && value >= 54)) {
			return PATIENT_INDICATION.NEEDS_ATTENTION;
		}
		return PATIENT_INDICATION.STABLE;
	};

	private diabetesTypeSql = (column: PgColumn) => sql<DIABETES_TYPE>`
    CASE ${column.name}
      WHEN 'type1' THEN 'Diabetes Type 1'
      WHEN 'type2' THEN 'Diabetes Type 2'
      WHEN 'gestational' THEN 'Gestational Diabetes'
      WHEN 'prediabetes' THEN 'Prediabetes'
      ELSE 'other'
    END
  `;
	private ageSql =
		sql<number>`EXTRACT(YEAR FROM AGE(${customerData.birthday}))::int`;
	private indicationDistirbution = [
		{ name: "Stable", percentage: 0, color: "#B2DFDB" },
		{ name: "High Risk", percentage: 0, color: "#00856F" },
		{ name: "Needs Attention", percentage: 0, color: "#00453A" },
	];

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
			db
				.select({
					customerId: bookedSlots.customerId,
					consultationDate: sql`DATE(${availabilityDate.date})`,
					physicianId: availabilityDate.physicianId,
					createdAt: bookedSlots.createdAt,
					rank: sql`
          ROW_NUMBER() OVER (PARTITION BY ${bookedSlots.customerId} ORDER BY ${bookedSlots.createdAt} DESC,
          ${availabilityDate.date} DESC, ${bookedSlots.createdAt} DESC)`.as(
						"rank",
					),
				})
				.from(bookedSlots)
				.innerJoin(slots, eq(bookedSlots.slotId, slots.id))
				.innerJoin(
					availabilityDate,
					eq(slots.availabilityId, availabilityDate.id),
				)
				.where(
					and(
						inArray(bookedSlots.status, [
							BOOKING_STATUS_ENUM.COMPLETED,
							BOOKING_STATUS_ENUM.CONFIRMED,
						]),
						eq(availabilityDate.physicianId, physicianId),
					),
				),
		);

		const consultations = await db
			.with(latestConsultations)
			.select({
				patientId: latestConsultations.customerId,
			})
			.from(latestConsultations);

		return consultations.map((c) => c.patientId);
	}

	async getPatientsPaginated(params: {
		page: number;
		offset: number;
		limit: number;
		search?: string;
		physicianId?: string;
	}): Promise<{
		patients: PatientListItem[];
		total: number;
		page: number;
		limit: number;
	}> {
		const { offset, limit, page, search, physicianId } = params;

		// Build base where conditions
		let whereCondition = eq(users.role, USER_ROLES.CUSTOMER);

		// If physicianId is provided, filter by latest consulting physician
		if (physicianId) {
			const patientIds =
				await this.getPatientIdsWithLatestPhysician(physicianId);
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
				firstName: users.firstName,
				lastName: users.lastName,
				name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
				age: this.ageSql,
				condition: this.diabetesTypeSql(customerData.diabetesType),
			})
			.from(users)
			.innerJoin(customerData, eq(users.id, customerData.userId))
			.where(whereCondition)
			.limit(limit)
			.offset(offset)
			.orderBy(desc(users.createdAt));

		const [totalResult, patients] = await Promise.all([
			totalResultPromise,
			patientsPromise,
		]);
		const total = totalResult[0]?.count || 0;

		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayStr = yesterday.toISOString().split("T")[0];
		const todayStr = new Date().toISOString().split("T")[0];

		const patientWithAlerts = await Promise.all(
			patients.map(async (p) => {
				const [alert, latestBloodGlucose] = await Promise.all([
					this.patientAlert(
						{ ...p, diabetesType: p.condition as DIABETES_TYPE },
						yesterdayStr,
						todayStr,
					),
					this.healthRepository.getLatestBloodGlucose(p.id),
				]);
				return {
					...p,
					status: alert.status,
					statusColor: alert.statusColor,
					latestBloodGlucose,
				};
			}),
		);

		return {
			patients: patientWithAlerts,
			total,
			page,
			limit,
		};
	}

	async getPatientStats(physicianId?: string): Promise<PatientStats> {
		// Build base where condition
		let whereCondition = eq(users.role, USER_ROLES.CUSTOMER);
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayStr = yesterday.toISOString().split("T")[0];
		const todayStr = new Date().toISOString().split("T")[0];

		// If physicianId is provided, filter by latest consulting physician
		if (physicianId) {
			const patientIds =
				await this.getPatientIdsWithLatestPhysician(physicianId);
			if (patientIds.length === 0) {
				return {
					diseaseDistribution: [],
					indicationDistribution: this.indicationDistirbution,
				};
			}
			whereCondition = and(
				whereCondition,
				inArray(users.id, patientIds),
				sql`DATE(${healthMetrics.recordedAt}) BETWEEN DATE(${yesterdayStr}) AND DATE(${todayStr})`,
				isNotNull(healthMetrics.bloodSugar),
			)!;
		}

		const patients = await db
			.select({
				id: users.id,
				name: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
				diabetesType: this.diabetesTypeSql(customerData.diabetesType),
				bloodSugar: healthMetrics.bloodSugar,
			})
			.from(users)
			.innerJoin(customerData, eq(users.id, customerData.userId))
			.innerJoin(healthMetrics, eq(users.id, healthMetrics.userId))
			.groupBy(users.id, customerData.diabetesType, healthMetrics.bloodSugar)
			.where(whereCondition);

		type PatientInfo = {
			name: string;
			bloodSugar: number;
			diabetesType: DIABETES_TYPE;
		};
		const patientIndicationMap = new Map<string, PatientInfo[]>();
		const patientDiseaseDistributionMap = new Map<DIABETES_TYPE, number>();

		for (const patient of patients) {
			if (!patient.bloodSugar) continue;
			const patientInfo = patientIndicationMap.get(patient.id) || [];
			patientInfo.push({
				name: patient.name,
				bloodSugar: parseFloat(patient.bloodSugar),
				diabetesType: patient.diabetesType,
			});
			patientDiseaseDistributionMap.set(
				patient.diabetesType,
				patientDiseaseDistributionMap.get(patient.diabetesType) || 0 + 1,
			);

			patientIndicationMap.set(patient.id, patientInfo);
		}

		const patientIndicationDistribution: PATIENT_INDICATION[] = [];

		patientIndicationMap.forEach((patientData) => {
			const worst = this.getPatientWorstIndicationStatus(
				patientData.map((p) => ({ value: p.bloodSugar })),
			);
			patientIndicationDistribution.push(worst);
		});

		const indicationDistribution = patientIndicationDistribution.reduce(
			(acc, indication) => {
				acc[indication] = (acc[indication] || 0) + 1;
				return acc;
			},
			{} as Record<PATIENT_INDICATION, number>,
		);
		let totalIndications = 0;
		for (const key in indicationDistribution) {
			totalIndications += indicationDistribution[key as PATIENT_INDICATION];
		}

		let totalDiseaseDistribution = 0;
		patientDiseaseDistributionMap.forEach((value) => {
			totalDiseaseDistribution += value;
		});

		return {
			diseaseDistribution: Array.from(patientDiseaseDistributionMap).map(
				([disease, count]) => ({
					name: disease,
					percentage: Math.round((count / totalDiseaseDistribution) * 100),
					color: getDiseaseColor(disease),
				}),
			),
			indicationDistribution: Object.entries(indicationDistribution).map(
				([indication, count]) => ({
					name: indication,
					percentage: Math.round((count / totalIndications) * 100),
					color: getIndicationColor(indication as PATIENT_INDICATION),
				}),
			),
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
	): Promise<
		Array<{
			summary: string;
			date: string;
			physicianName?: string;
		}>
	> {
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
				physicianName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
				medications: medications.medicines,
			})
			.from(bookedSlots)
			.innerJoin(slots, eq(bookedSlots.slotId, slots.id))
			.innerJoin(
				availabilityDate,
				eq(slots.availabilityId, availabilityDate.id),
			)
			.innerJoin(users, eq(availabilityDate.physicianId, users.id))
			.leftJoin(medications, eq(bookedSlots.id, medications.consultationId))
			.where(and(...conditions))
			.orderBy(desc(availabilityDate.date), desc(bookedSlots.createdAt))
			.limit(limit);

		return consultations;
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
				age: this.ageSql,
				condition: this.diabetesTypeSql(customerData.diabetesType),
				weight: customerData.weight,
				height: customerData.height,
				diabetesType: customerData.diabetesType,
				gender: customerData.gender,
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
		const yesterdayStr = yesterday.toISOString().split("T")[0];
		const todayStr = new Date().toISOString().split("T")[0];

		const [
			glucoseTrend,
			appointments,
			upcomingAppointments,
			consultationSummaries,
			hba1cTrend,
			quickLogsWeek,
			dietTrend,
			macros,
			latestBloodGlucose,
		] = await Promise.all([
			this.healthRepository.getFilteredMetrics(patient.id, startDate, endDate, [
				METRIC_TYPE_ENUM.BLOOD_GLUCOSE,
			]),
			this.bookingRepository.getUserConsultations(patient.id, {
				limit: undefined,
				skip: 0,
				type: BOOKING_TYPE_QUERY_ENUM.PAST,
				physicianId,
				date: new Date().toISOString(),
				timeZone: config.defaults.timezone,
			}),
			this.bookingRepository.getUserConsultations(patient.id, {
				limit: 3,
				skip: 0,
				type: BOOKING_TYPE_QUERY_ENUM.UPCOMING,
				physicianId,
				date: new Date().toISOString(),
				timeZone: config.defaults.timezone,
			}),
			this.getConsultationSummaries(patient.id, physicianId, 100),
			this.healthRepository.getHba1cTrend(patient.id, startDate, endDate),
			this.healthRepository.getQuickLogsForDateRange(
				patient.id,
				startDate,
				endDate,
			),
			this.foodRepository.getDietTrendLast7Days(patient.id),
			this.foodRepository.getMacrosLast7Days(patient.id),
			this.healthRepository.getLatestBloodGlucose(patient.id),
		]);

		const patientAlert = await this.patientAlert(
			patient,
			yesterdayStr,
			todayStr,
		);

		// Format recent notes from consultation summaries
		const recentNotes = consultationSummaries.map((cs) => cs.summary);

		const sleepPattern = this.inferSleepPatternFromQuickLogs(quickLogsWeek);

		return {
			id: patient.id,
			name: `${patient.firstName} ${patient.lastName}`,
			age: patient.age,
			condition: patient.condition,
			email: patient.email,
			birthday: patient.birthday,
			weight: patient.weight,
			height: patient.height,
			diabetesType: patient.diabetesType,
			gender: patient.gender,
			indication: patientAlert.status,
			indicationColor: patientAlert.statusColor,
			riskLevel: patientAlert.status,
			riskLevelColor: patientAlert.statusColor,
			alerts: patientAlert.tags,
			glucoseSummary: this.getPatientGlucoseRangeSummary(
				glucoseTrend.bloodSugarRecords,
			),
			recentNotes,
			consultationSummaries,
			appointments: appointments.consultations,
			upcomingAppointments: upcomingAppointments.consultations,
			glucoseTrend: glucoseTrend.bloodSugarRecords,
			latestBloodGlucose,
			hba1cTrend,
			quickLogsWeek,
			dietTrend,
			macros,
			sleepPattern,
		};
	}

	private inferSleepPatternFromQuickLogs(
		quickLogs: Array<{ logDate: string; sleepDuration: string | null }>,
	): {
		byDay: Array<{ day: string; hours: number; quality: string }>;
		avgQuality: string;
	} {
		const durationToHours: Record<string, number> = {
			less_5: 4,
			"5_7": 6,
			more_7: 8,
		};
		const durationToQuality: Record<string, string> = {
			less_5: "Poor",
			"5_7": "Moderate",
			more_7: "Good",
		};
		const byDay = quickLogs.map((q) => {
			const hours = q.sleepDuration
				? (durationToHours[q.sleepDuration] ?? 6)
				: 0;
			const quality = q.sleepDuration
				? (durationToQuality[q.sleepDuration] ?? "Unknown")
				: "No data";
			return { day: q.logDate, hours, quality };
		});
		const withData = byDay.filter((d) => d.hours > 0);
		const avgQuality =
			withData.length === 0
				? "No data"
				: withData.filter((d) => d.quality === "Good").length >=
						withData.length / 2
					? "Good"
					: withData.filter((d) => d.quality === "Poor").length >
							withData.length / 2
						? "Poor"
						: "Moderate";
		return { byDay, avgQuality };
	}
	private getPatientWorstIndicationStatus(
		records: { value: number | null }[],
	): PATIENT_INDICATION {
		let bloodSugarStatus: PATIENT_INDICATION = PATIENT_INDICATION.STABLE;
		if (records.length > 0) {
			let worst: PATIENT_INDICATION = PATIENT_INDICATION.STABLE;
			for (const record of records) {
				const value =
					typeof record.value === "string"
						? parseFloat(record.value)
						: Number(record.value) || 0;
				const indication = PatientRepository.bloodSugarAlert(value);
				if (indication === PATIENT_INDICATION.HIGH_RISK)
					worst = PATIENT_INDICATION.HIGH_RISK;
				else if (
					indication === PATIENT_INDICATION.NEEDS_ATTENTION &&
					worst !== PATIENT_INDICATION.HIGH_RISK
				)
					worst = PATIENT_INDICATION.NEEDS_ATTENTION;
			}
			bloodSugarStatus = worst;
			return bloodSugarStatus;
		}
		return bloodSugarStatus;
	}

	private getPatientGlucoseRangeSummary(
		glucoseDate: { value: number | null }[],
	): {
		highs: number;
		lows: number;
		timeInRange: number;
	} {
		const alerts = glucoseDate
			.filter((g) => g.value !== null)
			.map((g) => PatientRepository.bloodSugarAlert(g.value as number));

		const highs = Math.round(
			(alerts.filter((a) => a === PATIENT_INDICATION.HIGH_RISK).length /
				alerts.length) *
				100,
		);
		const lows = Math.round(
			(alerts.filter((a) => a === PATIENT_INDICATION.NEEDS_ATTENTION).length /
				alerts.length) *
				100,
		);
		const timeInRange = Math.round(
			(alerts.filter((a) => a === PATIENT_INDICATION.STABLE).length /
				alerts.length) *
				100,
		);

		return {
			highs,
			lows,
			timeInRange,
		};
	}

	private async patientAlert(
		patient: {
			id: string;
			firstName: string;
			lastName: string;
			age: number;
			diabetesType: DIABETES_TYPE;
			condition: string;
		},
		yesterdayStr: string,
		todayStr: string,
	) {
		const alerts: string[] = [];
		// 1) Blood glucose (last 24h) – status and "Glucose Spikes" tag
		const glucoseData = await this.healthRepository.getFilteredMetrics(
			patient.id,
			yesterdayStr,
			todayStr,
			[METRIC_TYPE_ENUM.BLOOD_GLUCOSE],
		);
		const worst = this.getPatientWorstIndicationStatus(
			glucoseData.bloodSugarRecords,
		);
		if (worst !== PATIENT_INDICATION.STABLE) {
			alerts.push("Glucose Fluctuations");
		}

		// 2) Activity (steps in last 24h)
		const activityData = await this.healthRepository.getFilteredMetrics(
			patient.id,
			yesterdayStr,
			todayStr,
			[METRIC_TYPE_ENUM.STEPS],
		);
		const totalSteps = activityData.stepsRecords.reduce((sum, r) => {
			const v =
				typeof r.value === "string"
					? parseFloat(r.value)
					: Number(r.value) || 0;
			return sum + v;
		}, 0);
		if (
			activityData.stepsRecords.length === 0 ||
			totalSteps < PatientRepository.MIN_STEPS_FOR_ACTIVITY
		) {
			alerts.push("No Activity in last 24hrs");
		}

		// 3) Meals from loggedMeals: count and over/under eating vs recommendation
		const mealsCount = await this.foodRepository.getLoggedMealsCount(
			patient.id,
			yesterdayStr,
			todayStr,
		);
		if (mealsCount === 0) {
			alerts.push("Missed Meals");
		}

		const todayConsumed = await this.foodRepository.getConsumedNutrients(
			patient.id,
			todayStr,
		);
		const recommendation =
			await this.foodRepository.getDailyNutrientRecommendation(
				patient.id,
				todayStr,
			);
		if (recommendation) {
			const recCal = parseFloat(recommendation.calories?.toString() || "0");
			const consumedCal = todayConsumed
				? parseFloat(todayConsumed.calories?.toString() || "0")
				: 0;
			if (recCal > 0) {
				if (consumedCal > recCal * PatientRepository.OVER_EATING_RATIO) {
					alerts.push("Over Eating");
				}
				if (
					consumedCal > 0 &&
					consumedCal < recCal * PatientRepository.UNDER_EATING_RATIO
				) {
					alerts.push("Under Eating");
				}
			}
		}

		const bloodSugarStatus = worst;
		const status = bloodSugarStatus;
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
			indication: status,
		};
	}

	async getPatientAlerts(physicianId?: string): Promise<{
		highRisk: PatientAlert[];
		stable: PatientAlert[];
		needsAttention: PatientAlert[];
	}> {
		// Build base where condition
		let whereCondition = eq(users.role, USER_ROLES.CUSTOMER);

		// If physicianId is provided, filter by latest consulting physician
		if (physicianId) {
			const patientIds =
				await this.getPatientIdsWithLatestPhysician(physicianId);
			if (patientIds.length === 0) {
				return {
					highRisk: [],
					stable: [],
					needsAttention: [],
				};
			}
			whereCondition = and(whereCondition, inArray(users.id, patientIds))!;
		}

		// Date range: last 24h = yesterday and today (cast to date for consistency)
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		const yesterdayStr = yesterday.toISOString().split("T")[0];
		const todayStr = today.toISOString().split("T")[0];

		// Get all patients with base indication from diabetes type (fallback when no glucose data)
		const allPatients = await db
			.select({
				id: users.id,
				firstName: users.firstName,
				lastName: users.lastName,
				age: this.ageSql,
				diabetesType: customerData.diabetesType,
				condition: this.diabetesTypeSql(customerData.diabetesType),
			})
			.from(users)
			.innerJoin(customerData, eq(users.id, customerData.userId))
			.where(whereCondition);

		// Calculate alerts per patient: status from bloodSugarAlert; tags from glucose, activity, meals
		const patientsWithAlerts = await Promise.all(
			allPatients.map(async (patient) =>
				this.patientAlert(patient, yesterdayStr, todayStr),
			),
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
				diabetesType: p.diabetesType,
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

		return {
			highRisk,
			stable,
			needsAttention,
		};
	}
}
