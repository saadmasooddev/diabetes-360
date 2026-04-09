import {
	PatientRepository,
	type PatientStats,
} from "../repository/patient.repository";
import { NotFoundError } from "../../../shared/errors";
import { BookingService } from "../../booking/service/booking.service";

export class PatientService {
	private patientRepository: PatientRepository;
	private bookingService: BookingService;

	constructor() {
		this.patientRepository = new PatientRepository();
		this.bookingService = new BookingService();
	}

	async getPatientsPaginated(params: {
		page: number;
		offset: number;
		limit: number;
		search?: string;
		physicianId?: string;
	}) {
		return await this.patientRepository.getPatientsPaginated(params);
	}

	async getPatientStats(physicianId?: string): Promise<PatientStats> {
		return await this.patientRepository.getPatientStats(physicianId);
	}

	async getPatientById(
		patientId: string,
		startDate: string,
		endDate: string,
		physicianId?: string,
	) {
		const patient = await this.patientRepository.getPatientById(
			patientId,
			startDate,
			endDate,
			physicianId,
		);
		if (!patient) {
			throw new NotFoundError("Patient not found");
		}
		return patient;
	}

	async getPatientAlerts(physicianId?: string) {
		return await this.patientRepository.getPatientAlerts(physicianId);
	}

	async getPatientsHome(physicianId: string, date: string) {
		const appointments = await this.bookingService.getAppointments(
			physicianId,
			false,
			{
				limit: 3,
				skip: 0,
				startDate: date,
				endDate: date,
			},
		);

		const alerts = await this.patientRepository.getPatientAlerts(physicianId);
		const slicedAlerts = [
			...alerts.highRisk,
			...alerts.needsAttention,
			...alerts.stable,
		].slice(0, 3);
		const slicedAppointments = appointments.appointments.slice(0, 3);

		return {
			alerts: slicedAlerts,
			appointments: slicedAppointments,
		};
	}
}
