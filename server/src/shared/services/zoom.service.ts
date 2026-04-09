import { BookingRepository } from "server/src/modules/booking/repository/booking.repository";
import { config } from "../../app/config";
import { emailService } from "../services/email.service";
import { DateManager } from "../utils/utils";

export type CreateMeetingOptions = {
	/** ISO 8601 start time (e.g. 2024-01-15T09:00:00.000Z) */
	startTime: string;
	/** Duration in minutes (used as slot size) */
	durationMinutes: number;
	topic?: string;
};

export type CreateMeetingResult = {
	joinUrl: string;
	startUrl: string;
};

export class ZoomService {
	private readonly bookingRepository: BookingRepository;

	private readonly ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
	private readonly ZOOM_API_BASE = "https://api.zoom.us/v2";
	private accessToken: string | null = null;
	private tokenExpiresAt = 0;

	constructor() {
		this.bookingRepository = new BookingRepository();
	}
	private isConfigured(): boolean {
		return !!(
			config.zoom.accountId &&
			config.zoom.clientId &&
			config.zoom.clientSecret
		);
	}

	private async getAccessToken(): Promise<string> {
		if (!this.isConfigured()) {
			throw new Error(
				"Zoom is not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET.",
			);
		}
		const now = Date.now();
		if (this.accessToken && this.tokenExpiresAt > now + 60_000) {
			return this.accessToken;
		}
		const credentials = Buffer.from(
			`${config.zoom.clientId}:${config.zoom.clientSecret}`,
		).toString("base64");
		const body = new URLSearchParams({
			grant_type: "account_credentials",
			account_id: config.zoom.accountId,
		});
		const res = await fetch(this.ZOOM_TOKEN_URL, {
			method: "POST",
			headers: {
				Authorization: `Basic ${credentials}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: body.toString(),
		});
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Zoom token request failed: ${res.status} ${text}`);
		}
		const data = (await res.json()) as {
			access_token: string;
			expires_in: number;
		};
		this.accessToken = data.access_token;
		this.tokenExpiresAt = now + data.expires_in * 1000;
		return this.accessToken;
	}

	async createMeeting(
		options: CreateMeetingOptions,
	): Promise<CreateMeetingResult | null> {
		if (!this.isConfigured()) {
			return null;
		}
		const token = await this.getAccessToken();
		const body = {
			topic: options.topic ?? "Diabetes 360 Consultation",
			type: 2,
			start_time: options.startTime,
			duration: options.durationMinutes,
			timezone: "UTC",
			settings: {
				join_before_host: true,
				waiting_room: false,
			},
		};
		const res = await fetch(`${this.ZOOM_API_BASE}/users/me/meetings`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Zoom create meeting failed: ${res.status} ${text}`);
		}
		const data = (await res.json()) as {
			join_url: string;
			start_url: string;
		};
		return {
			joinUrl: data.join_url,
			startUrl: data.start_url,
		};
	}

	async processMeetingLinksJob(): Promise<void> {
		await this.bookingRepository.updateBookedSlotMeetingLinkTransaction(
			async (tx, slot) => {
				try {
					const patientName = `${slot.patientFirstName} ${slot.patientLastName}`;
					const physicianName = `${slot.physicianFirstName} ${slot.physicianLastName}`;
					const startTimeIso = this.bookingRepository.getStartTimeISO(
						slot.availabilityDate,
						slot.slotStartTime,
					);
					const result = await zoomService.createMeeting({
						startTime: startTimeIso,
						durationMinutes: slot.slotSizeMinutes,
						topic: `Diabetes 360 - ${physicianName} & ${patientName}`,
					});

					if (!result) {
						throw new Error(
							`Zoom not configured; skipping booked slot ${slot.bookedSlotId}`,
						);
					}
					// Use join URL for both parties (participants join via same link; host can use start_url if needed)
					const meetingLink = result.joinUrl;
					await emailService.sendMeetingLinkEmail({
						to: slot.patientEmail,
						recipientName: patientName,
						patientName,
						physicianName,
						bookingId: slot.bookedSlotId,
						startTimeIso,
						durationMinutes: slot.slotSizeMinutes,
						isPhysician: false,
					});

					await emailService.sendMeetingLinkEmail({
						to: slot.physicianEmail,
						recipientName: physicianName,
						patientName,
						physicianName,
						bookingId: slot.bookedSlotId,
						startTimeIso,
						durationMinutes: slot.slotSizeMinutes,
						isPhysician: true,
					});

					await this.bookingRepository.updateBookedSlotMeetingLink(
						slot.bookedSlotId,
						meetingLink,
						tx,
					);
				} catch (err) {
					console.error(
						`[meeting-link-job] Failed for booked slot ${slot.bookedSlotId}:`,
						err instanceof Error ? err.message : err,
					);
				}
			},
		);
	}
}

export const zoomService = new ZoomService();
